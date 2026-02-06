import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import './AudioStream.css';

const AudioStream = ({ socket, isPublic }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [volume, setVolume] = useState(80);
  const [quality, setQuality] = useState('medium');
  const [error, setError] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  
  const audioQueue = useRef([]);
  const isPlaying = useRef(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Escuchar datos de audio
    socket.on('audio_data', (data) => {
      if (isStreaming && data.audio) {
        playAudioChunk(data.audio);
      }
    });

    socket.on('audio_started', (data) => {
      setIsStreaming(true);
      setError(null);
      toast.success('🔊 Streaming de audio iniciado');
    });

    socket.on('audio_stopped', (data) => {
      setIsStreaming(false);
      toast.info('🔇 Streaming de audio detenido');
    });

    socket.on('audio_error', (error) => {
      setError(error.message);
      setIsStreaming(false);
      toast.error(`Error de audio: ${error.message}`);
    });

    return () => {
      socket.off('audio_data');
      socket.off('audio_started');
      socket.off('audio_stopped');
      socket.off('audio_error');
      stopAudio();
    };
  }, [socket, isStreaming]);

  // Inicializar AudioContext
  const initAudioContext = useCallback(() => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 44100
      });
      setAudioContext(ctx);
      return ctx;
    }
    return audioContext;
  }, [audioContext]);

  // Reproducir chunk de audio
  const playAudioChunk = useCallback((base64Audio) => {
    try {
      const ctx = initAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Convertir base64 a ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convertir a Float32Array (PCM 16-bit)
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      // Crear buffer de audio
      const audioBuffer = ctx.createBuffer(2, float32Array.length / 2, 44100);
      
      // Separar canales
      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = audioBuffer.getChannelData(1);
      
      for (let i = 0; i < float32Array.length / 2; i++) {
        leftChannel[i] = float32Array[i * 2] * (volume / 100);
        rightChannel[i] = float32Array[i * 2 + 1] * (volume / 100);
      }

      // Crear source y reproducir
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();

      // Visualizar
      visualizeAudio(float32Array);

    } catch (err) {
      console.error('Error reproduciendo audio:', err);
    }
  }, [initAudioContext, volume]);

  // Visualización simple
  const visualizeAudio = (audioData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Limpiar
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, width, height);

    if (!isStreaming) return;

    // Dibujar onda
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const step = Math.ceil(audioData.length / width);
    const amp = height / 2;

    for (let i = 0; i < width; i++) {
      const dataIndex = i * step;
      const value = audioData[dataIndex] || 0;
      const y = (value * amp) + amp;
      
      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }

    ctx.stroke();

    // Dibujar barras de frecuencia simuladas
    const barCount = 20;
    const barWidth = width / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * audioData.length);
      const value = Math.abs(audioData[dataIndex] || 0);
      const barHeight = value * height * 0.8;
      
      const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
      gradient.addColorStop(0, '#4a9eff');
      gradient.addColorStop(1, '#1a5fb4');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(
        i * barWidth + 2, 
        height - barHeight, 
        barWidth - 4, 
        barHeight
      );
    }
  };

  // Animación de visualización cuando no hay audio
  useEffect(() => {
    if (isStreaming) {
      const animate = () => {
        if (!isStreaming) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const time = Date.now() / 1000;

        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(0, 0, width, height);

        // Onda sinusoidal animada
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin((x / width) * Math.PI * 4 + time * 2) * 20;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();

        animationRef.current = requestAnimationFrame(animate);
      };

      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Limpiar canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isStreaming]);

  const handleStartStream = () => {
    if (isPublic) {
      toast.error('Streaming de audio no disponible en modo público');
      return;
    }

    if (!audioContext) {
      initAudioContext();
    }

    socket.emit('audio_start', { quality });
  };

  const handleStopStream = () => {
    socket.emit('audio_stop');
    stopAudio();
  };

  const stopAudio = () => {
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.suspend();
    }
    setIsStreaming(false);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseInt(e.target.value));
  };

  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    if (isStreaming) {
      socket.emit('audio_set_quality', { quality: newQuality });
      toast.info(`Calidad de audio cambiada a: ${newQuality}`);
    }
  };

  return (
    <div className={`audio-stream-container ${isMinimized ? 'audio-stream-minimized' : ''}`}>
      <div className="audio-stream-header">
        <h3>Audio Remoto</h3>
        <button 
          className="audio-stream-toggle"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? '🎵' : '−'}
        </button>
      </div>
      
      {!isMinimized && (
        <div className="audio-stream-content">
          <div className="audio-visualizer">
            <canvas 
              ref={canvasRef}
              width={250}
              height={60}
            />
          </div>
          
          <div className="audio-controls">
            <button 
              className={`audio-btn ${isStreaming ? 'active' : 'audio-btn-primary'}`}
              onClick={isStreaming ? handleStopStream : handleStartStream}
              disabled={isPublic}
            >
              {isStreaming ? '⏹ Detener' : '▶ Iniciar'}
            </button>
          </div>
          
          <div className="audio-volume">
            <span className="audio-volume-icon">🔊</span>
            <input
              type="range"
              className="audio-volume-slider"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
            />
            <span className="audio-volume-value">{volume}%</span>
          </div>
          
          <div className="audio-quality-selector">
            <button 
              className={`audio-quality-btn ${quality === 'low' ? 'active' : ''}`}
              onClick={() => handleQualityChange('low')}
            >
              Baja
            </button>
            <button 
              className={`audio-quality-btn ${quality === 'medium' ? 'active' : ''}`}
              onClick={() => handleQualityChange('medium')}
            >
              Media
            </button>
            <button 
              className={`audio-quality-btn ${quality === 'high' ? 'active' : ''}`}
              onClick={() => handleQualityChange('high')}
            >
              Alta
            </button>
          </div>
          
          <div className="audio-status">
            <span className={`audio-status-indicator ${isStreaming ? 'streaming' : ''}`}></span>
            <span>
              {isStreaming ? 'Transmitiendo...' : 
               error ? 'Error' : 'Detenido'}
            </span>
          </div>
          
          {error && (
            <div className="audio-error-message">
              {error}
            </div>
          )}
          
          {isPublic && (
            <div className="audio-info">
              Audio no disponible en modo público
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioStream;
