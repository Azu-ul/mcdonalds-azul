// /routes/coupons.js
import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import authorizeRole from '../middleware/role.js';

const router = express.Router();

// ✅ GET /api/coupons/active → Cupones activos para el cliente
router.get('/active', async (req, res) => {
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const query = `
      SELECT id, title, description, discount_type, discount_value, 
             min_purchase, max_discount, image_url, start_date, end_date, product_id
      FROM coupons
      WHERE is_active = 1
        AND (start_date IS NULL OR start_date <= ?)
        AND (end_date IS NULL OR end_date >= ?)
        AND (usage_limit IS NULL OR used_count < usage_limit)
      ORDER BY created_at DESC
    `;
    const [coupons] = await pool.execute(query, [now, now]);
    res.json({ success: true, coupons });
  } catch (error) {
    console.error('Error al obtener cupones activos:', error);
    res.status(500).json({ success: false, message: 'Error al cargar los cupones.' });
  }
});

// ✅ POST /api/coupons → Crear cupón (solo admin)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const {
    title,
    description,
    discount_type,
    discount_value,
    min_purchase = 0,
    max_discount = null,
    image_url = null,
    start_date = null,
    end_date = null,
    is_active = true,
    usage_limit = null,
    product_id = null
  } = req.body;

  // Validaciones básicas
  if (!title || !discount_type || !discount_value) {
    return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
  }

  if (!['percentage', 'fixed'].includes(discount_type)) {
    return res.status(400).json({ success: false, message: 'Tipo de descuento inválido.' });
  }

  try {
    const query = `
      INSERT INTO coupons (
        title, description, discount_type, discount_value,
        min_purchase, max_discount, image_url, start_date, end_date,
        is_active, usage_limit, used_count, product_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `;
    const values = [
      title,
      description || null,
      discount_type,
      discount_value,
      min_purchase,
      max_discount,
      image_url,
      start_date,
      end_date,
      is_active ? 1 : 0,
      usage_limit,
      product_id
    ];

    const [result] = await pool.execute(query, values);
    res.status(201).json({ success: true, couponId: result.insertId, message: 'Cupón creado exitosamente.' });
  } catch (error) {
    console.error('Error al crear cupón:', error);
    res.status(500).json({ success: false, message: 'Error al crear el cupón.' });
  }
});

// ✅ PUT /api/coupons/:id → Editar cupón (solo admin)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    discount_type,
    discount_value,
    min_purchase,
    max_discount,
    image_url,
    start_date,
    end_date,
    is_active,
    usage_limit,
    product_id
  } = req.body;

  try {
    // Verificar que el cupón exista
    const [existing] = await pool.execute('SELECT * FROM coupons WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Cupón no encontrado.' });
    }

    const query = `
      UPDATE coupons SET
        title = ?,
        description = ?,
        discount_type = ?,
        discount_value = ?,
        min_purchase = ?,
        max_discount = ?,
        image_url = ?,
        start_date = ?,
        end_date = ?,
        is_active = ?,
        usage_limit = ?,
        product_id = ?
      WHERE id = ?
    `;
    const values = [
      title || existing[0].title,
      description ?? existing[0].description,
      discount_type || existing[0].discount_type,
      discount_value ?? existing[0].discount_value,
      min_purchase ?? existing[0].min_purchase,
      max_discount ?? existing[0].max_discount,
      image_url ?? existing[0].image_url,
      start_date ?? existing[0].start_date,
      end_date ?? existing[0].end_date,
      is_active !== undefined ? (is_active ? 1 : 0) : existing[0].is_active,
      usage_limit ?? existing[0].usage_limit,
      product_id ?? existing[0].product_id,
      id
    ];

    await pool.execute(query, values);
    res.json({ success: true, message: 'Cupón actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar cupón:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el cupón.' });
  }
});

// ✅ DELETE /api/coupons/:id → Eliminar (solo admin)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Cupón no encontrado.' });
    }
    res.json({ success: true, message: 'Cupón eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar cupón:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el cupón.' });
  }
});

// ✅ GET /api/coupons → Listar todos (solo admin)
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [coupons] = await pool.execute(`
      SELECT id, title, description, discount_type, discount_value,
             min_purchase, max_discount, image_url, start_date, end_date,
             is_active, usage_limit, used_count, product_id, created_at
      FROM coupons
      ORDER BY created_at DESC
    `);
    res.json({ success: true, coupons });
  } catch (error) {
    console.error('Error al listar cupones:', error);
    res.status(500).json({ success: false, message: 'Error al cargar los cupones.' });
  }
});

export default router;