import logger from '../utils/logger.js';

/**
 * Servicio de chat para comunicación entre usuarios conectados
 * Soporta mensajes privados, broadcast y historial limitado
 */
class ChatService {
  constructor() {
    this.messages = []; // Historial de mensajes
    this.maxHistory = 100; // Máximo mensajes guardados
    this.connectedUsers = new Map(); // userId -> { socketId, username, joinedAt }
  }

  /**
   * Registra un usuario en el chat
   */
  registerUser(userId, socketId, username) {
    this.connectedUsers.set(userId, {
      socketId,
      username: username || `Usuario_${userId.slice(0, 6)}`,
      joinedAt: new Date()
    });
    
    logger.info(`👤 Usuario registrado en chat: ${username || userId}`);
    
    // Notificar a otros usuarios
    this.broadcastSystemMessage(`${username || 'Un usuario'} se ha unido al chat`, userId);
    
    return this.getConnectedUsersList();
  }

  /**
   * Elimina un usuario del chat
   */
  unregisterUser(userId) {
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.connectedUsers.delete(userId);
      logger.info(`👤 Usuario desconectado del chat: ${user.username || userId}`);
      
      // Notificar a otros usuarios
      this.broadcastSystemMessage(`${user.username || 'Un usuario'} ha salido del chat`, userId);
    }
    return user;
  }

  /**
   * Envía un mensaje broadcast a todos los usuarios
   */
  broadcastMessage(content, fromUserId, type = 'text') {
    const user = this.connectedUsers.get(fromUserId);
    if (!user) return null;

    const message = this.createMessage(content, fromUserId, user.username, 'broadcast', type);
    this.addToHistory(message);
    
    logger.debug(`💬 Mensaje broadcast de ${user.username}: ${content.substring(0, 50)}...`);
    
    return message;
  }

  /**
   * Envía un mensaje privado
   */
  sendPrivateMessage(content, fromUserId, toUserId, type = 'text') {
    const fromUser = this.connectedUsers.get(fromUserId);
    const toUser = this.connectedUsers.get(toUserId);
    
    if (!fromUser) return null;
    if (!toUser) {
      return { error: 'Usuario destino no encontrado o desconectado' };
    }

    const message = this.createMessage(content, fromUserId, fromUser.username, 'private', type, toUserId, toUser.username);
    this.addToHistory(message);
    
    logger.debug(`💬 Mensaje privado de ${fromUser.username} a ${toUser.username}: ${content.substring(0, 50)}...`);
    
    return message;
  }

  /**
   * Envía mensaje del sistema
   */
  broadcastSystemMessage(content, excludeUserId = null) {
    const message = this.createMessage(
      content,
      'system',
      'Sistema',
      'system',
      'text'
    );
    
    // Los mensajes del sistema no se guardan en historial
    logger.info(`📢 Mensaje del sistema: ${content}`);
    
    return message;
  }

  /**
   * Crea un objeto mensaje
   */
  createMessage(content, fromId, fromName, messageType, contentType = 'text', toId = null, toName = null) {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      from: {
        id: fromId,
        name: fromName
      },
      to: toId ? { id: toId, name: toName } : null,
      type: messageType, // 'broadcast', 'private', 'system'
      contentType, // 'text', 'file', 'image'
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }

  /**
   * Añade mensaje al historial
   */
  addToHistory(message) {
    this.messages.push(message);
    
    // Mantener solo los últimos mensajes
    if (this.messages.length > this.maxHistory) {
      this.messages.shift();
    }
  }

  /**
   * Obtiene historial de mensajes
   */
  getHistory(limit = 50, beforeTimestamp = null) {
    let history = this.messages;
    
    if (beforeTimestamp) {
      history = history.filter(m => m.timestamp < beforeTimestamp);
    }
    
    return history.slice(-limit);
  }

  /**
   * Obtiene lista de usuarios conectados
   */
  getConnectedUsersList() {
    const users = [];
    for (const [id, data] of this.connectedUsers) {
      users.push({
        id,
        username: data.username,
        joinedAt: data.joinedAt
      });
    }
    return users;
  }

  /**
   * Verifica si un usuario está conectado
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Obtiene información de un usuario
   */
  getUserInfo(userId) {
    return this.connectedUsers.get(userId) || null;
  }

  /**
   * Actualiza el nombre de usuario
   */
  updateUsername(userId, newUsername) {
    const user = this.connectedUsers.get(userId);
    if (user) {
      const oldName = user.username;
      user.username = newUsername;
      logger.info(`👤 Usuario ${userId} cambió nombre: ${oldName} -> ${newUsername}`);
      return true;
    }
    return false;
  }

  /**
   * Obtiene estadísticas del chat
   */
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalMessages: this.messages.length,
      maxHistory: this.maxHistory
    };
  }

  /**
   * Limpia mensajes antiguos del historial
   */
  cleanupOldMessages(maxAge = 24 * 60 * 60 * 1000) { // 24 horas por defecto
    const cutoff = Date.now() - maxAge;
    const originalLength = this.messages.length;
    
    this.messages = this.messages.filter(m => m.timestamp > cutoff);
    
    const removed = originalLength - this.messages.length;
    if (removed > 0) {
      logger.info(`🧹 Limpiados ${removed} mensajes antiguos del chat`);
    }
    
    return removed;
  }

  /**
   * Busca mensajes en el historial
   */
  searchMessages(query, limit = 20) {
    const lowerQuery = query.toLowerCase();
    return this.messages
      .filter(m => m.content.toLowerCase().includes(lowerQuery))
      .slice(-limit);
  }
}

export default new ChatService();
