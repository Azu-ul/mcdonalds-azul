// back/routes/addresses.js
import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Agrega esto temporalmente para ver qué está pasando
router.get('/addresses', authenticateToken, async (req, res) => {
  try {
    console.log('=== INICIANDO GET /addresses ===');
    console.log('Usuario:', req.user);
    console.log('User ID:', req.user.id);

    // ✅ CORREGIDO: Seleccionar la columna 'label' de la base de datos
    const [addresses] = await pool.execute(
      `SELECT id, label, address, latitude, longitude, is_default, created_at, updated_at
       FROM user_addresses
       WHERE user_id = ?
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );

    console.log('Direcciones encontradas en BD:', addresses);

    if (addresses.length === 0) {
      console.log('No se encontraron direcciones para el usuario');
    }

    res.json({
      success: true,
      addresses: addresses.map(addr => ({
        id: addr.id,
        // ✅ CORREGIDO: Usar el label real de la base de datos, con fallback
        label: addr.label || 'Mi dirección',
        address: addr.address,
        latitude: addr.latitude,
        longitude: addr.longitude,
        is_default: addr.is_default
      }))
    });
  } catch (error) {
    console.error('Error completo:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al cargar las direcciones.',
      error: error.message
    });
  }
});

router.post('/addresses', authenticateToken, async (req, res) => {
  const {
    label = 'Casa',
    address, // Cambiar de street a address
    latitude = null,
    longitude = null,
    is_default = false
  } = req.body;

  if (!address) { // Cambiar de street a address
    return res.status(400).json({ success: false, message: 'La dirección es obligatoria.' });
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
      `INSERT INTO user_addresses (user_id, label, address, latitude, longitude, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`, // Quitar label, street, city
      [req.user.id, label, address, latitude, longitude, is_default ? 1 : 0]
    );

    res.status(201).json({ success: true, id: result.insertId, message: 'Dirección guardada.' });
  } catch (error) {
    console.error('Error al crear dirección:', error);
    res.status(500).json({ success: false, message: 'Error al guardar la dirección.' });
  }
});

router.put('/addresses/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { label, address, latitude, longitude, is_default } = req.body;

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

    // ACTUALIZACIÓN CORREGIDA - incluir label
    await pool.execute(
      `UPDATE user_addresses SET
        label = COALESCE(?, label),
        address = COALESCE(?, address),
        latitude = ?,
        longitude = ?,
        is_default = ?
       WHERE id = ?`,
      [
        label,        // ← Agregar label aquí
        address,      // ← address va después de label
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