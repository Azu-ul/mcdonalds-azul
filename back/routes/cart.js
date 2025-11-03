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

    // Obtener info del cupón aplicado
    const [cartInfo] = await pool.query(`
  SELECT c.coupon_id, c.discount_amount,
         cp.title as coupon_title, cp.discount_type, cp.discount_value
  FROM carts c
  LEFT JOIN coupons cp ON c.coupon_id = cp.id
  WHERE c.id = ?
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

    const subtotal = formattedItems.reduce((sum, item) => sum + item.total_price, 0);
    const discountAmount = cartInfo[0]?.discount_amount || 0;
    const total = subtotal - discountAmount;

    res.json({
      success: true,
      cart: {
        id: cartId,
        items: formattedItems,
        subtotal: subtotal,
        total: total,
        coupon_id: cartInfo[0]?.coupon_id || null,
        coupon_title: cartInfo[0]?.coupon_title || null,
        discount_type: cartInfo[0]?.discount_type || null,
        discount_value: cartInfo[0]?.discount_value || null,
        discount_amount: discountAmount
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

// POST /api/cart/apply-coupon
router.post('/apply-coupon', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { coupon_id } = req.body;

  try {
    // Verificar que el cupón existe y está activo
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [coupons] = await pool.execute(
      `SELECT * FROM coupons 
       WHERE id = ? AND is_active = 1
       AND (start_date IS NULL OR start_date <= ?)
       AND (end_date IS NULL OR end_date >= ?)
       AND (usage_limit IS NULL OR used_count < usage_limit)`,
      [coupon_id, now, now]
    );

    if (coupons.length === 0) {
      return res.status(404).json({ success: false, message: 'Cupón no válido o expirado' });
    }

    const coupon = coupons[0];

    // Obtener carrito y calcular total
    const [carts] = await pool.execute(
      'SELECT * FROM carts WHERE user_id = ?',
      [userId]
    );

    if (carts.length === 0) {
      return res.status(404).json({ success: false, message: 'Carrito vacío' });
    }

    const cartId = carts[0].id;

    // Calcular total del carrito
    const [items] = await pool.execute(
      'SELECT SUM(total_price) as total FROM cart_items WHERE cart_id = ?',
      [cartId]
    );

    const subtotal = items[0].total || 0;

    // Verificar compra mínima
    if (subtotal < coupon.min_purchase) {
      return res.status(400).json({
        success: false,
        message: `Compra mínima de $${coupon.min_purchase} requerida`
      });
    }

    // Calcular descuento
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = subtotal * (coupon.discount_value / 100);
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }
    } else {
      discount = coupon.discount_value;
    }

    discount = Math.round(discount * 100) / 100;

    // Aplicar cupón al carrito
    await pool.execute(
      'UPDATE carts SET coupon_id = ?, discount_amount = ? WHERE id = ?',
      [coupon_id, discount, cartId]
    );

    res.json({
      success: true,
      message: `Descuento de $${discount} aplicado`,
      discount
    });
  } catch (error) {
    console.error('Error aplicando cupón:', error);
    res.status(500).json({ success: false, message: 'Error al aplicar cupón' });
  }
});

// DELETE /api/cart/coupon
router.delete('/coupon', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [carts] = await pool.execute(
      'SELECT id FROM carts WHERE user_id = ?',
      [userId]
    );

    if (carts.length === 0) {
      return res.status(404).json({ success: false, message: 'Carrito no encontrado' });
    }

    await pool.execute(
      'UPDATE carts SET coupon_id = NULL, discount_amount = 0 WHERE id = ?',
      [carts[0].id]
    );

    res.json({ success: true, message: 'Cupón removido' });
  } catch (error) {
    console.error('Error removiendo cupón:', error);
    res.status(500).json({ success: false, message: 'Error al remover cupón' });
  }
});

export default router;