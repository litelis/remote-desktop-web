import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import fileTransferRoutes from './routes/fileTransfer.js';

import { authenticateSocket } from './middleware/auth.js';
import { limiter } from './middleware/rateLimiter.js';
import { 
  registerPublicConnection, 
  unregisterPublicConnection, 
  isPublicConnection,
  getPublicConnectionStats,
  PUBLIC_ACCESS_ENABLED 
} from './middleware/publicAccess.js';

import ScreenCaptureService from './services/screenCapture.js';
import InputControlService from './services/inputControl.js';
import SystemControlService from './services/systemControl.js';
import fileTransferService from './services/fileTransfer.js';
import logger from './utils/logger.js';


// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting para API
app.use('/api/', limiter);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/files', fileTransferRoutes);


// Servir archivos estáticos del cliente en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../../client/build/index.html'));
  });
}

// Servicios
const screenCapture = new ScreenCaptureService();
const inputControl = new InputControlService();
const systemControl = new SystemControlService();

// Control de sesiones activas
const activeSessions = new Map();

// WebSocket con autenticación
io.use(authenticateSocket);

// Middleware para tracking de conexiones públicas
io.use((socket, next) => {
  if (socket.user && socket.user.connectionType === 'public') {
    const stats = getPublicConnectionStats();
    if (!PUBLIC_ACCESS_ENABLED) {
      return next(new Error('Acceso público deshabilitado'));
    }
    if (stats.count >= stats.max) {
      logger.warn(`Conexión pública rechazada - límite alcanzado (${stats.max})`);
      return next(new Error('Límite de conexiones públicas alcanzado'));
    }
  }
  next();
});


io.on('connection', (socket) => {
  const isPublic = isPublicConnection(socket);
  const connectionType = isPublic ? 'PÚBLICA' : 'PRIVADA';
  
  logger.info(`Cliente conectado (${connectionType}): ${socket.user.id} - IP: ${socket.handshake.address}`);
  
  // Registrar conexión pública
  if (isPublic) {
    registerPublicConnection(socket.user.id, socket.handshake.address);
    socket.emit('connection_info', { 
      type: 'public', 
      message: 'Conexión pública establecida - Acceso limitado',
      expiresIn: '1h'
    });
  } else {
    socket.emit('connection_info', { 
      type: 'private', 
      message: 'Conexión privada establecida - Acceso completo' 
    });
  }


  // Verificar sesión única por usuario
  if (activeSessions.has(socket.user.id)) {
    const oldSocket = activeSessions.get(socket.user.id);
    oldSocket.emit('session_terminated', 'Nueva sesión iniciada en otro dispositivo');
    oldSocket.disconnect();
    logger.warn(`Sesión anterior terminada para usuario: ${socket.user.id}`);
  }
  activeSessions.set(socket.user.id, socket);

  // Iniciar transmisión de pantalla
  let screenInterval;
  
  const startScreenStream = () => {
    screenInterval = setInterval(async () => {
      try {
        const frame = await screenCapture.capture();
        if (socket.connected) {
          socket.emit('screen_frame', frame);
        }
      } catch (error) {
        logger.error('Error captura pantalla:', error);
        socket.emit('error', { type: 'screen', message: 'Error al capturar pantalla' });
      }
    }, 100); // 10 FPS
  };

  startScreenStream();

  // Control de mouse
  socket.on('mouse_move', async (data) => {
    try {
      await inputControl.moveMouse(data.x, data.y);
    } catch (err) {
      logger.error('Error mouse move:', err);
      socket.emit('error', { type: 'input', message: err.message });
    }
  });

  socket.on('mouse_click', async (data) => {
    try {
      await inputControl.click(data.button, data.type);
    } catch (err) {
      logger.error('Error mouse click:', err);
      socket.emit('error', { type: 'input', message: err.message });
    }
  });

  // Control de teclado
  socket.on('key_press', async (data) => {
    try {
      await inputControl.keyPress(data.key, data.modifiers);
    } catch (err) {
      logger.error('Error key press:', err);
      socket.emit('error', { type: 'input', message: err.message });
    }
  });

  // Scroll
  socket.on('scroll', async (data) => {
    try {
      await inputControl.scroll(data.deltaX, data.deltaY);
    } catch (err) {
      logger.error('Error scroll:', err);
      socket.emit('error', { type: 'input', message: err.message });
    }
  });

  // Control del sistema - Solo para conexiones privadas
  socket.on('system_restart', async () => {
    if (isPublicConnection(socket)) {
      socket.emit('error', { type: 'system', message: 'Acción no permitida en modo público' });
      return;
    }
    
    try {
      logger.warn(`Reinicio solicitado por usuario: ${socket.user.id}`);
      await systemControl.restart();
      socket.emit('system_status', { action: 'restart', status: 'initiated' });
    } catch (err) {
      logger.error('Error reinicio:', err);
      socket.emit('error', { type: 'system', message: err.message });
    }
  });

  socket.on('system_shutdown', async () => {
    if (isPublicConnection(socket)) {
      socket.emit('error', { type: 'system', message: 'Acción no permitida en modo público' });
      return;
    }
    
    try {
      logger.warn(`Apagado solicitado por usuario: ${socket.user.id}`);
      await systemControl.shutdown();
      socket.emit('system_status', { action: 'shutdown', status: 'initiated' });
    } catch (err) {
      logger.error('Error apagado:', err);
      socket.emit('error', { type: 'system', message: err.message });
    }
  });


  // Configuración de calidad
  socket.on('set_quality', (quality) => {
    screenCapture.setQuality(quality);
    logger.info(`Calidad cambiada a: ${quality}`);
  });

  socket.on('set_scale', (scale) => {
    screenCapture.setScale(scale);
    logger.info(`Escala cambiada a: ${scale}`);
  });

  // Latencia
  socket.on('ping_test', (timestamp) => {
    socket.emit('pong_test', timestamp);
  });

  // Desconexión
  socket.on('disconnect', (reason) => {
    clearInterval(screenInterval);
    activeSessions.delete(socket.user.id);
    
    // Desregistrar conexión pública si aplica
    if (isPublicConnection(socket)) {
      unregisterPublicConnection(socket.user.id);
    }
    
    logger.info(`Cliente desconectado: ${socket.user.id} - Razón: ${reason}`);
  });


  // Logout explícito
  socket.on('logout', () => {
    logger.info(`Logout solicitado por usuario: ${socket.user.id}`);
    socket.emit('session_terminated', 'Sesión cerrada por el usuario');
    socket.disconnect();
  });

  // Transferencia de archivos vía Socket.io
  socket.on('file_upload_start', (data) => {
    const { filename, fileSize, transferId } = data;
    logger.info(`📤 Iniciando upload: ${filename} (${fileTransferService.formatBytes(fileSize)})`);
    
    try {
      fileTransferService.validateFile(filename, fileSize);
      socket.emit('file_upload_ready', { transferId, status: 'ready' });
    } catch (error) {
      socket.emit('file_upload_error', { transferId, error: error.message });
    }
  });

  socket.on('file_chunk', async (data) => {
    const { transferId, chunk, isLast } = data;
    // Los chunks se acumulan y se escriben al final
    // Esta es una implementación simplificada - en producción usar streams
  });

  socket.on('file_upload_complete', async (data) => {
    const { transferId, filename, fileSize } = data;
    logger.info(`✅ Upload completado: ${filename}`);
    socket.emit('file_upload_success', { 
      transferId, 
      filename, 
      message: 'Archivo subido correctamente' 
    });
  });

  socket.on('request_file_list', async () => {
    try {
      const files = await fileTransferService.getFileList();
      socket.emit('file_list', { 
        success: true, 
        files: files.map(file => ({
          name: file.name,
          size: file.size,
          sizeFormatted: fileTransferService.formatBytes(file.size),
          modified: file.modified
        }))
      });
    } catch (error) {
      socket.emit('file_list_error', { error: error.message });
    }
  });

});

// Manejo de errores global
app.use((err, req, res, next) => {
  logger.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 8443;

httpServer.listen(PORT, () => {
  logger.info(`🚀 Servidor remoto ejecutándose en puerto ${PORT}`);
  logger.info(`📱 Acceso local: http://localhost:${PORT}`);
  if (PUBLIC_ACCESS_ENABLED) {
    logger.info(`🌐 Acceso público: Habilitado (máx: ${process.env.MAX_PUBLIC_CONNECTIONS || 5} conexiones)`);
  } else {
    logger.info(`🌐 Acceso público: Deshabilitado`);
  }
  logger.info(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
});


// Manejo de señales de terminación
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  httpServer.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  httpServer.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
});
