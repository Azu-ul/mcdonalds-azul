// back/routes/products.js - VERSIÓN COMPLETA Y CORREGIDA

import express from 'express';
import pool from '../db.js';
const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Obtener todos los productos o filtrados por categoría
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
    
    const [products] = await pool.query(query, params);
    
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
 * @desc    Obtener detalle completo de un producto con tamaños, ingredientes, acompañamientos y bebidas
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Producto base
    const [products] = await pool.query(`
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
    
    // Obtener tamaños disponibles para este producto
    const [sizes] = await pool.query(`
      SELECT id, size_name as name, price_modifier 
      FROM product_sizes 
      WHERE product_id = ?
      ORDER BY 
        CASE size_name 
          WHEN 'Mediano' THEN 1
          WHEN 'Grande' THEN 2
          ELSE 3
        END
    `, [id]);
    
    // Obtener ingredientes del producto
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
      ORDER BY 
        CASE 
          WHEN i.name = 'Pan' THEN 1
          WHEN i.name = 'Carne' THEN 2
          ELSE 3
        END,
        i.name
    `, [id]);
    
    // Obtener todos los acompañamientos disponibles
    const [sides] = await pool.query(`
      SELECT id, name, extra_price, image_url 
      FROM sides 
      WHERE is_available = 1
      ORDER BY 
        CASE 
          WHEN extra_price = 0 THEN 1
          ELSE 2
        END,
        name
    `);
    
    // Obtener todas las bebidas disponibles
    const [drinks] = await pool.query(`
      SELECT id, name, extra_price, image_url 
      FROM drinks 
      WHERE is_available = 1
      ORDER BY 
        CASE 
          WHEN extra_price = 0 THEN 1
          ELSE 2
        END,
        name
    `);
    
    // Formatear respuesta
    res.json({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        base_price: parseFloat(product.base_price),
        image_url: product.image_url,
        category: product.category_name,
        is_combo: product.is_combo === 1,
        
        // Tamaños
        sizes: sizes.map(s => ({
          id: s.id,
          name: s.name,
          price_modifier: parseFloat(s.price_modifier)
        })),
        
        // Ingredientes
        ingredients: ingredients.map(i => ({
          id: i.id,
          name: i.name,
          is_required: i.is_required === 1,
          is_default: i.is_default === 1,
          is_removable: i.is_removable === 1,
          max_quantity: i.max_quantity,
          extra_price: parseFloat(i.extra_price)
        })),
        
        // Acompañamientos
        sides: sides.map(s => ({
          id: s.id,
          name: s.name,
          extra_price: parseFloat(s.extra_price),
          image_url: s.image_url
        })),
        
        // Bebidas
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

export default router;