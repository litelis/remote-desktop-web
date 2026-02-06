import { spawn } from 'child_process';
import { platform } from 'os';
import logger from '../utils/logger.js';

/**
 * Servicio de captura de audio para streaming
 * Soporta Windows (dshow), macOS (avfoundation), Linux (pulse/alsa)
 */
class AudioCaptureService {
  constructor() {
    this.activeStreams = new Map();
    this.sampleRate = 44100;
    this.channels = 2;
    this.format = 's16le'; // PCM 16-bit little-endian
  }

  /**
   * Obtiene el comando FFmpeg según la plataforma
   */
  getFFmpegCommand() {
    const os = platform();
    
    switch (os) {
      case 'win32':
        // Windows - usar DirectShow
        return [
          '-f', 'dshow',
          '-i', 'audio=virtual-audio-capturer', // Stereo Mix o similar
          '-ar', this.sampleRate.toString(),
          '-ac', this.channels.toString(),
          '-f', this.format,
          '-acodec', 'pcm_s16le',
          'pipe:1'
        ];
        
      case 'darwin':
        // macOS - usar AVFoundation
        return [
          '-f', 'avfoundation',
          '-i', ':0', // Captura de audio del sistema
          '-ar', this.sampleRate.toString(),
          '-ac', this.channels.toString(),
          '-f', this.format,
          '-acodec', 'pcm_s16le',
          'pipe:1'
        ];
        
      case 'linux':
        // Linux - usar PulseAudio o ALSA
        return [
          '-f', 'pulse',
          '-i', 'default',
          '-ar', this.sampleRate.toString(),
          '-ac', this.channels.toString(),
          '-f', this.format,
          '-acodec', 'pcm_s16le',
          'pipe:1'
        ];
        
      default:
        throw new Error(`Plataforma no soportada: ${os}`);
    }
  }

  /**
   * Inicia la captura de audio
   */
  startCapture(streamId, onData, onError) {
    if (this.activeStreams.has(streamId)) {
      logger.warn(`Stream de audio ${streamId} ya existe`);
      return false;
    }

    try {
      const ffmpegArgs = this.getFFmpegCommand();
      
      logger.info(`🎤 Iniciando captura de audio (${platform()}) - Stream: ${streamId}`);
      
      const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      const streamData = {
        process: ffmpeg,
        startTime: Date.now(),
        bytesTransferred: 0
      };

      // Manejar datos de audio
      ffmpeg.stdout.on('data', (chunk) => {
        streamData.bytesTransferred += chunk.length;
        
        // Convertir a base64 para enviar por WebSocket
        const base64Audio = chunk.toString('base64');
        onData(base64Audio);
      });

      // Manejar errores de FFmpeg
      ffmpeg.stderr.on('data', (data) => {
        const message = data.toString();
        // Solo loguear errores reales, no información de debug
        if (message.includes('Error') || message.includes('error')) {
          logger.error(`FFmpeg audio error: ${message}`);
        }
      });

      ffmpeg.on('error', (error) => {
        logger.error(`Error iniciando FFmpeg audio: ${error.message}`);
        onError(error);
        this.stopCapture(streamId);
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0 && code !== null) {
          logger.warn(`FFmpeg audio cerrado con código: ${code}`);
        }
        this.activeStreams.delete(streamId);
      });

      this.activeStreams.set(streamId, streamData);
      
      logger.info(`✅ Captura de audio iniciada: ${streamId}`);
      return true;
      
    } catch (error) {
      logger.error(`Error iniciando captura de audio: ${error.message}`);
      onError(error);
      return false;
    }
  }

  /**
   * Detiene la captura de audio
   */
  stopCapture(streamId) {
    const stream = this.activeStreams.get(streamId);
    
    if (!stream) {
      logger.warn(`Stream de audio ${streamId} no encontrado`);
      return false;
    }

    try {
      logger.info(`🛑 Deteniendo captura de audio: ${streamId}`);
      
      // Matar el proceso FFmpeg
      if (stream.process) {
        stream.process.kill('SIGTERM');
        
        // Forzar cierre después de 2 segundos si no responde
        setTimeout(() => {
          if (!stream.process.killed) {
            stream.process.kill('SIGKILL');
          }
        }, 2000);
      }

      const duration = Date.now() - stream.startTime;
      const bytesMB = (stream.bytesTransferred / 1024 / 1024).toFixed(2);
      
      logger.info(`📊 Audio stream ${streamId} finalizado - Duración: ${duration}ms, Datos: ${bytesMB}MB`);
      
      this.activeStreams.delete(streamId);
      return true;
      
    } catch (error) {
      logger.error(`Error deteniendo captura de audio: ${error.message}`);
      return false;
    }
  }

  /**
   * Detiene todas las capturas activas
   */
  stopAllCaptures() {
    logger.info(`🛑 Deteniendo todas las capturas de audio (${this.activeStreams.size} activas)`);
    
    const streamIds = Array.from(this.activeStreams.keys());
    streamIds.forEach(id => this.stopCapture(id));
    
    return streamIds.length;
  }

  /**
   * Verifica si FFmpeg está instalado
   */
  async checkFFmpeg() {
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', ['-version']);
      
      ffmpeg.on('error', () => {
        resolve(false);
      });
      
      ffmpeg.on('close', (code) => {
        resolve(code === 0);
      });
      
      // Timeout de 3 segundos
      setTimeout(() => {
        ffmpeg.kill();
        resolve(false);
      }, 3000);
    });
  }

  /**
   * Obtiene estadísticas de un stream
   */
  getStreamStats(streamId) {
    const stream = this.activeStreams.get(streamId);
    
    if (!stream) return null;
    
    return {
      streamId,
      duration: Date.now() - stream.startTime,
      bytesTransferred: stream.bytesTransferred,
      isActive: !stream.process.killed
    };
  }

  /**
   * Lista todos los streams activos
   */
  listActiveStreams() {
    const streams = [];
    for (const [id, stream] of this.activeStreams) {
      streams.push({
        streamId: id,
        duration: Date.now() - stream.startTime,
        bytesTransferred: stream.bytesTransferred
      });
    }
    return streams;
  }

  /**
   * Configura la calidad del audio
   */
  setQuality(quality) {
    // quality: 'low' | 'medium' | 'high'
    switch (quality) {
      case 'low':
        this.sampleRate = 22050;
        this.channels = 1;
        break;
      case 'medium':
        this.sampleRate = 44100;
        this.channels = 1;
        break;
      case 'high':
      default:
        this.sampleRate = 44100;
        this.channels = 2;
        break;
    }
    
    logger.info(`🎵 Calidad de audio configurada: ${quality} (${this.sampleRate}Hz, ${this.channels}ch)`);
  }
}

export default new AudioCaptureService();
