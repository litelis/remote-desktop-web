import { Router } from 'express';
import { createReadStream } from 'fs';
import { authMiddleware } from '../middleware/auth.js';
import fileTransferService from '../services/fileTransfer.js';
import logger from '../utils/logger.js';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authMiddleware);

// Listar archivos disponibles
router.get('/files', async (req, res) => {
  try {
    const files = await fileTransferService.getFileList();
    res.json({
      success: true,
      files: files.map(file => ({
        name: file.name,
        size: file.size,
        sizeFormatted: fileTransferService.formatBytes(file.size),
        created: file.created,
        modified: file.modified
      }))
    });
  } catch (error) {
    logger.error('Error listando archivos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Descargar archivo
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const fileData = await fileTransferService.getFileStream(filename);
    
    res.setHeader('Content-Length', fileData.size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Last-Modified', fileData.mtime.toUTCString());
    
    fileData.stream.pipe(res);
    
    logger.info(`📥 Archivo descargado: ${filename} por usuario ${req.user.id}`);
  } catch (error) {
    logger.error(`Error descargando archivo ${req.params.filename}:`, error);
    res.status(404).json({ success: false, error: error.message });
  }
});

// Eliminar archivo
router.delete('/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    await fileTransferService.deleteFile(filename);
    
    res.json({
      success: true,
      message: `Archivo ${filename} eliminado correctamente`
    });
    
    logger.info(`🗑️ Archivo eliminado: ${filename} por usuario ${req.user.id}`);
  } catch (error) {
    logger.error(`Error eliminando archivo ${req.params.filename}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener progreso de transferencia
router.get('/progress/:transferId', (req, res) => {
  const { transferId } = req.params;
  const progress = fileTransferService.getTransferProgress(transferId);
  
  if (!progress) {
    return res.status(404).json({ 
      success: false, 
      error: 'Transferencia no encontrada' 
    });
  }
  
  res.json({ success: true, progress });
});

export default router;
