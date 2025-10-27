
// ============================================
// routes/products.js
// ============================================
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/products
 * @desc    Obtener todos los productos
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.icon as category_icon
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
    
    const [products] = await db.query(query, params);
    
    // Formatear productos
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.base_price),
      image_url: product.image_url,
      category: product.category_name,
      is_combo: product.is_combo === 1
    }));
    
    res.json({ products: formattedProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Obtener un producto por ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [products] = await db.query(`
      SELECT 
        p.*,
        c.name as category_name,
        c.icon as category_icon
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_available = 1
    `, [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    const product = products[0];
    
    // Obtener tamaños
    const [sizes] = await db.query(`
      SELECT * FROM product_sizes WHERE product_id = ?
    `, [id]);
    
    // Obtener ingredientes
    const [ingredients] = await db.query(`
      SELECT 
        i.*,
        pi.is_default,
        pi.is_removable
      FROM ingredients i
      INNER JOIN product_ingredients pi ON i.id = pi.ingredient_id
      WHERE pi.product_id = ?
    `, [id]);
    
    // Obtener acompañamientos disponibles
    const [sides] = await db.query(`
      SELECT * FROM sides WHERE is_available = 1
    `);
    
    // Obtener bebidas disponibles
    const [drinks] = await db.query(`
      SELECT * FROM drinks WHERE is_available = 1
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
          name: s.size_name,
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
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

module.exports = router;