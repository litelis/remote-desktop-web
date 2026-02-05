import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX) || 5, // 5 intentos
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Demasiados intentos de inicio de sesión',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});