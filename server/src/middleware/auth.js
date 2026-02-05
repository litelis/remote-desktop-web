import { verifyToken } from '../config/auth.js';
import logger from '../utils/logger.js';

export const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      logger.warn('Intento de conexión sin token');
      return next(new Error('Autenticación requerida'));
    }
    
    const decoded = verifyToken(token);
    socket.user = decoded;
    next();
  } catch (err) {
    logger.warn('Token inválido:', err.message);
    next(new Error('Token inválido o expirado'));
  }
};

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};