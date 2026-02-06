import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../utils/logger.js';

const execAsync = promisify(exec);

class ClipboardService {
  constructor() {
    this.maxSize = 1024 * 1024; // 1MB máximo
    this.allowedTypes = ['text/plain', 'text/html', 'image/png', 'image/jpeg'];
  }

  /**
   * Obtiene el contenido del portapapeles del sistema
   */
  async getClipboard() {
    try {
      // Windows
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('powershell -command "Get-Clipboard"');
        return {
          type: 'text/plain',
          data: stdout.trim(),
          timestamp: Date.now()
        };
      }
      
      // macOS
      if (process.platform === 'darwin') {
        const { stdout } = await execAsync('pbpaste');
        return {
          type: 'text/plain',
          data: stdout,
          timestamp: Date.now()
        };
      }
      
      // Linux (requiere xclip)
      if (process.platform === 'linux') {
        try {
          const { stdout } = await execAsync('xclip -selection clipboard -o');
          return {
            type: 'text/plain',
            data: stdout,
            timestamp: Date.now()
          };
        } catch (e) {
          // Intentar con wl-copy para Wayland
          const { stdout } = await execAsync('wl-paste');
          return {
            type: 'text/plain',
            data: stdout,
            timestamp: Date.now()
          };
        }
      }
      
      throw new Error('Plataforma no soportada');
    } catch (error) {
      logger.error('Error obteniendo portapapeles:', error);
      throw new Error('No se pudo acceder al portapapeles');
    }
  }

  /**
   * Establece contenido en el portapapeles del sistema
   */
  async setClipboard(content, type = 'text/plain') {
    try {
      if (content.length > this.maxSize) {
        throw new Error('Contenido demasiado grande (máx 1MB)');
      }

      // Windows
      if (process.platform === 'win32') {
        // Escapar caracteres especiales para PowerShell
        const escaped = content
          .replace(/`/g, '``')
          .replace(/\$/g, '`$')
          .replace(/"/g, '`"');
        await execAsync(`powershell -command "Set-Clipboard -Value \\"${escaped}\\""`);
        return true;
      }
      
      // macOS
      if (process.platform === 'darwin') {
        await execAsync(`echo "${content.replace(/"/g, '\\"')}" | pbcopy`);
        return true;
      }
      
      // Linux
      if (process.platform === 'linux') {
        try {
          await execAsync(`echo "${content.replace(/"/g, '\\"')}" | xclip -selection clipboard`);
          return true;
        } catch (e) {
          // Intentar con wl-copy para Wayland
          await execAsync(`echo "${content.replace(/"/g, '\\"')}" | wl-copy`);
          return true;
        }
      }
      
      throw new Error('Plataforma no soportada');
    } catch (error) {
      logger.error('Error estableciendo portapapeles:', error);
      throw new Error('No se pudo establecer el portapapeles');
    }
  }

  /**
   * Verifica si el contenido es válido
   */
  validateContent(content, type) {
    if (!content || typeof content !== 'string') {
      throw new Error('Contenido inválido');
    }

    if (content.length > this.maxSize) {
      throw new Error(`Contenido excede el límite de ${this.formatBytes(this.maxSize)}`);
    }

    if (!this.allowedTypes.includes(type)) {
      throw new Error(`Tipo no soportado: ${type}`);
    }

    return true;
  }

  /**
   * Formatea bytes a unidades legibles
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

const clipboardService = new ClipboardService();
export default clipboardService;
