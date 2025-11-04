import jwt from 'jsonwebtoken';
import pool from '../db.js';

// Función auxiliar para cargar roles (puede ir en este mismo archivo)
const loadUserRoles = async (userId) => {
  try {
    const [roles] = await pool.query(
      `SELECT r.name 
       FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = ?`,
      [userId]
    );
    
    return roles.map(role => role.name);
  } catch (error) {
    console.error('Error loading user roles:', error);
    return [];
  }
};

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Formato de token inválido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario existe
    const [users] = await pool.query(
      'SELECT id, username, email, full_name, phone, address, profile_image_url, auth_provider FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = users[0];
    
    // 👇 AGREGAR ESTA LÍNEA - CARGAR ROLES DEL USUARIO
    req.user.roles = await loadUserRoles(decoded.id);
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    return res.status(500).json({ error: 'Error al verificar token' });
  }
};