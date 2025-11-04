import express from 'express';
import roleController from '../controllers/roleController.js';
import { authenticateToken } from '../middleware/auth.js'; // 👈 Usando tu middleware actual

const router = express.Router();

// Obtener roles de un usuario (accesible para el propio usuario)
router.get('/user/:user_id/roles', authenticateToken, roleController.getUserRoles);

// Obtener todos los roles (solo admin) - Verificación manual
router.get('/', authenticateToken, (req, res, next) => {
  // Verificar si el usuario es admin
  if (!req.user.roles || !req.user.roles.includes('admin')) {
    return res.status(403).json({
      error: 'Acceso denegado. Se requieren permisos de administrador'
    });
  }
  next();
}, roleController.getAllRoles);

export default router;