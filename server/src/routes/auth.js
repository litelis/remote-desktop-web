import express from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../config/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Hash de contraseña desde variable de entorno
const getPasswordHash = () => {
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  return bcrypt.hashSync(password, 10);
};

const ADMIN_PASSWORD_HASH = getPasswordHash();

router.post('/login', async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Contraseña requerida' });
  }

  try {
    const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    
    if (!valid) {
      logger.warn(`Intento de login fallido desde IP: ${req.ip}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generateToken('admin');
    
    logger.info(`Login exitoso desde IP: ${req.ip}`);
    
    res.json({
      token,
      expiresIn: '8h',
      message: 'Autenticación exitosa'
    });
  } catch (error) {
    logger.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.json({ valid: false });
  }
});

export default router;