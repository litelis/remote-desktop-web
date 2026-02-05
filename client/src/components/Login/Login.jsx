import React, { useState } from 'react';
import toast from 'react-hot-toast';
import './Login.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8443';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Ingresa la contraseña');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('¡Conexión establecida!');
        onLogin(data.token);
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
            className={`btn-primary ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Conectando...
              </>
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
        </div>

        <p className="warning">
          ⚠️ Acceso restringido. Todas las acciones son registradas.
        </p>
      </div>
    </div>
  );
}