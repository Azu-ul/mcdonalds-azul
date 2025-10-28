// back/routes/addresses.js
import express from 'express';
import pool from '../db.js';
import {authenticateToken} from '../middleware/auth.js';

const router = express.Router();

// ✅ GET /api/user/addresses → Listar direcciones del usuario autenticado
router.get('/addresses', async (req, res) => {
  try {
    const [addresses] = await pool.execute(
      `SELECT id, label, street, city, latitude, longitude, is_default
       FROM user_addresses
       WHERE user_id = ?
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, addresses });
  } catch (error) {
    console.error('Error al obtener direcciones:', error);
    res.status(500).json({ success: false, message: 'Error al cargar las direcciones.' });
  }
});

// ✅ POST /api/user/addresses → Crear nueva dirección
router.post('/addresses', authenticateToken, async (req, res) => {
  const {
    label = 'Casa',
    street,
    city,
    latitude = null,
    longitude = null,
    is_default = false
  } = req.body;

  if (!street || !city) {
    return res.status(400).json({ success: false, message: 'Calle y ciudad son obligatorios.' });
  }

  try {
    // Si se marca como predeterminada, desmarcar las demás
    if (is_default) {
      await pool.execute(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
        [req.user.id]
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO user_addresses (user_id, label, street, city, latitude, longitude, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, label, street, city, latitude, longitude, is_default ? 1 : 0]
    );

    res.status(201).json({ success: true, id: result.insertId, message: 'Dirección guardada.' });
  } catch (error) {
    console.error('Error al crear dirección:', error);
    res.status(500).json({ success: false, message: 'Error al guardar la dirección.' });
  }
});

// ✅ PUT /api/user/addresses/:id → Editar dirección
router.put('/addresses/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { label, street, city, latitude, longitude, is_default } = req.body;

  try {
    // Verificar que la dirección pertenece al usuario
    const [existing] = await pool.execute(
      'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(403).json({ success: false, message: 'Acceso denegado.' });
    }

    if (is_default) {
      await pool.execute(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
        [req.user.id]
      );
    }

    await pool.execute(
      `UPDATE user_addresses SET
        label = COALESCE(?, label),
        street = COALESCE(?, street),
        city = COALESCE(?, city),
        latitude = ?,
        longitude = ?,
        is_default = ?
       WHERE id = ?`,
      [
        label,
        street,
        city,
        latitude,
        longitude,
        is_default ? 1 : 0,
        id
      ]
    );

    res.json({ success: true, message: 'Dirección actualizada.' });
  } catch (error) {
    console.error('Error al editar dirección:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar la dirección.' });
  }
});

// ✅ DELETE /api/user/addresses/:id → Eliminar dirección
router.delete('/addresses/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(403).json({ success: false, message: 'Acceso denegado o dirección no encontrada.' });
    }
    res.json({ success: true, message: 'Dirección eliminada.' });
  } catch (error) {
    console.error('Error al eliminar dirección:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar la dirección.' });
  }
});

export default router;