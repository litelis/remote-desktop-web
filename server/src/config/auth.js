import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '8h';

// Public Access Configuration
export const PUBLIC_ACCESS_ENABLED = process.env.PUBLIC_ACCESS_ENABLED === 'true';
export const PUBLIC_ACCESS_PASSWORD = process.env.PUBLIC_ACCESS_PASSWORD || process.env.ADMIN_PASSWORD || 'public123';
export const MAX_PUBLIC_CONNECTIONS = parseInt(process.env.MAX_PUBLIC_CONNECTIONS) || 5;
export const PUBLIC_SESSION_TIMEOUT = parseInt(process.env.PUBLIC_SESSION_TIMEOUT) || 3600000; // 1 hour in ms

export const generateToken = (userId, connectionType = 'private') => {
  return jwt.sign(
    { id: userId, type: 'admin', connectionType }, 
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const generatePublicToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'public', connectionType: 'public', iat: Date.now() },
    JWT_SECRET,
    { expiresIn: Math.floor(PUBLIC_SESSION_TIMEOUT / 1000) + 's' }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export const isPublicToken = (decoded) => {
  return decoded.connectionType === 'public' || decoded.type === 'public';
};

export const generateRandomSecret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let secret = '';
  for (let i = 0; i < 64; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
};
