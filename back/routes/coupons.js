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
      SELECT id, code, title, description, discount_type, discount_value, 
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
    code,
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
    usage_limit = null
  } = req.body;

  // Validaciones básicas
  if (!code || !title || !discount_type || !discount_value) {
    return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
  }

  if (!['percentage', 'fixed'].includes(discount_type)) {
    return res.status(400).json({ success: false, message: 'Tipo de descuento inválido.' });
  }

  try {
    const query = `
      INSERT INTO coupons (
        code, title, description, discount_type, discount_value,
        min_purchase, max_discount, image_url, start_date, end_date,
        is_active, usage_limit, used_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    const values = [
      code.trim().toUpperCase(),
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
      usage_limit
    ];

    const [result] = await pool.execute(query, values);
    res.status(201).json({ success: true, couponId: result.insertId, message: 'Cupón creado exitosamente.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('code')) {
      return res.status(409).json({ success: false, message: 'El código del cupón ya existe.' });
    }
    console.error('Error al crear cupón:', error);
    res.status(500).json({ success: false, message: 'Error al crear el cupón.' });
  }
});

// ✅ PUT /api/coupons/:id → Editar cupón (solo admin)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  const {
    code,
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
    usage_limit
  } = req.body;

  try {
    // Verificar que el cupón exista
    const [existing] = await pool.execute('SELECT id FROM coupons WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Cupón no encontrado.' });
    }

    const query = `
      UPDATE coupons SET
        code = ?,
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
        usage_limit = ?
      WHERE id = ?
    `;
    const values = [
      code?.trim().toUpperCase() || existing[0].code,
      title || existing[0].title,
      description,
      discount_type || existing[0].discount_type,
      discount_value || existing[0].discount_value,
      min_purchase ?? existing[0].min_purchase,
      max_discount ?? existing[0].max_discount,
      image_url ?? existing[0].image_url,
      start_date ?? existing[0].start_date,
      end_date ?? existing[0].end_date,
      is_active ? 1 : 0,
      usage_limit ?? existing[0].usage_limit,
      id
    ];

    await pool.execute(query, values);
    res.json({ success: true, message: 'Cupón actualizado correctamente.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('code')) {
      return res.status(409).json({ success: false, message: 'El código del cupón ya existe.' });
    }
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
      SELECT id, code, title, description, discount_type, discount_value,
             min_purchase, max_discount, image_url, start_date, end_date,
             is_active, usage_limit, used_count, created_at
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