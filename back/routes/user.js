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

// Configurar multer para subida de archivos
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

// Obtener perfil completo
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, username, email, full_name, phone, address, latitude, longitude,
              profile_image_url, document_image_url, auth_provider, is_verified, 
              created_at, updated_at 
       FROM users 
       WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: users[0] });
  } catch (err) {
    console.error('Error al obtener perfil:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar username - SIN validación de unicidad
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

    // NO verificar unicidad - permitir nombres duplicados
    // Ya no se verifica: WHERE username = ? AND id != ?

    // Actualizar username directamente
    await pool.query(
      'UPDATE users SET username = ?, updated_at = NOW() WHERE id = ?',
      [trimmedUsername, req.user.id]
    );

    // Obtener usuario actualizado
    const [users] = await pool.query(
      `SELECT id, username, email, full_name, phone, address, latitude, longitude,
              profile_image_url, document_image_url, auth_provider, is_verified 
       FROM users 
       WHERE id = ?`,
      [req.user.id]
    );

    res.json({
      message: 'Nombre actualizado exitosamente',
      user: users[0]
    });
  } catch (err) {
    console.error('Error al actualizar nombre:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar email - CON validación de unicidad
router.put('/email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'El email es requerido' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'El email debe contener @ y un dominio válido' });
    }

    // Verificar si el email ya está en uso por otro usuario
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [trimmedEmail, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }

    // Actualizar email
    await pool.query(
      'UPDATE users SET email = ?, updated_at = NOW() WHERE id = ?',
      [trimmedEmail, req.user.id]
    );

    // Obtener usuario actualizado
    const [users] = await pool.query(
      `SELECT id, username, email, full_name, phone, address, latitude, longitude,
              profile_image_url, document_image_url, auth_provider, is_verified 
       FROM users 
       WHERE id = ?`,
      [req.user.id]
    );

    res.json({
      message: 'Email actualizado exitosamente',
      user: users[0]
    });
  } catch (err) {
    console.error('Error al actualizar email:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar perfil
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email, full_name, phone, address, latitude, longitude } = req.body;
    const updates = [];
    const values = [];

    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ error: 'El email debe contener @ y un dominio válido' });
      }

      // Verificar si el email ya está en uso por otro usuario
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

    const [users] = await pool.query(
      `SELECT id, username, email, full_name, phone, address, latitude, longitude,
              profile_image_url, document_image_url, auth_provider, is_verified 
       FROM users 
       WHERE id = ?`,
      [req.user.id]
    );

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: users[0]
    });
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/profile-image', authenticateToken, upload.single('image'), async (req, res) => {
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
    console.error('Error al subir imagen de perfil:', err);
    res.status(500).json({ error: 'Error al subir imagen' });
  }
});

router.post('/document-image', authenticateToken, upload.single('document'), async (req, res) => {
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
    res.status(500).json({ error: 'Error al subir documento', details: err.message });
  }
});

// NUEVA RUTA: Eliminar documento
router.delete('/document-image', authenticateToken, async (req, res) => {
  try {
    // Obtener el documento actual del usuario
    const [users] = await pool.query(
      'SELECT document_image_url FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!users[0]?.document_image_url) {
      return res.status(404).json({ error: 'No hay documento para eliminar' });
    }

    // Eliminar el archivo físico si existe
    if (users[0].document_image_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', users[0].document_image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Archivo eliminado:', filePath);
      }
    }

    // Actualizar la base de datos para quitar la referencia
    await pool.query(
      'UPDATE users SET document_image_url = NULL, updated_at = NOW() WHERE id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Documento eliminado exitosamente'
    });
  } catch (err) {
    console.error('Error al eliminar documento:', err);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
});

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

router.delete('/account', authenticateToken, async (req, res) => {
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

// Obtener roles del usuario
router.get('/:id/roles', authenticateToken, async (req, res) => {
  try {
    const [userRoles] = await pool.query(
      `SELECT r.name 
       FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [req.params.id]
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
          [req.params.id, roleResult[0].id]
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

// Asignar rol a usuario (solo admin)
router.post('/:id/roles', authenticateToken, async (req, res) => {
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

// Quitar rol a usuario (solo admin)
router.delete('/:id/roles/:role_name', authenticateToken, async (req, res) => {
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
      [req.params.id, roles[0].id]
    );

    res.json({ message: 'Rol eliminado exitosamente' });
  } catch (err) {
    console.error('Error al quitar rol:', err);
    res.status(500).json({ error: 'Error al quitar rol' });
  }
});

export default router;