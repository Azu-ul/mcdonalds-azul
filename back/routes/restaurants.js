// back/routes/restaurants.js
import express from 'express';
import pool from '../db.js';
import {authenticateToken} from '../middleware/auth.js';
import authorizeRole from '../middleware/role.js';

const router = express.Router();

// ✅ GET /api/restaurants → Listar todos los restaurantes (público o autenticado)
router.get('/', async (req, res) => {
  try {
    const [restaurants] = await pool.execute(`
      SELECT id, name, address, latitude, longitude, phone, is_open,
             opening_time, closing_time
      FROM restaurants
      WHERE is_open = 1
      ORDER BY name ASC
    `);
    res.json({ success: true, restaurants });
  } catch (error) {
    console.error('Error al obtener restaurantes:', error);
    res.status(500).json({ success: false, message: 'Error al cargar los restaurantes.' });
  }
});

// ✅ GET /api/restaurants/:id → Detalle de un restaurante (público)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, address, latitude, longitude, phone, is_open,
              opening_time, closing_time
       FROM restaurants
       WHERE id = ? AND is_open = 1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurante no encontrado.' });
    }
    res.json({ success: true, restaurant: rows[0] });
  } catch (error) {
    console.error('Error al obtener restaurante:', error);
    res.status(500).json({ success: false, message: 'Error al cargar el restaurante.' });
  }
});

// ✅ POST /api/restaurants → Crear (solo admin)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const {
    name,
    address,
    latitude,
    longitude,
    phone = null,
    is_open = true,
    opening_time = null,
    closing_time = null
  } = req.body;

  if (!name || !address || latitude == null || longitude == null) {
    return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO restaurants (name, address, latitude, longitude, phone, is_open, opening_time, closing_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, address, latitude, longitude, phone, is_open ? 1 : 0, opening_time, closing_time]
    );
    res.status(201).json({ success: true, id: result.insertId, message: 'Restaurante creado exitosamente.' });
  } catch (error) {
    console.error('Error al crear restaurante:', error);
    res.status(500).json({ success: false, message: 'Error al crear el restaurante.' });
  }
});

// ✅ PUT /api/restaurants/:id → Editar (solo admin)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  const {
    name,
    address,
    latitude,
    longitude,
    phone,
    is_open,
    opening_time,
    closing_time
  } = req.body;

  try {
    const [existing] = await pool.execute('SELECT id FROM restaurants WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurante no encontrado.' });
    }

    await pool.execute(
      `UPDATE restaurants SET
        name = COALESCE(?, name),
        address = COALESCE(?, address),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        phone = ?,
        is_open = COALESCE(?, is_open),
        opening_time = ?,
        closing_time = ?
       WHERE id = ?`,
      [
        name,
        address,
        latitude != null ? latitude : undefined,
        longitude != null ? longitude : undefined,
        phone,
        is_open != null ? (is_open ? 1 : 0) : undefined,
        opening_time,
        closing_time,
        id
      ].map(v => v === undefined ? null : v)
    );

    res.json({ success: true, message: 'Restaurante actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar restaurante:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el restaurante.' });
  }
});

// ✅ DELETE /api/restaurants/:id → Eliminar (solo admin)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM restaurants WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Restaurante no encontrado.' });
    }
    res.json({ success: true, message: 'Restaurante eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar restaurante:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el restaurante.' });
  }
});

export default router;