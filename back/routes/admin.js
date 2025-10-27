import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware para verificar si es admin
const requireAdmin = async (req, res, next) => {
  try {
    const [userRoles] = await pool.query(
      `SELECT r.name FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [req.user.id]
    );

    const isAdmin = userRoles.some(r => r.name === 'admin');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
    }

    next();
  } catch (err) {
    console.error('Error verificando permisos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener conteo de usuarios
router.get('/usuarios/count', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('SELECT COUNT(*) as total FROM users');
    res.json({ total: result[0].total });
  } catch (err) {
    console.error('Error al contar usuarios:', err);
    res.status(500).json({ error: 'Error al contar usuarios' });
  }
});

// Listar todos los usuarios con roles
router.get('/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [usuarios] = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.profile_image_url,
        u.auth_provider,
        u.is_verified,
        u.created_at,
        GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    // Convertir roles de string a array
    const usuariosConRoles = usuarios.map(u => ({
      ...u,
      roles: u.roles ? u.roles.split(',') : []
    }));

    res.json({ usuarios: usuariosConRoles });
  } catch (err) {
    console.error('Error al listar usuarios:', err);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

// Obtener usuario específico con roles
router.get('/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT id, username, email, full_name, phone, address, 
              profile_image_url, auth_provider, is_verified, created_at
       FROM users WHERE id = ?`,
      [req.params.id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const [roles] = await pool.query(
      `SELECT r.name FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [req.params.id]
    );

    res.json({
      usuario: {
        ...usuarios[0],
        roles: roles.map(r => r.name)
      }
    });
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// Asignar rol a usuario
router.post('/usuarios/:id/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role_name } = req.body;

    if (!role_name) {
      return res.status(400).json({ error: 'El nombre del rol es requerido' });
    }

    // Obtener ID del rol
    const [roles] = await pool.query(
      'SELECT id FROM roles WHERE name = ?',
      [role_name]
    );

    if (roles.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // Verificar si ya tiene ese rol
    const [existing] = await pool.query(
      'SELECT id FROM user_roles WHERE user_id = ? AND role_id = ?',
      [req.params.id, roles[0].id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'El usuario ya tiene este rol' });
    }

    // Asignar rol
    await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [req.params.id, roles[0].id]
    );

    res.json({ message: 'Rol asignado exitosamente' });
  } catch (err) {
    console.error('Error al asignar rol:', err);
    res.status(500).json({ error: 'Error al asignar rol' });
  }
});

// Quitar rol a usuario
router.delete('/usuarios/:id/roles/:role_name', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role_name } = req.params;

    // Obtener ID del rol
    const [roles] = await pool.query(
      'SELECT id FROM roles WHERE name = ?',
      [role_name]
    );

    if (roles.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // Verificar que no sea el último admin
    if (role_name === 'admin') {
      const [adminCount] = await pool.query(
        `SELECT COUNT(*) as total FROM user_roles ur
         INNER JOIN roles r ON ur.role_id = r.id
         WHERE r.name = 'admin'`
      );

      if (adminCount[0].total <= 1) {
        return res.status(400).json({ error: 'No se puede quitar el rol de administrador al último admin' });
      }
    }

    // Eliminar rol
    await pool.query(
      'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
      [req.params.id, roles[0].id]
    );

    res.json({ message: 'Rol eliminado exitosamente' });
  } catch (err) {
    console.error('Error al quitar rol:', err);
    res.status(500).json({ error: 'Error al quitar rol' });
  }
});

// Eliminar usuario
router.delete('/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // No permitir que un admin se elimine a sí mismo
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta desde el panel admin' });
    }

    // Verificar que no sea el último admin
    const [userRoles] = await pool.query(
      `SELECT r.name FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [req.params.id]
    );

    const isAdmin = userRoles.some(r => r.name === 'admin');

    if (isAdmin) {
      const [adminCount] = await pool.query(
        `SELECT COUNT(*) as total FROM user_roles ur
         INNER JOIN roles r ON ur.role_id = r.id
         WHERE r.name = 'admin'`
      );

      if (adminCount[0].total <= 1) {
        return res.status(400).json({ error: 'No se puede eliminar al último administrador' });
      }
    }

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Listar todos los roles disponibles
router.get('/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM roles ORDER BY name');
    res.json({ roles });
  } catch (err) {
    console.error('Error al listar roles:', err);
    res.status(500).json({ error: 'Error al listar roles' });
  }
});

// Estadísticas generales del sistema
router.get('/estadisticas', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [usuarios] = await pool.query('SELECT COUNT(*) as total FROM users');
    const [equipos] = await pool.query('SELECT COUNT(*) as total FROM equipos');
    const [jugadores] = await pool.query('SELECT COUNT(*) as total FROM jugadores');
    const [partidos] = await pool.query('SELECT COUNT(*) as total FROM partidos');
    const [partidosPendientes] = await pool.query(
      "SELECT COUNT(*) as total FROM partidos WHERE estado = 'programado'"
    );
    const [goles] = await pool.query('SELECT COUNT(*) as total FROM goles');

    res.json({
      total_usuarios: usuarios[0].total,
      total_equipos: equipos[0].total,
      total_jugadores: jugadores[0].total,
      total_partidos: partidos[0].total,
      partidos_pendientes: partidosPendientes[0].total,
      total_goles: goles[0].total
    });
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;