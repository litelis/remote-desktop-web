import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login/Login';
import DesktopViewer from './components/DesktopViewer/DesktopViewer';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [connectionType, setConnectionType] = useState('private');


  useEffect(() => {
    // Verificar token existente al cargar
    const savedToken = localStorage.getItem('remoteDesktopToken');
    if (savedToken) {
      // Validar token con el servidor
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8443'}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setToken(savedToken);
          setConnectionType(data.connectionType || 'private');
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('remoteDesktopToken');
        }
      })

      .catch(() => {
        localStorage.removeItem('remoteDesktopToken');
      });
    }
  }, []);

  const handleLogin = (newToken, connType = 'private') => {
    localStorage.setItem('remoteDesktopToken', newToken);
    setToken(newToken);
    setConnectionType(connType);
    setIsAuthenticated(true);
  };


  const handleLogout = () => {
    localStorage.removeItem('remoteDesktopToken');
    setToken(null);
    setConnectionType('private');
    setIsAuthenticated(false);
  };


  return (
    <div className="App">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#51cf66',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ff6b6b',
              secondary: '#fff',
            },
          },
        }}
      />
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <DesktopViewer 
          token={token} 
          onLogout={handleLogout} 
          connectionType={connectionType}
        />
      )}

    </div>
  );
}

export default App;
