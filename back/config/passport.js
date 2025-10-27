import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../db.js';
import dotenv from 'dotenv';

dotenv.config();

const getHighQualityGoogleImage = (url) => {
  if (!url) return null;
  
  // Si es URL de Google, obtener la versión de alta calidad
  if (url.includes('googleusercontent.com')) {
    // Remover cualquier parámetro de tamaño existente
    let cleanUrl = url.split('=')[0];
    // Agregar parámetro para imagen de 400x400
    return `${cleanUrl}=s400-c`;
  }
  
  return url;
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const providerId = profile.id;
      
      console.log('🔍 Checking for existing user with email:', email);
      
      // Verificar si existe un usuario con ese email
      const [existingUsers] = await pool.query(
        'SELECT id, auth_provider FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        console.log('👤 Existing user found:', existingUser);
        
        // Si existe con proveedor LOCAL (contraseña tradicional)
        if (existingUser.auth_provider === 'local') {
          console.log('❌ User has local account, rejecting Google auth');
          const error = new Error('EMAIL_EXISTS_WITH_DIFFERENT_PROVIDER');
          error.provider = 'local';
          return done(error, false);
        }
        
        // Si existe con Google, permitir login
        if (existingUser.auth_provider === 'google') {
          console.log('✅ User has Google account, allowing login');
          // Continuar con el flujo normal para actualizar datos
        }
      }

      // Buscar usuario de Google específico
      const [googleUsers] = await pool.query(
        'SELECT * FROM users WHERE (auth_provider = ? AND provider_id = ?) OR email = ?',
        ['google', providerId, email]
      );

      const profileImageUrl = getHighQualityGoogleImage(profile.photos?.[0]?.value);

      let user;
      if (googleUsers.length > 0) {
        // Usuario ya existe - SOLO actualizar provider_id y access tokens
        user = googleUsers[0];
        console.log('🔄 Updating existing Google user:', user.id);
        await pool.query(
          `UPDATE users SET 
            auth_provider = 'google',
            provider_id = ?,
            is_verified = TRUE,
            updated_at = NOW()
          WHERE id = ?`,
          [providerId, user.id]
        );
      } else {
        // Nuevo usuario - guardar datos de Google por primera vez
        console.log('✨ Creating new Google user');
        const username = profile.displayName; 
        const [result] = await pool.query(
          `INSERT INTO users 
          (username, email, full_name, profile_image_url, auth_provider, provider_id, is_verified, password_hash)
          VALUES (?, ?, ?, ?, 'google', ?, TRUE, NULL)`,
          [username, email, profile.displayName, profileImageUrl, providerId]
        );
        
        user = {
          id: result.insertId,
          username,
          email,
          full_name: profile.displayName,
          profile_image_url: profileImageUrl,
          auth_provider: 'google'
        };
      }

      // Guardar/actualizar tokens OAuth
      await pool.query(
        `INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token, expires_at)
        VALUES (?, 'google', ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
        ON DUPLICATE KEY UPDATE 
          access_token = VALUES(access_token),
          refresh_token = VALUES(refresh_token),
          expires_at = VALUES(expires_at),
          updated_at = NOW()`,
        [user.id, accessToken, refreshToken]
      );

      console.log('✅ Google OAuth success for user:', user.email);

      return done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      return done(error, null);
    }
  }
));

export default passport;