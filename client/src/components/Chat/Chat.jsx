import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import './Chat.css';

const Chat = ({ socket, userId, username }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('broadcast');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Escuchar mensajes entrantes
    socket.on('chat_message', (message) => {
      setMessages(prev => [...prev, message]);
      
      // Incrementar contador si está minimizado
      if (isMinimized) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Mostrar notificación para mensajes privados
      if (message.type === 'private' && message.to?.id === userId) {
        toast.success(`💬 Mensaje privado de ${message.from.name}`, {
          duration: 3000
        });
      }
    });

    socket.on('chat_history', (history) => {
      setMessages(history);
    });

    socket.on('chat_users', (users) => {
      setConnectedUsers(users.filter(u => u.id !== userId));
    });

    socket.on('chat_user_joined', (user) => {
      toast.info(`👤 ${user.username} se ha unido al chat`, {
        duration: 2000
      });
    });

    socket.on('chat_user_left', (user) => {
      toast.info(`👤 ${user.username} ha salido del chat`, {
        duration: 2000
      });
    });

    socket.on('chat_error', (error) => {
      toast.error(`Error de chat: ${error.message}`);
    });

    // Solicitar historial y unirse al chat
    socket.emit('chat_join', { username });
    socket.emit('chat_get_history');

    return () => {
      socket.off('chat_message');
      socket.off('chat_history');
      socket.off('chat_users');
      socket.off('chat_user_joined');
      socket.off('chat_user_left');
      socket.off('chat_error');
      socket.emit('chat_leave');
    };
  }, [socket, userId, username, isMinimized]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (!isMinimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim() || !socket) return;

    const messageData = {
      content: inputMessage.trim(),
      to: selectedRecipient === 'broadcast' ? null : selectedRecipient,
      type: selectedRecipient === 'broadcast' ? 'broadcast' : 'private'
    };

    socket.emit('chat_send', messageData);
    setInputMessage('');
    setIsTyping(false);
  }, [inputMessage, socket, selectedRecipient]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    // Indicador de "escribiendo..."
    if (!isTyping && e.target.value) {
      setIsTyping(true);
      socket?.emit('chat_typing', { isTyping: true });
    }
    
    // Clear timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('chat_typing', { isTyping: false });
    }, 1000);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      // Resetear contador al abrir
      setUnreadCount(0);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageClass = (message) => {
    if (message.type === 'system') return 'system';
    if (message.from.id === userId) return 'own';
    return '';
  };

  return (
    <div className={`chat-container ${isMinimized ? 'chat-minimized' : ''}`}>
      <div className="chat-header">
        <h3>
          Chat
          {!isMinimized && (
            <span className="chat-online-count">
              {connectedUsers.length + 1} online
            </span>
          )}
        </h3>
        <button 
          className="chat-toggle"
          onClick={handleMinimize}
          style={{ position: 'relative' }}
        >
          {isMinimized ? '💬' : '−'}
          {isMinimized && unreadCount > 0 && (
            <span className="chat-unread-badge">{unreadCount}</span>
          )}
        </button>
      </div>
      
      {!isMinimized && (
        <>
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <div className="chat-empty-state-icon">💬</div>
                <p>No hay mensajes aún.<br/>¡Sé el primero en escribir!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`chat-message ${getMessageClass(message)}`}
                >
                  {message.type === 'private' && (
                    <div className="chat-message-private">
                      🔒 Privado {message.from.id === userId ? `para ${message.to?.name}` : ''}
                    </div>
                  )}
                  <div className="chat-message-header">
                    <span>{message.from.name}</span>
                    <span>{message.formattedTime || formatTime(message.timestamp)}</span>
                  </div>
                  <div className="chat-message-bubble">
                    {message.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input-area">
            <div className="chat-input-container">
              <input
                type="text"
                className="chat-input"
                placeholder="Escribe un mensaje..."
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                maxLength={500}
              />
              <button 
                className="chat-send-btn"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
              >
                ➤
              </button>
            </div>
            
            <div className="chat-recipient-selector">
              <span>Para:</span>
              <select 
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
              >
                <option value="broadcast">👥 Todos</option>
                {connectedUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    👤 {user.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
