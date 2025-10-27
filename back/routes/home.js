import express from 'express';
import pool from '../db.js';

const router = express.Router();

/**
 * @route   GET /api/home/categories
 * @desc    Obtener todas las categorías activas
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT id, name, icon, display_order 
      FROM categories 
      WHERE is_active = 1 
      ORDER BY display_order ASC
    `);
    
    res.json({ categories });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

/**
 * @route   GET /api/home/products
 * @desc    Obtener productos por categoría o todos
 * @access  Public
 */
router.get('/products', async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.base_price as price,
        p.image_url,
        c.name as category,
        p.is_combo
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.is_available = 1
    `;
    
    const params = [];
    
    if (category) {
      query += ` AND c.name = ?`;
      params.push(category);
    }
    
    query += ` ORDER BY p.display_order ASC, p.created_at DESC`;
    
    const [products] = await pool.query(query, params);
    
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      image_url: product.image_url,
      category: product.category,
      is_combo: product.is_combo === 1
    }));
    
    res.json({ products: formattedProducts });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

/**
 * @route   GET /api/home/products/:id
 * @desc    Obtener detalle completo de un producto
 * @access  Public
 */
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Producto base
    const [products] = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_available = 1
    `, [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    const product = products[0];
    
    // Tamaños
    const [sizes] = await pool.query(`
      SELECT id, size_name as name, price_modifier 
      FROM product_sizes 
      WHERE product_id = ?
    `, [id]);
    
    // Ingredientes
    const [ingredients] = await pool.query(`
      SELECT 
        i.id,
        i.name,
        i.is_required,
        i.max_quantity,
        i.extra_price,
        pi.is_default,
        pi.is_removable
      FROM ingredients i
      INNER JOIN product_ingredients pi ON i.id = pi.ingredient_id
      WHERE pi.product_id = ?
    `, [id]);
    
    // Acompañamientos
    const [sides] = await pool.query(`
      SELECT id, name, extra_price, image_url 
      FROM sides 
      WHERE is_available = 1
    `);
    
    // Bebidas
    const [drinks] = await pool.query(`
      SELECT id, name, extra_price, image_url 
      FROM drinks 
      WHERE is_available = 1
    `);
    
    res.json({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        base_price: parseFloat(product.base_price),
        image_url: product.image_url,
        category: product.category_name,
        is_combo: product.is_combo === 1,
        sizes: sizes.map(s => ({
          id: s.id,
          name: s.name,
          price_modifier: parseFloat(s.price_modifier)
        })),
        ingredients: ingredients.map(i => ({
          id: i.id,
          name: i.name,
          is_required: i.is_required === 1,
          is_default: i.is_default === 1,
          is_removable: i.is_removable === 1,
          max_quantity: i.max_quantity,
          extra_price: parseFloat(i.extra_price)
        })),
        sides: sides.map(s => ({
          id: s.id,
          name: s.name,
          extra_price: parseFloat(s.extra_price),
          image_url: s.image_url
        })),
        drinks: drinks.map(d => ({
          id: d.id,
          name: d.name,
          extra_price: parseFloat(d.extra_price),
          image_url: d.image_url
        }))
      }
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

/**
 * @route   GET /api/home/flyers
 * @desc    Obtener flyers/promociones activas
 * @access  Public
 */
router.get('/flyers', async (req, res) => {
  try {
    const now = new Date().toISOString();
    
    const [flyers] = await pool.query(`
      SELECT id, title, description, image_url, link_url, display_order
      FROM flyers 
      WHERE is_active = 1 
        AND (start_date IS NULL OR start_date <= ?)
        AND (end_date IS NULL OR end_date >= ?)
      ORDER BY display_order ASC
    `, [now, now]);
    
    const formattedFlyers = flyers.map(f => ({
      id: f.id,
      title: f.title,
      description: f.description,
      image: f.image_url,
      link: f.link_url
    }));
    
    res.json({ flyers: formattedFlyers });
  } catch (error) {
    console.error('Error obteniendo flyers:', error);
    res.status(500).json({ error: 'Error al obtener promociones' });
  }
});

export default router;