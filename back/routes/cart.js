// back/routes/cart.js - NUEVO ARCHIVO

import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/cart
 * @desc    Obtener carrito del usuario autenticado
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Buscar o crear carrito del usuario
    let [carts] = await pool.query(
      'SELECT id FROM carts WHERE user_id = ?',
      [req.user.id]
    );

    let cartId;
    if (carts.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO carts (user_id) VALUES (?)',
        [req.user.id]
      );
      cartId = result.insertId;
    } else {
      cartId = carts[0].id;
    }

    // Obtener items del carrito con detalles
    const [items] = await pool.query(`
      SELECT 
        ci.*,
        p.name as product_name,
        p.image_url as product_image,
        ps.size_name,
        s.name as side_name,
        d.name as drink_name
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_sizes ps ON ci.size_id = ps.id
      LEFT JOIN sides s ON ci.side_id = s.id
      LEFT JOIN drinks d ON ci.drink_id = d.id
      WHERE ci.cart_id = ?
      ORDER BY ci.created_at DESC
    `, [cartId]);

    const formattedItems = items.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      size: item.size_name,
      side: item.side_name,
      drink: item.drink_name,
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.total_price),
      customizations: item.customizations ? JSON.parse(item.customizations) : null
    }));

    const total = formattedItems.reduce((sum, item) => sum + item.total_price, 0);

    res.json({
      success: true,
      cart: {
        id: cartId,
        items: formattedItems,
        total: total
      }
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener el carrito' 
    });
  }
});

/**
 * @route   POST /api/cart/items
 * @desc    Agregar item al carrito
 * @access  Private
 */
router.post('/items', authenticateToken, async (req, res) => {
  try {
    const {
      product_id,
      size_id,
      side_id,
      drink_id,
      quantity = 1,
      customizations
    } = req.body;

    if (!product_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'El producto es requerido' 
      });
    }

    // Verificar que el producto existe
    const [products] = await pool.query(
      'SELECT base_price FROM products WHERE id = ? AND is_available = 1',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado' 
      });
    }

    let unitPrice = parseFloat(products[0].base_price);

    // Agregar precio del tamaño
    if (size_id) {
      const [sizes] = await pool.query(
        'SELECT price_modifier FROM product_sizes WHERE id = ?',
        [size_id]
      );
      if (sizes.length > 0) {
        unitPrice += parseFloat(sizes[0].price_modifier);
      }
    }

    // Agregar precio del acompañamiento
    if (side_id) {
      const [sides] = await pool.query(
        'SELECT extra_price FROM sides WHERE id = ?',
        [side_id]
      );
      if (sides.length > 0) {
        unitPrice += parseFloat(sides[0].extra_price);
      }
    }

    // Agregar precio de la bebida
    if (drink_id) {
      const [drinks] = await pool.query(
        'SELECT extra_price FROM drinks WHERE id = ?',
        [drink_id]
      );
      if (drinks.length > 0) {
        unitPrice += parseFloat(drinks[0].extra_price);
      }
    }

    // Calcular precio total con customizaciones
    let extraPrice = 0;
    if (customizations) {
      const custom = JSON.parse(customizations);
      // Calcular extras de ingredientes
      if (custom.ingredients) {
        for (const [ingredientId, qty] of Object.entries(custom.ingredients)) {
          const [ingredients] = await pool.query(
            'SELECT extra_price FROM ingredients WHERE id = ?',
            [ingredientId]
          );
          if (ingredients.length > 0 && qty > 1) {
            extraPrice += parseFloat(ingredients[0].extra_price) * (qty - 1);
          }
        }
      }
    }

    unitPrice += extraPrice;
    const totalPrice = unitPrice * quantity;

    // Buscar o crear carrito
    let [carts] = await pool.query(
      'SELECT id FROM carts WHERE user_id = ?',
      [req.user.id]
    );

    let cartId;
    if (carts.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO carts (user_id) VALUES (?)',
        [req.user.id]
      );
      cartId = result.insertId;
    } else {
      cartId = carts[0].id;
    }

    // Agregar item al carrito
    const [result] = await pool.query(`
      INSERT INTO cart_items 
      (cart_id, product_id, size_id, side_id, drink_id, quantity, unit_price, total_price, customizations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cartId,
      product_id,
      size_id || null,
      side_id || null,
      drink_id || null,
      quantity,
      unitPrice,
      totalPrice,
      customizations || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Producto agregado al carrito',
      item_id: result.insertId
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al agregar al carrito' 
    });
  }
});

/**
 * @route   PUT /api/cart/items/:id
 * @desc    Actualizar cantidad de un item
 * @access  Private
 */
router.put('/items/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cantidad inválida' 
      });
    }

    // Verificar que el item pertenece al usuario
    const [items] = await pool.query(`
      SELECT ci.unit_price 
      FROM cart_items ci
      INNER JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.user_id = ?
    `, [id, req.user.id]);

    if (items.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item no encontrado' 
      });
    }

    const unitPrice = parseFloat(items[0].unit_price);
    const totalPrice = unitPrice * quantity;

    await pool.query(
      'UPDATE cart_items SET quantity = ?, total_price = ? WHERE id = ?',
      [quantity, totalPrice, id]
    );

    res.json({
      success: true,
      message: 'Cantidad actualizada'
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar item' 
    });
  }
});

/**
 * @route   DELETE /api/cart/items/:id
 * @desc    Eliminar item del carrito
 * @access  Private
 */
router.delete('/items/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el item pertenece al usuario
    const [items] = await pool.query(`
      SELECT ci.id 
      FROM cart_items ci
      INNER JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.user_id = ?
    `, [id, req.user.id]);

    if (items.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item no encontrado' 
      });
    }

    await pool.query('DELETE FROM cart_items WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Item eliminado del carrito'
    });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar item' 
    });
  }
});

/**
 * @route   DELETE /api/cart
 * @desc    Vaciar carrito
 * @access  Private
 */
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const [carts] = await pool.query(
      'SELECT id FROM carts WHERE user_id = ?',
      [req.user.id]
    );

    if (carts.length > 0) {
      await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [carts[0].id]);
    }

    res.json({
      success: true,
      message: 'Carrito vaciado'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al vaciar carrito' 
    });
  }
});

export default router;