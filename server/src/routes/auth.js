import express from 'express';
import bcrypt from 'bcryptjs';
import { generateToken, generatePublicToken, verifyToken, PUBLIC_ACCESS_PASSWORD, PUBLIC_ACCESS_ENABLED, isPublicToken } from '../config/auth.js';

import { validatePublicAccess, logPublicAccess, canAcceptPublicConnection } from '../middleware/publicAccess.js';
import logger from '../utils/logger.js';


const router = express.Router();

// Hash de contraseña desde variable de entorno
const getPasswordHash = () => {
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  return bcrypt.hashSync(password, 10);
};

const ADMIN_PASSWORD_HASH = getPasswordHash();

// Hash de contraseña pública
const getPublicPasswordHash = () => {
  return bcrypt.hashSync(PUBLIC_ACCESS_PASSWORD, 10);
};

const PUBLIC_PASSWORD_HASH = getPublicPasswordHash();

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

// Login público - acceso desde internet
router.post('/public-login', validatePublicAccess, async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    logPublicAccess(req, 'login', false);
    return res.status(400).json({ error: 'Contraseña requerida' });
  }

  try {
    const valid = await bcrypt.compare(password, PUBLIC_PASSWORD_HASH);
    
    if (!valid) {
      logPublicAccess(req, 'login', false);
      logger.warn(`Intento de login público fallido desde IP: ${req.ip}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generatePublicToken(`public-${Date.now()}`);
    
    logPublicAccess(req, 'login', true);
    logger.info(`Login público exitoso desde IP: ${req.ip}`);
    
    res.json({
      token,
      expiresIn: '1h',
      connectionType: 'public',
      message: 'Acceso público concedido',
      warning: 'Conexión pública - acceso limitado'
    });
  } catch (error) {
    logger.error('Error en login público:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar estado de acceso público
router.get('/public-status', (req, res) => {
  res.json({
    enabled: PUBLIC_ACCESS_ENABLED,
    availableSlots: canAcceptPublicConnection() ? (parseInt(process.env.MAX_PUBLIC_CONNECTIONS) || 5) : 0,
    message: PUBLIC_ACCESS_ENABLED ? 'Acceso público disponible' : 'Acceso público deshabilitado'
  });
});

router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    const isPublic = isPublicToken(decoded);
    return res.json({ 
      valid: true, 
      user: decoded,
      isPublic,
      connectionType: decoded.connectionType || 'private'
    });
  } catch (err) {
    return res.json({ valid: false });
  }
});


export default router;
