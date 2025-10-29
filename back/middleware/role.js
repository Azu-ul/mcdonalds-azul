import pool from '../db.js';

const authorizeRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const [roles] = await pool.execute(
        `SELECT r.name 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = ?`,
        [req.user.id]
      );

      const userRoles = roles.map(r => r.name);
      if (!userRoles.includes(requiredRole)) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }
      next();
    } catch (error) {
      console.error('Error en authorizeRole:', error);
      return res.status(500).json({ success: false, message: 'Error al verificar permisos.' });
    }
  };
};

export default authorizeRole;