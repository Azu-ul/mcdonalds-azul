import express from 'express';
import pool from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth.js';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user?.id || 'unknown';
    cb(null, `${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (JPEG, PNG) y PDFs. Tamaño máximo: 5MB'));
  }
});

/**
 * @route   GET /api/profile
 * @desc    Obtener perfil completo del usuario autenticado
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        id, username, email, full_name, phone, address, 
        latitude, longitude, profile_image_url, document_image_url, 
        auth_provider, is_verified, created_at, updated_at 
      FROM users 
      WHERE id = ?
    `, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: users[0] });
  } catch (err) {
    console.error('Error al obtener perfil:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route   PUT /api/profile/username
 * @desc    Actualizar nombre de usuario
 * @access  Private
 */
router.put('/username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
    }

    await pool.query(
      'UPDATE users SET username = ?, updated_at = NOW() WHERE id = ?',
      [trimmedUsername, req.user.id]
    );

    const [users] = await pool.query(`
      SELECT id, username, email, full_name, phone, address, 
             latitude, longitude, profile_image_url, document_image_url, 
             auth_provider, is_verified 
      FROM users 
      WHERE id = ?
    `, [req.user.id]);

    res.json({
      message: 'Nombre actualizado exitosamente',
      user: users[0]
    });
  } catch (err) {
    console.error('Error al actualizar nombre:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route   PUT /api/profile/email
 * @desc    Actualizar email (solo para cuentas locales)
 * @access  Private
 */
router.put('/email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'El email es requerido' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [trimmedEmail, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }

    await pool.query(
      'UPDATE users SET email = ?, updated_at = NOW() WHERE id = ?',
      [trimmedEmail, req.user.id]
    );

    const [users] = await pool.query(`
      SELECT id, username, email, full_name, phone, address, 
             latitude, longitude, profile_image_url, document_image_url, 
             auth_provider, is_verified 
      FROM users 
      WHERE id = ?
    `, [req.user.id]);

    res.json({
      message: 'Email actualizado exitosamente',
      user: users[0]
    });
  } catch (err) {
    console.error('Error al actualizar email:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route   PUT /api/profile
 * @desc    Actualizar información personal
 * @access  Private
 */
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { email, full_name, phone, address, latitude, longitude } = req.body;
    const updates = [];
    const values = [];

    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ error: 'Email inválido' });
      }

      const [existing] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [trimmedEmail, req.user.id]
      );

      if (existing.length > 0) {
        return res.status(409).json({ error: 'Este email ya está registrado' });
      }

      updates.push('email = ?');
      values.push(trimmedEmail);
    }

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(full_name);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }

    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }

    if (latitude !== undefined) {
      updates.push('latitude = ?');
      values.push(latitude);
    }

    if (longitude !== undefined) {
      updates.push('longitude = ?');
      values.push(longitude);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    updates.push('updated_at = NOW()');
    values.push(req.user.id);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [users] = await pool.query(`
      SELECT id, username, email, full_name, phone, address, 
             latitude, longitude, profile_image_url, document_image_url, 
             auth_provider, is_verified 
      FROM users 
      WHERE id = ?
    `, [req.user.id]);

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: users[0]
    });
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route   POST /api/profile/image
 * @desc    Subir/actualizar imagen de perfil
 * @access  Private
 */
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó imagen' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const [users] = await pool.query(
      'SELECT profile_image_url FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users[0]?.profile_image_url && users[0].profile_image_url.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', users[0].profile_image_url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await pool.query(
      'UPDATE users SET profile_image_url = ?, updated_at = NOW() WHERE id = ?',
      [imageUrl, req.user.id]
    );

    res.json({
      message: 'Foto de perfil actualizada',
      profile_image_url: imageUrl
    });
  } catch (err) {
    console.error('Error al subir imagen:', err);
    res.status(500).json({ error: 'Error al subir imagen' });
  }
});

/**
 * @route   POST /api/profile/document
 * @desc    Subir documento de identidad
 * @access  Private
 */
router.post('/document', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó documento' });
    }

    const documentUrl = `/uploads/${req.file.filename}`;

    const [users] = await pool.query(
      'SELECT document_image_url FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users[0]?.document_image_url && users[0].document_image_url.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', users[0].document_image_url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await pool.query(
      'UPDATE users SET document_image_url = ?, updated_at = NOW() WHERE id = ?',
      [documentUrl, req.user.id]
    );

    res.json({
      message: 'Documento subido exitosamente',
      document_image_url: documentUrl
    });
  } catch (err) {
    console.error('Error al subir documento:', err);
    res.status(500).json({ error: 'Error al subir documento' });
  }
});

/**
 * @route   DELETE /api/profile/document
 * @desc    Eliminar documento de identidad
 * @access  Private
 */
router.delete('/document', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT document_image_url FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!users[0]?.document_image_url) {
      return res.status(404).json({ error: 'No hay documento para eliminar' });
    }

    if (users[0].document_image_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', users[0].document_image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query(
      'UPDATE users SET document_image_url = NULL, updated_at = NOW() WHERE id = ?',
      [req.user.id]
    );

    res.json({ message: 'Documento eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar documento:', err);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
});

/**
 * @route   PUT /api/profile/location
 * @desc    Actualizar ubicación del usuario
 * @access  Private
 */
router.put('/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Se requieren latitud y longitud' });
    }

    await pool.query(
      'UPDATE users SET latitude = ?, longitude = ?, address = ?, updated_at = NOW() WHERE id = ?',
      [latitude, longitude, address || null, req.user.id]
    );

    res.json({
      message: 'Ubicación actualizada exitosamente',
      location: { latitude, longitude, address }
    });
  } catch (err) {
    console.error('Error al actualizar ubicación:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route   DELETE /api/profile
 * @desc    Eliminar cuenta del usuario
 * @access  Private
 */
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT profile_image_url, document_image_url FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users[0]?.profile_image_url?.startsWith('/uploads/')) {
      const profilePath = path.join(__dirname, '..', users[0].profile_image_url);
      if (fs.existsSync(profilePath)) fs.unlinkSync(profilePath);
    }

    if (users[0]?.document_image_url?.startsWith('/uploads/')) {
      const docPath = path.join(__dirname, '..', users[0].document_image_url);
      if (fs.existsSync(docPath)) fs.unlinkSync(docPath);
    }

    await pool.query('DELETE FROM users WHERE id = ?', [req.user.id]);

    res.json({ message: 'Cuenta eliminada exitosamente' });
  } catch (err) {
    console.error('Error al eliminar cuenta:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route   GET /api/profile/orders
 * @desc    Obtener historial de pedidos del usuario
 * @access  Private
 */
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT 
        o.id,
        o.total,
        o.status,
        o.order_type,
        o.delivery_address,
        o.created_at,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `, [req.user.id]);

    res.json({ orders });
  } catch (err) {
    console.error('Error al obtener pedidos:', err);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

router.get('/roles', authenticateToken, async (req, res) => {
  try {
    const [userRoles] = await pool.query(
      `SELECT r.name 
       FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [req.user.id]
    );

    const roles = userRoles.map(r => r.name);

    // Si no tiene roles asignados, asignar 'seguidor' por defecto
    if (roles.length === 0) {
      const [roleResult] = await pool.query(
        'SELECT id FROM roles WHERE name = "seguidor"'
      );

      if (roleResult.length > 0) {
        await pool.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [req.user.id, roleResult[0].id]
        );
        roles.push('seguidor');
      }
    }

    res.json({ roles });
  } catch (err) {
    console.error('Error al obtener roles:', err);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
});

/**
 * @route   POST /api/profile/roles
 * @desc    Asignar rol (solo admin)
 * @access  Private
 */
router.post('/roles', authenticateToken, async (req, res) => {
  try {
    // Verificar si el usuario autenticado es admin
    const [userRoles] = await pool.query(
      `SELECT r.name 
       FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [req.user.id]
    );

    const isAdmin = userRoles.some(r => r.name === 'admin');
    if (!isAdmin) {
      return res.status(403).json({ error: 'No tienes permisos para asignar roles' });
    }

    const { user_id, role_name } = req.body;

    if (!user_id || !role_name) {
      return res.status(400).json({ error: 'user_id y role_name son requeridos' });
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
      [user_id, roles[0].id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'El usuario ya tiene este rol' });
    }

    // Asignar rol
    await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [user_id, roles[0].id]
    );

    res.json({ message: 'Rol asignado exitosamente' });
  } catch (err) {
    console.error('Error al asignar rol:', err);
    res.status(500).json({ error: 'Error al asignar rol' });
  }
});

/**
 * @route   DELETE /api/profile/roles/:role_name
 * @desc    Quitar rol (solo admin)
 * @access  Private
 */
router.delete('/roles/:role_name', authenticateToken, async (req, res) => {
  try {
    // Verificar si el usuario autenticado es admin
    const [userRoles] = await pool.query(
      `SELECT r.name 
       FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [req.user.id]
    );

    const isAdmin = userRoles.some(r => r.name === 'admin');
    if (!isAdmin) {
      return res.status(403).json({ error: 'No tienes permisos para quitar roles' });
    }

    const { role_name } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id es requerido' });
    }

    // Obtener ID del rol
    const [roles] = await pool.query(
      'SELECT id FROM roles WHERE name = ?',
      [role_name]
    );

    if (roles.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // Eliminar rol
    await pool.query(
      'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
      [user_id, roles[0].id]
    );

    res.json({ message: 'Rol eliminado exitosamente' });
  } catch (err) {
    console.error('Error al quitar rol:', err);
    res.status(500).json({ error: 'Error al quitar rol' });
  }
});

// GET /api/profile/orders - Obtener historial de órdenes
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT 
        o.id, 
        o.created_at, 
        o.total, 
        o.status, 
        o.order_type,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 20`,
      [req.user.id]
    );

    res.json({
      success: true,
      orders: orders.map(order => ({
        ...order,
        total: parseFloat(order.total),
        items_count: parseInt(order.items_count)
      }))
    });
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar el historial'
    });
  }
});

export default router;