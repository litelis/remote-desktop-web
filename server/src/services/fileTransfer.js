import { promises as fs } from 'fs';
import { join, basename, extname } from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import logger from '../utils/logger.js';

class FileTransferService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024; // 100MB default
    this.allowedExtensions = process.env.ALLOWED_EXTENSIONS?.split(',') || ['.txt', '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar', '.doc', '.docx', '.xls', '.xlsx'];
    this.activeTransfers = new Map();
  }

  async initialize() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info(`📁 Directorio de uploads inicializado: ${this.uploadDir}`);
    } catch (error) {
      logger.error('Error inicializando directorio de uploads:', error);
      throw error;
    }
  }

  validateFile(filename, fileSize) {
    const ext = extname(filename).toLowerCase();
    
    if (!this.allowedExtensions.includes(ext)) {
      throw new Error(`Extensión no permitida: ${ext}`);
    }

    if (fileSize > this.maxFileSize) {
      throw new Error(`Archivo demasiado grande. Máximo: ${this.formatBytes(this.maxFileSize)}`);
    }

    return true;
  }

  sanitizeFilename(filename) {
    // Eliminar caracteres peligrosos y path traversal
    return basename(filename)
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\.\./g, '_')
      .substring(0, 255);
  }

  async saveFile(stream, filename, fileSize, transferId) {
    const sanitizedName = this.sanitizeFilename(filename);
    const filepath = join(this.uploadDir, `${Date.now()}_${sanitizedName}`);
    
    this.validateFile(sanitizedName, fileSize);

    const writeStream = createWriteStream(filepath);
    let receivedBytes = 0;

    this.activeTransfers.set(transferId, {
      filename: sanitizedName,
      filepath,
      receivedBytes: 0,
      totalBytes: fileSize,
      startTime: Date.now()
    });

    try {
      await pipeline(
        stream,
        async function* (source) {
          for await (const chunk of source) {
            receivedBytes += chunk.length;
            
            // Actualizar progreso cada 100KB
            if (receivedBytes % (100 * 1024) < chunk.length) {
              const transfer = this.activeTransfers.get(transferId);
              if (transfer) {
                transfer.receivedBytes = receivedBytes;
              }
            }
            
            yield chunk;
          }
        }.bind(this),
        writeStream
      );

      const transfer = this.activeTransfers.get(transferId);
      transfer.receivedBytes = receivedBytes;
      transfer.completed = true;
      transfer.endTime = Date.now();

      logger.info(`✅ Archivo recibido: ${sanitizedName} (${this.formatBytes(receivedBytes)})`);

      return {
        success: true,
        filename: sanitizedName,
        filepath,
        size: receivedBytes,
        transferId
      };

    } catch (error) {
      // Limpiar archivo parcial
      try {
        await fs.unlink(filepath);
      } catch (unlinkError) {
        // Ignorar error si el archivo no existe
      }
      
      this.activeTransfers.delete(transferId);
      logger.error(`❌ Error recibiendo archivo ${sanitizedName}:`, error);
      throw error;
    }
  }

  async getFileList() {
    try {
      const files = await fs.readdir(this.uploadDir);
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const filepath = join(this.uploadDir, file);
          const stat = await fs.stat(filepath);
          return {
            name: file,
            size: stat.size,
            created: stat.birthtime,
            modified: stat.mtime
          };
        })
      );
      
      return fileStats.sort((a, b) => b.modified - a.modified);
    } catch (error) {
      logger.error('Error listando archivos:', error);
      return [];
    }
  }

  async getFileStream(filename) {
    const filepath = join(this.uploadDir, filename);
    
    // Verificar que el archivo esté dentro del directorio de uploads
    if (!filepath.startsWith(this.uploadDir)) {
      throw new Error('Acceso no permitido');
    }

    try {
      await fs.access(filepath);
      const stat = await fs.stat(filepath);
      
      return {
        stream: createReadStream(filepath),
        size: stat.size,
        mtime: stat.mtime
      };
    } catch (error) {
      throw new Error('Archivo no encontrado');
    }
  }

  async deleteFile(filename) {
    const filepath = join(this.uploadDir, filename);
    
    if (!filepath.startsWith(this.uploadDir)) {
      throw new Error('Acceso no permitido');
    }

    try {
      await fs.unlink(filepath);
      logger.info(`🗑️ Archivo eliminado: ${filename}`);
      return true;
    } catch (error) {
      logger.error(`Error eliminando archivo ${filename}:`, error);
      throw error;
    }
  }

  getTransferProgress(transferId) {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return null;

    return {
      filename: transfer.filename,
      receivedBytes: transfer.receivedBytes,
      totalBytes: transfer.totalBytes,
      percentage: Math.round((transfer.receivedBytes / transfer.totalBytes) * 100),
      completed: transfer.completed || false,
      speed: this.calculateSpeed(transfer)
    };
  }

  calculateSpeed(transfer) {
    const elapsed = (Date.now() - transfer.startTime) / 1000;
    if (elapsed === 0) return 0;
    return Math.round(transfer.receivedBytes / elapsed);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  cleanup() {
    // Limpiar transferencias completadas antiguas
    const now = Date.now();
    for (const [id, transfer] of this.activeTransfers.entries()) {
      if (transfer.completed && (now - transfer.endTime) > 3600000) { // 1 hora
        this.activeTransfers.delete(id);
      }
    }
  }
}

// Inicializar servicio
const fileTransferService = new FileTransferService();
fileTransferService.initialize();

// Cleanup periódico
setInterval(() => fileTransferService.cleanup(), 600000); // Cada 10 minutos

export default fileTransferService;
