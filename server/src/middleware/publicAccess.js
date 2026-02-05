import { PUBLIC_ACCESS_ENABLED, PUBLIC_ACCESS_PASSWORD, MAX_PUBLIC_CONNECTIONS, isPublicToken } from '../config/auth.js';
import logger from '../utils/logger.js';

// Track public connections
const publicConnections = new Map();
let publicConnectionCount = 0;

export const getPublicConnectionStats = () => ({
  count: publicConnectionCount,
  max: MAX_PUBLIC_CONNECTIONS,
  enabled: PUBLIC_ACCESS_ENABLED,
  connections: Array.from(publicConnections.entries()).map(([id, data]) => ({
    id,
    ip: data.ip,
    connectedAt: data.connectedAt
  }))
});

export const canAcceptPublicConnection = () => {
  return PUBLIC_ACCESS_ENABLED && publicConnectionCount < MAX_PUBLIC_CONNECTIONS;
};

export const validatePublicAccess = (req, res, next) => {
  if (!PUBLIC_ACCESS_ENABLED) {
    return res.status(403).json({ 
      error: 'Acceso público deshabilitado',
      code: 'PUBLIC_ACCESS_DISABLED'
    });
  }

  if (publicConnectionCount >= MAX_PUBLIC_CONNECTIONS) {
    logger.warn(`Intento de conexión pública rechazado - límite alcanzado (${MAX_PUBLIC_CONNECTIONS})`);
    return res.status(429).json({ 
      error: 'Límite de conexiones públicas alcanzado',
      code: 'PUBLIC_CONNECTION_LIMIT'
    });
  }

  next();
};

export const registerPublicConnection = (socketId, ip) => {
  publicConnections.set(socketId, {
    ip,
    connectedAt: new Date().toISOString()
  });
  publicConnectionCount++;
  logger.info(`Conexión pública registrada: ${socketId} desde IP: ${ip}`);
};

export const unregisterPublicConnection = (socketId) => {
  if (publicConnections.has(socketId)) {
    publicConnections.delete(socketId);
    publicConnectionCount--;
    logger.info(`Conexión pública eliminada: ${socketId}`);
  }
};

export const isPublicConnection = (socket) => {
  return socket.user && isPublicToken(socket.user);
};

export const logPublicAccess = (req, action, success = true) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  const logData = {
    ip,
    action,
    success,
    userAgent,
    timestamp: new Date().toISOString(),
    type: 'public_access'
  };

  if (success) {
    logger.info(`Acceso público - ${action}: ${ip}`, logData);
  } else {
    logger.warn(`Intento de acceso público fallido - ${action}: ${ip}`, logData);
  }
};

export const publicAccessMiddleware = {
  validatePublicAccess,
  canAcceptPublicConnection,
  registerPublicConnection,
  unregisterPublicConnection,
  isPublicConnection,
  logPublicAccess,
  getPublicConnectionStats
};

export default publicAccessMiddleware;
