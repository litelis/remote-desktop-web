import React from 'react';
import './ControlBar.css';

export default function ControlBar({ 
  connected, 
  fps, 
  latency,
  quality,
  onQualityChange,
  onRestart, 
  onShutdown,
  onLogout,
  isPublic = false
}) {

  return (
    <div className="control-bar">
      <div className="control-section">
        <h2 className="title">
          <span className="icon">🖥️</span>
          Escritorio Remoto
        </h2>
        <span className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '● En línea' : '○ Desconectado'}
        </span>
      </div>

      <div className="control-section quality-control">
        <label>Calidad:</label>
        <input
          type="range"
          min="20"
          max="100"
          value={quality}
          onChange={(e) => onQualityChange(Number(e.target.value))}
          disabled={!connected}
          className="quality-slider"
        />
        <span className="quality-value">{quality}%</span>
      </div>

      <div className="control-section actions">
        {!isPublic && (
          <>
            <button 
              onClick={onRestart}
              disabled={!connected}
              className="btn-warning"
              title="Reiniciar sistema"
            >
              <span>🔄</span>
              Reiniciar
            </button>
            
            <button 
              onClick={onShutdown}
              disabled={!connected}
              className="btn-danger"
              title="Apagar sistema"
            >
              <span>⏻</span>
              Apagar
            </button>
            
            <div className="divider"></div>
          </>
        )}
        
        {isPublic && (
          <span className="public-indicator" title="Modo público - Funciones limitadas">
            <span>🌐</span>
            Modo Público
          </span>
        )}

        
        <button 
          onClick={onLogout}
          className="btn-secondary"
          title="Cerrar sesión"
        >
          <span>🔒</span>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
