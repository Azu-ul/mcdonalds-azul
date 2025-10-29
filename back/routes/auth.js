import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {authenticateToken} from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Registro tradicional
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, auth_provider) 
       VALUES (?, ?, ?, ?, 'local')`,
      [username, email, password_hash, full_name || username]
    );

    const userId = result.insertId;
    const token = generateToken({ id: userId, username, email });

    res.json({
      message: 'Usuario creado exitosamente',
      user: {
        id: userId,
        username,
        email,
        full_name: full_name || username,
        auth_provider: 'local'
      },
      token
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Login tradicional
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const [users] = await pool.query(
      `SELECT id, username, email, password_hash, full_name, phone, address, 
              profile_image_url, auth_provider 
       FROM users 
       WHERE email = ? AND auth_provider = 'local'`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const user = users[0];

    if (!user.password_hash) {
      return res.status(401).json({
        error: 'Esta cuenta usa autenticación social. Por favor inicia sesión con Google'
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const token = generateToken(user);
    delete user.password_hash;

    res.json({
      message: 'Login exitoso',
      user,
      token
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// En tu archivo de rutas de auth (backend)
router.post('/google', async (req, res) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: 'Token de Google requerido' });
    }

    // Verificar el token con Google
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${id_token}`);

    if (!response.ok) {
      return res.status(401).json({ error: 'Token de Google inválido' });
    }

    const googleData = await response.json();

    // Validaciones importantes
    if (googleData.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'Token no válido para esta aplicación' });
    }

    if (googleData.exp * 1000 < Date.now()) {
      return res.status(401).json({ error: 'Token expirado' });
    }

    const email = googleData.email;
    const providerId = googleData.sub;
    const profileImageUrl = googleData.picture;

    // Verificar si el usuario ya existe
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    let user;

    if (existingUsers.length > 0) {
      user = existingUsers[0];

      // Si el usuario existe pero con auth local
      if (user.auth_provider === 'local') {
        return res.status(409).json({
          error: 'Este email ya está registrado con email y contraseña. Por favor inicia sesión de esa manera.'
        });
      }

      // Actualizar datos del usuario de Google
      await pool.query(
        `UPDATE users SET 
          profile_image_url = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [profileImageUrl, user.id]
      );
    } else {
      // Crear nuevo usuario
      const username = googleData.email.split('@')[0] + '_' + providerId.substring(0, 8);
      const fullName = googleData.name || googleData.email.split('@')[0];

      const [result] = await pool.query(
        `INSERT INTO users 
        (username, email, full_name, profile_image_url, auth_provider, provider_id, is_verified)
        VALUES (?, ?, ?, ?, 'google', ?, TRUE)`,
        [username, email, fullName, profileImageUrl, providerId]
      );

      user = {
        id: result.insertId,
        username,
        email,
        full_name: fullName,
        profile_image_url: profileImageUrl,
        auth_provider: 'google'
      };
    }

    const token = generateToken(user);

    res.json({
      message: 'Login con Google exitoso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        profile_image_url: user.profile_image_url,
        auth_provider: 'google'
      },
      token
    });

  } catch (error) {
    console.error('Error en Google OAuth:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener información del usuario autenticado
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, username, email, full_name, phone, address, latitude, longitude,
              profile_image_url, document_image_url, auth_provider, is_verified, created_at 
       FROM users 
       WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: users[0] });
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;