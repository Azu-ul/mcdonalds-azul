// ============================================
// routes/categories.js
// ============================================
import express from 'express';
import pool from '../db.js';
const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Obtener todas las categorías
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT * FROM categories 
      WHERE is_active = 1 
      ORDER BY display_order ASC
    `);
    
    res.json({
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon
      }))
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

export default router;