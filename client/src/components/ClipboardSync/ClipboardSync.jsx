import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import './ClipboardSync.css';

const ClipboardSync = ({ socket, isPublic }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [clipboardContent, setClipboardContent] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!socket) return;

    // Escuchar contenido del portapapeles
    socket.on('clipboard_content', (data) => {
      setClipboardContent(data.data);
      setLastSync(new Date(data.timestamp));
      setIsSyncing(false);
    });

    socket.on('clipboard_set_success', (data) => {
      setIsSyncing(false);
      setLastSync(new Date(data.timestamp));
      showToastNotification('Portapapeles sincronizado');
    });

    socket.on('clipboard_updated', (data) => {
      // Notificación de que otro cliente actualizó el portapapeles
      showToastNotification('Portapapeles actualizado remotamente');
      // Solicitar el nuevo contenido
      socket.emit('clipboard_get');
    });

    socket.on('clipboard_error', (error) => {
      setIsSyncing(false);
      toast.error(`Error de portapapeles: ${error.message}`);
    });

    // Solicitar contenido inicial
    socket.emit('clipboard_get');

    return () => {
      socket.off('clipboard_content');
      socket.off('clipboard_set_success');
      socket.off('clipboard_updated');
      socket.off('clipboard_error');
    };
  }, [socket]);

  const showToastNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleGetClipboard = useCallback(() => {
    if (!socket || isPublic) return;
    
    setIsSyncing(true);
    socket.emit('clipboard_get');
  }, [socket, isPublic]);

  const handleSetClipboard = useCallback(() => {
    if (!socket || isPublic) return;
    
    if (!clipboardContent.trim()) {
      toast.error('No hay contenido para sincronizar');
      return;
    }
    
    setIsSyncing(true);
    socket.emit('clipboard_set', {
      content: clipboardContent,
      type: 'text/plain'
    });
  }, [socket, clipboardContent, isPublic]);

  const handleContentChange = (e) => {
    setClipboardContent(e.target.value);
  };

  const handlePasteFromLocal = useCallback(async () => {
    if (isPublic) {
      toast.error('Sincronización no disponible en modo público');
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      setClipboardContent(text);
      toast.success('Contenido pegado desde tu dispositivo');
    } catch (err) {
      toast.error('No se pudo acceder al portapapeles local');
    }
  }, [isPublic]);

  const handleCopyToLocal = useCallback(async () => {
    if (!clipboardContent) {
      toast.error('No hay contenido para copiar');
      return;
    }

    try {
      await navigator.clipboard.writeText(clipboardContent);
      toast.success('Copiado a tu portapapeles');
    } catch (err) {
      toast.error('No se pudo copiar al portapapeles');
    }
  }, [clipboardContent]);

  const formatTime = (date) => {
    if (!date) return 'Nunca';
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const truncateContent = (content, maxLength = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <>
      <div className={`clipboard-sync-container ${isMinimized ? 'clipboard-sync-minimized' : ''}`}>
        <div className="clipboard-sync-header">
          <h3>Sincronización</h3>
          <button 
            className="clipboard-sync-toggle"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? '📋' : '−'}
          </button>
        </div>
        
        {!isMinimized && (
          <div className="clipboard-sync-content">
            <div className="clipboard-preview">
              <p className="clipboard-preview-label">Contenido del portapapeles remoto</p>
              {clipboardContent ? (
                <pre className="clipboard-preview-content">
                  {truncateContent(clipboardContent)}
                </pre>
              ) : (
                <p className="clipboard-preview-empty">Sin contenido</p>
              )}
            </div>
            
            <div className="clipboard-actions">
              <button 
                className="clipboard-btn clipboard-btn-secondary"
                onClick={handlePasteFromLocal}
                disabled={isPublic}
                title="Pegar desde tu dispositivo"
              >
                📥 Pegar
              </button>
              <button 
                className="clipboard-btn clipboard-btn-primary"
                onClick={handleSetClipboard}
                disabled={isPublic || !clipboardContent}
                title="Enviar al dispositivo remoto"
              >
                📤 Enviar
              </button>
            </div>
            
            <div className="clipboard-actions" style={{ marginTop: '8px' }}>
              <button 
                className="clipboard-btn clipboard-btn-secondary"
                onClick={handleGetClipboard}
                disabled={isPublic}
                title="Obtener del dispositivo remoto"
              >
                🔄 Obtener
              </button>
              <button 
                className="clipboard-btn clipboard-btn-secondary"
                onClick={handleCopyToLocal}
                disabled={!clipboardContent}
                title="Copiar a tu dispositivo"
              >
                📋 Copiar
              </button>
            </div>
            
            <div className="clipboard-status">
              <span className={`clipboard-status-indicator ${isSyncing ? 'syncing' : ''}`}></span>
              <span>
                {isSyncing ? 'Sincronizando...' : 
                 lastSync ? `Última sync: ${formatTime(lastSync)}` : 
                 'Sin sincronizar'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {showToast && (
        <div className="clipboard-toast">
          <span className="clipboard-toast-icon">📋</span>
          <span className="clipboard-toast-message">{toastMessage}</span>
          <button 
            className="clipboard-toast-close"
            onClick={() => setShowToast(false)}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
};

export default ClipboardSync;
