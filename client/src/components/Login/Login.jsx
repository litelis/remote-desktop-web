import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './Login.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8443';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPublicMode, setIsPublicMode] = useState(false);
  const [publicStatus, setPublicStatus] = useState({ enabled: false, availableSlots: 0 });


  // Verificar estado de acceso público al cargar
  useEffect(() => {
    const checkPublicStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/public-status`);
        if (response.ok) {
          const data = await response.json();
          setPublicStatus(data);
        }
      } catch (error) {
        console.log('No se pudo verificar estado público');
      }
    };
    checkPublicStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Ingresa la contraseña');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isPublicMode ? '/api/auth/public-login' : '/api/auth/login';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        const successMsg = isPublicMode ? '¡Conexión pública establecida!' : '¡Conexión establecida!';
        toast.success(successMsg);
        onLogin(data.token, data.connectionType || 'private');
      } else {
        toast.error(data.error || 'Contraseña incorrecta');
      }
    } catch (error) {
      toast.error('Error de conexión. ¿El servidor está activo?');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <h1>Escritorio Remoto</h1>
        <p className="subtitle">Acceso seguro vía navegador</p>
        
        {/* Toggle modo público/privado */}
        {publicStatus.enabled && (
          <div className="connection-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${!isPublicMode ? 'active' : ''}`}
              onClick={() => setIsPublicMode(false)}
            >
              🔒 Privado
            </button>
            <button
              type="button"
              className={`mode-btn ${isPublicMode ? 'active' : ''}`}
              onClick={() => setIsPublicMode(true)}
            >
              🌐 Público
            </button>
          </div>
        )}
        
        {isPublicMode && (
          <div className="public-warning">
            <span className="warning-icon">⚠️</span>
            <p>Modo público: Acceso limitado desde internet</p>
            <small>Slots disponibles: {publicStatus.availableSlots}</small>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña de acceso"
              required
              autoFocus
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`btn-primary ${loading ? 'loading' : ''} ${isPublicMode ? 'public-mode' : ''}`}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Conectando...
              </>
            ) : isPublicMode ? (
              'Conectar en Modo Público'
            ) : (
              'Acceder al Sistema'
            )}
          </button>

        </form>

        <div className="security-info">
          <div className="security-item">
            <span className="icon">🔒</span>
            <span>Conexión encriptada</span>
          </div>
          <div className="security-item">
            <span className="icon">🛡️</span>
            <span>Acceso auditado</span>
          </div>
          {isPublicMode && (
            <div className="security-item public">
              <span className="icon">🌐</span>
              <span>Acceso público limitado</span>
            </div>
          )}
        </div>

        <p className={`warning ${isPublicMode ? 'public-warning-text' : ''}`}>
          {isPublicMode ? (
            <>⚠️ Modo público: Sin acceso a reinicio/apagado. Sesión de 1 hora máximo.</>
          ) : (
            <>⚠️ Acceso restringido. Todas las acciones son registradas.</>
          )}
        </p>

      </div>
    </div>
  );
}
