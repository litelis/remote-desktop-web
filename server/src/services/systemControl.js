import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import logger from '../utils/logger.js';

const execAsync = promisify(exec);

class SystemControlService {
  constructor() {
    this.platform = os.platform();
    logger.info(`Sistema operativo detectado: ${this.platform}`);
  }

  async restart() {
    let command;
    let delay = 10; // segundos
    
    switch(this.platform) {
      case 'win32':
        // Windows: reinicio con mensaje y delay
        command = `shutdown /r /t ${delay} /c "Reinicio solicitado desde escritorio remoto" /f`;
        break;
        
      case 'darwin':
        // macOS
        command = `osascript -e 'tell app "System Events" to restart'`;
        delay = 0;
        break;
        
      case 'linux':
      default:
        // Linux
        command = `sudo shutdown -r +${Math.ceil(delay/60)} "Reinicio solicitado desde escritorio remoto"`;
    }

    try {
      logger.warn(`Ejecutando reinicio: ${command}`);
      await execAsync(command);
      return { 
        success: true, 
        message: `Reinicio programado en ${delay} segundos`,
        platform: this.platform
      };
    } catch (error) {
      logger.error('Error al reiniciar:', error);
      throw new Error(`Error al reiniciar: ${error.message}`);
    }
  }

  async shutdown() {
    let command;
    let delay = 10;
    
    switch(this.platform) {
      case 'win32':
        command = `shutdown /s /t ${delay} /c "Apagado solicitado desde escritorio remoto" /f`;
        break;
        
      case 'darwin':
        command = `osascript -e 'tell app "System Events" to shut down'`;
        delay = 0;
        break;
        
      case 'linux':
      default:
        command = `sudo shutdown -h +${Math.ceil(delay/60)} "Apagado solicitado desde escritorio remoto"`;
    }

    try {
      logger.warn(`Ejecutando apagado: ${command}`);
      await execAsync(command);
      return { 
        success: true, 
        message: `Apagado programado en ${delay} segundos`,
        platform: this.platform
      };
    } catch (error) {
      logger.error('Error al apagar:', error);
      throw new Error(`Error al apagar: ${error.message}`);
    }
  }

  async abortShutdown() {
    // Solo funciona en Windows
    if (this.platform !== 'win32') {
      throw new Error('Cancelar apagado solo soportado en Windows');
    }
    
    try {
      await execAsync('shutdown /a');
      return { success: true, message: 'Apagado/reinicio cancelado' };
    } catch (error) {
      throw new Error('No hay apagado programado para cancelar');
    }
  }

  getSystemInfo() {
    return {
      platform: this.platform,
      hostname: os.hostname(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      arch: os.arch(),
      release: os.release()
    };
  }

  async executeCommand(command) {
    // Método peligroso - usar con precaución y solo para comandos permitidos
    const allowedCommands = ['whoami', 'hostname', 'date', 'tasklist', 'systeminfo'];
    
    if (!allowedCommands.includes(command.toLowerCase())) {
      throw new Error('Comando no permitido');
    }
    
    try {
      const { stdout, stderr } = await execAsync(command);
      return { stdout, stderr };
    } catch (error) {
      throw new Error(`Error ejecutando comando: ${error.message}`);
    }
  }

}

export default SystemControlService;
