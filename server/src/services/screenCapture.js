import screenshot from 'screenshot-desktop';
import sharp from 'sharp';
import logger from '../utils/logger.js';

class ScreenCaptureService {
  constructor() {
    this.quality = 80;
    this.scaleFactor = 0.8;
    this.maxWidth = 1920;
    this.maxHeight = 1080;
  }

  async capture() {
    try {
      // Capturar pantalla completa
      const displays = await screenshot.listDisplays();
      const primaryDisplay = displays.find(d => d.primary) || displays[0];
      
      const imgBuffer = await screenshot({ 
        screen: primaryDisplay.id,
        format: 'png' 
      });

      // Obtener dimensiones originales
      const metadata = await sharp(imgBuffer).metadata();
      
      // Calcular nuevas dimensiones manteniendo aspecto
      let newWidth = metadata.width * this.scaleFactor;
      let newHeight = metadata.height * this.scaleFactor;

      // Limitar tamaño máximo
      if (newWidth > this.maxWidth) {
        newHeight = (newHeight * this.maxWidth) / newWidth;
        newWidth = this.maxWidth;
      }
      if (newHeight > this.maxHeight) {
        newWidth = (newWidth * this.maxHeight) / newHeight;
        newHeight = this.maxHeight;
      }

      // Procesar imagen
      const processed = await sharp(imgBuffer)
        .resize(Math.round(newWidth), Math.round(newHeight), {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: this.quality,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();

      return {
        data: processed.toString('base64'),
        timestamp: Date.now(),
        format: 'jpeg',
        width: Math.round(newWidth),
        height: Math.round(newHeight)
      };
    } catch (error) {
      logger.error('Error en captura de pantalla:', error);
      throw error;
    }
  }

  setQuality(quality) {
    this.quality = Math.max(10, Math.min(100, quality));
  }

  setScale(factor) {
    this.scaleFactor = Math.max(0.3, Math.min(1, factor));
  }

  getSettings() {
    return {
      quality: this.quality,
      scaleFactor: this.scaleFactor,
      maxWidth: this.maxWidth,
      maxHeight: this.maxHeight
    };
  }
}

export default ScreenCaptureService;