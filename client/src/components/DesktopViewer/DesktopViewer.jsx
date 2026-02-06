import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import ControlBar from '../ControlBar/ControlBar';
import FileTransfer from '../FileTransfer/FileTransfer';
import './DesktopViewer.css';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8443';
const WS_URL = process.env.REACT_APP_WS_URL || API_URL;

export default function DesktopViewer({ token, onLogout, connectionType = 'private' }) {

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const socketRef = useRef(null);
  
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [quality, setQuality] = useState(80);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const isPublic = connectionType === 'public' || (connectionInfo?.type === 'public');
  
  const frameCount = useRef(0);

  const lastTime = useRef(Date.now());
  const latencyInterval = useRef(null);

  // Conectar WebSocket
  useEffect(() => {
    setConnecting(true);
    
    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setConnecting(false);
      const msg = isPublic ? 'Conectado en modo público' : 'Conectado al escritorio remoto';
      toast.success(msg);
      
      // Medir latencia cada 5 segundos
      latencyInterval.current = setInterval(() => {
        const start = Date.now();
        socket.emit('ping_test', start);
      }, 5000);
    });

    socket.on('connection_info', (info) => {
      setConnectionInfo(info);
      if (info.type === 'public') {
        toast.info('Modo público: Algunas funciones están limitadas', { duration: 5000 });
      }
    });


    socket.on('disconnect', (reason) => {
      setConnected(false);
      clearInterval(latencyInterval.current);
      toast.error(`Desconectado: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      toast.error('Error de conexión');
      console.error('Connection error:', error);
    });

    socket.on('screen_frame', (frame) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        if (canvas.width !== img.width || canvas.height !== img.height) {
          canvas.width = img.width;
          canvas.height = img.height;
          setScreenSize({ width: img.width, height: img.height });
        }
        
        ctx.drawImage(img, 0, 0);
        
        // Calcular FPS
        frameCount.current++;
        const now = Date.now();
        if (now - lastTime.current >= 1000) {
          setFps(frameCount.current);
          frameCount.current = 0;
          lastTime.current = now;
        }
      };
      img.src = `data:image/jpeg;base64,${frame.data}`;
    });

    socket.on('pong_test', (timestamp) => {
      const ping = Date.now() - timestamp;
      setLatency(ping);
    });

    socket.on('session_terminated', (reason) => {
      toast.error(reason);
      onLogout();
    });

    socket.on('error', (error) => {
      toast.error(`Error: ${error.message}`);
    });

    socket.on('system_status', (status) => {
      toast.success(`${status.action}: ${status.status}`);
    });

    return () => {
      clearInterval(latencyInterval.current);
      socket.disconnect();
    };
  }, [token, onLogout]);

  // Manejadores de input
  const handleMouseMove = useCallback((e) => {
    if (!connected || !socketRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    socketRef.current.emit('mouse_move', { x, y });
  }, [connected]);

  const handleMouseDown = useCallback((e) => {
    if (!connected || !socketRef.current) return;
    e.preventDefault();
    
    const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';
    socketRef.current.emit('mouse_click', { button, type: 'down' });
  }, [connected]);

  const handleMouseUp = useCallback((e) => {
    if (!connected || !socketRef.current) return;
    
    const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';
    socketRef.current.emit('mouse_click', { button, type: 'up' });
  }, [connected]);

  const handleMouseClick = useCallback((e) => {
    if (!connected || !socketRef.current) return;
    
    const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';
    socketRef.current.emit('mouse_click', { button, type: 'click' });
  }, [connected]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    return false;
  }, []);

  const handleWheel = useCallback((e) => {
    if (!connected || !socketRef.current) return;
    e.preventDefault();
    
    socketRef.current.emit('scroll', {
      deltaX: e.deltaX,
      deltaY: e.deltaY
    });
  }, [connected]);

  // Captura de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!connected || !socketRef.current) return;
      
      // Prevenir comportamiento por defecto para ciertas teclas
      if (['Tab', 'Alt', 'F4', 'F5'].includes(e.key)) {
        e.preventDefault();
      }
      
      const modifiers = [];
      if (e.ctrlKey) modifiers.push('Control');
      if (e.altKey) modifiers.push('Alt');
      if (e.shiftKey) modifiers.push('Shift');
      if (e.metaKey) modifiers.push('Meta');
      
      socketRef.current.emit('key_press', {
        key: e.key,
        modifiers
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [connected]);

  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    if (socketRef.current) {
      socketRef.current.emit('set_quality', newQuality);
    }
  };

  const handleRestart = () => {
    if (isPublic) {
      toast.error('Reinicio no disponible en modo público');
      return;
    }
    if (window.confirm('¿Estás seguro de reiniciar el sistema?\nTodos los programas se cerrarán.')) {
      socketRef.current.emit('system_restart');
    }
  };

  const handleShutdown = () => {
    if (isPublic) {
      toast.error('Apagado no disponible en modo público');
      return;
    }
    if (window.confirm('¿Estás seguro de apagar el sistema?')) {
      socketRef.current.emit('system_shutdown');
    }
  };


  return (
    <div className="viewer-container" ref={containerRef}>
      {isPublic && (
        <div className="public-mode-banner">
          <span className="public-icon">🌐</span>
          <span>Modo Público - Acceso Limitado</span>
          {connectionInfo?.expiresIn && (
            <span className="expires-info">Expira en: {connectionInfo.expiresIn}</span>
          )}
        </div>
      )}
      
      <ControlBar 
        connected={connected}
        fps={fps}
        latency={latency}
        quality={quality}
        onQualityChange={handleQualityChange}
        onRestart={handleRestart}
        onShutdown={handleShutdown}
        isPublic={isPublic}
        onLogout={() => {
          if (socketRef.current) {
            socketRef.current.emit('logout');
          }
          onLogout();
        }}
      />

      
      <div className="canvas-wrapper">
        {connecting && (
          <div className="connecting-overlay">
            <div className="loading-spinner"></div>
            <p>Conectando...</p>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleMouseClick}
          onContextMenu={handleContextMenu}
          onWheel={handleWheel}
          className={`desktop-canvas ${!connected ? 'disconnected' : ''}`}
        />
        
        {!connected && !connecting && (
          <div className="disconnected-overlay">
            <div className="icon">📡</div>
            <h2>Conexión perdida</h2>
            <p>Intentando reconectar automáticamente...</p>
          </div>
        )}
      </div>

      <div className="status-bar">
        <div className="status-group">
          <span className={`status-dot ${connected ? 'online' : 'offline'}`}></span>
          <span>{connected ? (isPublic ? 'Conectado (Público)' : 'Conectado') : 'Desconectado'}</span>
        </div>

        
        <div className="status-group">
          <span className="label">Resolución:</span>
          <span>{screenSize.width}x{screenSize.height}</span>
        </div>
        
        <div className="status-group">
          <span className="label">FPS:</span>
          <span className={fps < 5 ? 'warning' : ''}>{fps}</span>
        </div>
        
        <div className="status-group">
          <span className="label">Ping:</span>
          <span className={latency > 200 ? 'warning' : latency > 100 ? 'caution' : ''}>
            {latency}ms
          </span>
        </div>
      </div>

      {connected && (
        <FileTransfer 
          socket={socketRef.current} 
          isPublic={isPublic}
        />
      )}
    </div>
  );
}
