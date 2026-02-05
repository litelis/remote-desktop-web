import express from 'express';
import os from 'os';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: os.platform(),
    version: process.version
  });
});

router.get('/ping', (req, res) => {
  res.json({ pong: true });
});

export default router;