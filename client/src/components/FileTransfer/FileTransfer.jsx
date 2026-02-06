import React, { useState, useRef, useCallback, useEffect } from 'react';
import './FileTransfer.css';

const FileTransfer = ({ socket, isPublic }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Solicitar lista de archivos al conectar
  useEffect(() => {
    if (socket) {
      socket.emit('request_file_list');
      
      socket.on('file_list', (data) => {
        if (data.success) {
          setFiles(data.files);
        }
      });

      socket.on('file_upload_success', (data) => {
        setUploads(prev => prev.filter(u => u.transferId !== data.transferId));
        // Refrescar lista
        socket.emit('request_file_list');
      });

      socket.on('file_upload_error', (data) => {
        setUploads(prev => prev.map(u => 
          u.transferId === data.transferId 
            ? { ...u, error: data.error, status: 'error' }
            : u
        ));
      });

      return () => {
        socket.off('file_list');
        socket.off('file_upload_success');
        socket.off('file_upload_error');
      };
    }
  }, [socket]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => uploadFile(file));
  }, []);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    selectedFiles.forEach(file => uploadFile(file));
  }, []);

  const uploadFile = (file) => {
    if (isPublic) {
      alert('La transferencia de archivos no está disponible en modo público');
      return;
    }

    const transferId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setUploads(prev => [...prev, {
      transferId,
      filename: file.name,
      progress: 0,
      status: 'uploading'
    }]);

    // Notificar inicio de upload
    socket.emit('file_upload_start', {
      filename: file.name,
      fileSize: file.size,
      transferId
    });

    // Simular progreso (en implementación real usaríamos chunks)
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploads(prev => prev.map(u => 
        u.transferId === transferId ? { ...u, progress: Math.min(progress, 90) } : u
      ));
      
      if (progress >= 90) {
        clearInterval(interval);
        // Completar upload
        socket.emit('file_upload_complete', {
          transferId,
          filename: file.name,
          fileSize: file.size
        });
        
        setUploads(prev => prev.map(u => 
          u.transferId === transferId ? { ...u, progress: 100 } : u
        ));
      }
    }, 200);
  };

  const handleDownload = (filename) => {
    const token = localStorage.getItem('token');
    const apiUrl = process.env.REACT_APP_API_URL || '';
    window.open(`${apiUrl}/api/files/download/${filename}?token=${token}`, '_blank');
  };

  const handleDelete = (filename) => {
    if (window.confirm(`¿Eliminar ${filename}?`)) {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || '';
      
      fetch(`${apiUrl}/api/files/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          socket.emit('request_file_list');
        }
      });
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      zip: '📦',
      rar: '📦',
      txt: '📃',
      mp3: '🎵',
      mp4: '🎬',
      default: '📎'
    };
    return icons[ext] || icons.default;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`file-transfer-container ${isMinimized ? 'file-transfer-minimized' : ''}`}>
      <div className="file-transfer-header">
        <h3>Transferencia de Archivos</h3>
        <button 
          className="file-transfer-toggle"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? '📁' : '−'}
        </button>
      </div>
      
      {!isMinimized && (
        <div className="file-transfer-content">
          {!isPublic && (
            <div
              className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="drop-zone-icon">📤</div>
              <p className="drop-zone-text">
                Arrastra archivos aquí
                <strong>o haz clic para seleccionar</strong>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="file-input"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {uploads.length > 0 && (
            <div className="upload-progress">
              {uploads.map(upload => (
                <div key={upload.transferId} className="progress-item">
                  <div className="progress-header">
                    <p className="progress-filename">{upload.filename}</p>
                    <p className="progress-percentage">
                      {upload.status === 'error' ? '❌' : `${upload.progress}%`}
                    </p>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${upload.progress}%`,
                        background: upload.status === 'error' ? '#ef4444' : undefined
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="file-list">
            <h4>Archivos disponibles ({files.length})</h4>
            {files.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📂</div>
                <p className="empty-state-text">No hay archivos disponibles</p>
              </div>
            ) : (
              files.map(file => (
                <div key={file.name} className="file-item">
                  <div className="file-icon">{getFileIcon(file.name)}</div>
                  <div className="file-info">
                    <p className="file-name" title={file.name}>{file.name}</p>
                    <p className="file-meta">{file.sizeFormatted}</p>
                  </div>
                  <div className="file-actions">
                    <button 
                      className="file-btn download"
                      onClick={() => handleDownload(file.name)}
                      title="Descargar"
                    >
                      ⬇️
                    </button>
                    {!isPublic && (
                      <button 
                        className="file-btn delete"
                        onClick={() => handleDelete(file.name)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileTransfer;
