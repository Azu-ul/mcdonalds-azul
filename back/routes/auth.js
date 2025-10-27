import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Función para generar token JWT
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

// Registro tradicional - Solo validar email único
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Solo verificar si el EMAIL existe (username puede repetirse)
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

// Login tradicional - Solo con EMAIL (no username)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar solo por email
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

// Google OAuth - Iniciar autenticación
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

// Reemplazar SOLO el callback de Google:
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    console.log('📥 Google callback:', { err: err?.message, user: !!user, info });

    // Si hay error y es de cuenta existente con diferente proveedor
    if (err && err.message === 'EMAIL_EXISTS_WITH_DIFFERENT_PROVIDER') {
      const provider = err.provider || 'local';
      console.log('❌ Account exists with different provider:', provider);

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cuenta existente</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body>
            <script>
              console.log('Sending account_exists message to opener');
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_AUTH_ERROR',
                  error: 'account_exists',
                  provider: '${provider}'
                }, '*');
                setTimeout(() => window.close(), 500);
              } else {
                // Para móvil, redirigir con el scheme
                const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isMobile) {
                  window.location.href = 'rn3azul://?error=email_conflict&provider=${provider}';
                } else {
                  window.location.href = '${process.env.CLIENT_URL || 'http://localhost:3000'}?error=email_conflict&provider=${provider}';
                }
              }
            </script>
          </body>
        </html>
      `);
    }

    // Si hay otro tipo de error
    if (err || !user) {
      console.log('❌ Authentication failed:', err?.message);
      return res.send(`
        <!DOCTYPE html>
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_AUTH_ERROR',
                  error: 'auth_failed'
                }, '*');
                setTimeout(() => window.close(), 500);
              } else {
                const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isMobile) {
                  window.location.href = 'rn3azul://?error=auth_failed';
                } else {
                  window.location.href = '${process.env.CLIENT_URL || 'http://localhost:3000'}?error=auth_failed';
                }
              }
            </script>
          </body>
        </html>
      `);
    }

    // Si todo está bien, generar token y enviar respuesta exitosa
    try {
      const token = generateToken(user);
      const userData = encodeURIComponent(JSON.stringify(user));

      console.log('✅ Authentication successful for:', user.email);

      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Autenticación exitosa</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background-color: #FFF5F3;
                padding: 16px;
              }
              .card {
                background: white;
                padding: 40px 30px;
                border-radius: 14px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                text-align: center;
                max-width: 340px;
                width: 100%;
              }
              .checkmark {
                width: 70px;
                height: 70px;
                margin: 0 auto 20px;
                background-color: #FA8072;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: scaleIn 0.3s ease-out;
              }
              .checkmark::after {
                content: '✓';
                font-size: 40px;
                color: white;
                font-weight: bold;
              }
              h2 {
                color: #FA8072;
                font-size: 24px;
                margin-bottom: 12px;
              }
              p { color: #666; font-size: 14px; margin-bottom: 24px; }
              .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #FFB6A3;
                border-top-color: #FA8072;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin: 0 auto;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
              @keyframes scaleIn {
                from { transform: scale(0); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="checkmark"></div>
              <h2>¡Autenticación exitosa!</h2>
              <p>Redirigiendo a tu cuenta...</p>
              <div class="spinner"></div>
            </div>
            <script>
              console.log('Sending success message');
              try {
                if (window.opener) {
                  // Para popup en web
                  window.opener.postMessage({
                    type: 'GOOGLE_AUTH_SUCCESS',
                    token: '${token}',
                    user: '${userData}'
                  }, '*');
                  setTimeout(() => window.close(), 800);
                } else {
                  // Para móvil o web sin popup
                  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                  if (isMobile) {
                    window.location.href = 'rn3azul://?token=${token}&user=${userData}';
                  } else {
                    window.location.href = '${process.env.CLIENT_URL || 'http://localhost:3000'}?token=${token}&user=${userData}';
                  }
                }
              } catch (error) {
                console.error('Error:', error);
                const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isMobile) {
                  window.location.href = 'rn3azul://?error=auth_failed';
                } else {
                  window.location.href = '${process.env.CLIENT_URL || 'http://localhost:3000'}?error=auth_failed';
                }
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('❌ Error generating token:', error);
      return res.send(`
        <!DOCTYPE html>
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_AUTH_ERROR',
                  error: 'auth_failed'
                }, '*');
                setTimeout(() => window.close(), 500);
              } else {
                const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isMobile) {
                  window.location.href = 'rn3azul://?error=auth_failed';
                } else {
                  window.location.href = '${process.env.CLIENT_URL || 'http://localhost:3000'}?error=auth_failed';
                }
              }
            </script>
          </body>
        </html>
      `);
    }
  })(req, res, next);
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