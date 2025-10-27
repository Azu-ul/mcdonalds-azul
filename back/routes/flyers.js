// ============================================
// routes/flyers.js
// ============================================
import express from 'express';
import pool from '../db.js';
const router = express.Router();


/**
 * @route   GET /api/flyers
 * @desc    Obtener flyers activos
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const now = new Date().toISOString();
    
    const [flyers] = await pool.query(`
      SELECT * FROM flyers 
      WHERE is_active = 1 
        AND (start_date IS NULL OR start_date <= ?)
        AND (end_date IS NULL OR end_date >= ?)
      ORDER BY display_order ASC
    `, [now, now]);
    
    res.json({
      flyers: flyers.map(f => ({
        id: f.id,
        title: f.title,
        description: f.description,
        image: f.image_url,
        link: f.link_url
      }))
    });
  } catch (error) {
    console.error('Error fetching flyers:', error);
    res.status(500).json({ error: 'Error al obtener promociones' });
  }
});

export default router;