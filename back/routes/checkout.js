import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('=== CHECKOUT GET ===');
        console.log('User ID:', req.user.id);

        // Obtener carrito
        const [cartRows] = await pool.execute(
            'SELECT * FROM carts WHERE user_id = ?',
            [req.user.id]
        );

        console.log('Cart rows:', cartRows);

        if (cartRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Carrito vacío' });
        }

        const cart = cartRows[0];

        // Obtener items del carrito con info de productos
        const [items] = await pool.execute(
            `SELECT ci.*, p.name, p.image_url, ps.size_name, s.name as side_name, d.name as drink_name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_sizes ps ON ci.size_id = ps.id
       LEFT JOIN sides s ON ci.side_id = s.id
       LEFT JOIN drinks d ON ci.drink_id = d.id
       WHERE ci.cart_id = ?`,
            [cart.id]
        );

        console.log('Cart items:', items.length);

        if (items.length === 0) {
            return res.status(400).json({ success: false, message: 'Carrito vacío' });
        }

        // Calcular totales
        const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);

        // ✅ Obtener dirección del usuario desde la tabla users
        const [userRows] = await pool.execute(
            `SELECT address, latitude, longitude FROM users WHERE id = ?`,
            [req.user.id]
        );

        console.log('User data:', userRows);

        let deliveryInfo = null;

        // ✅ PRIORIDAD 1: Si el carrito tiene restaurant_id (pickup)
        if (cart.restaurant_id) {
            console.log('Carrito tiene restaurant_id:', cart.restaurant_id);
            const [restaurantRows] = await pool.execute(
                `SELECT id, name, address, latitude, longitude FROM restaurants WHERE id = ?`,
                [cart.restaurant_id]
            );
            console.log('Restaurant rows:', restaurantRows);

            if (restaurantRows.length > 0) {
                const r = restaurantRows[0];
                deliveryInfo = {
                    type: 'pickup',
                    label: r.name,
                    address: r.address,
                    latitude: r.latitude ? parseFloat(r.latitude) : null,
                    longitude: r.longitude ? parseFloat(r.longitude) : null
                };
                console.log('Usando restaurant para pickup:', deliveryInfo);
            }
        }
        // ✅ PRIORIDAD 2: Si el usuario tiene dirección guardada (delivery)
        else if (userRows.length > 0 && userRows[0].address) {
            deliveryInfo = {
                type: 'delivery',
                label: 'Mi dirección',
                address: userRows[0].address,
                latitude: userRows[0].latitude ? parseFloat(userRows[0].latitude) : null,
                longitude: userRows[0].longitude ? parseFloat(userRows[0].longitude) : null
            };
            console.log('Usando dirección de usuario:', deliveryInfo);
        }

        console.log('Final delivery info:', deliveryInfo);

        res.json({
            success: true,
            cart: {
                items,
                subtotal,
                discount: 0,
                total: subtotal
            },
            delivery: deliveryInfo
        });
    } catch (error) {
        console.error('Error en checkout:', error);
        res.status(500).json({ success: false, message: 'Error al cargar checkout' });
    }
});

router.post('/complete', authenticateToken, async (req, res) => {
    const { payment_method, tip = 0 } = req.body;

    if (!payment_method) {
        return res.status(400).json({ success: false, message: 'Método de pago requerido' });
    }

    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // Obtener carrito
        const [cartRows] = await conn.execute(
            'SELECT * FROM carts WHERE user_id = ?',
            [req.user.id]
        );

        if (cartRows.length === 0) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'Carrito vacío' });
        }

        const cart = cartRows[0];

        // Obtener items
        const [items] = await conn.execute(
            `SELECT ci.*, p.name, ps.size_name, s.name as side_name, d.name as drink_name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_sizes ps ON ci.size_id = ps.id
       LEFT JOIN sides s ON ci.side_id = s.id
       LEFT JOIN drinks d ON ci.drink_id = d.id
       WHERE ci.cart_id = ?`,
            [cart.id]
        );

        if (items.length === 0) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'Carrito vacío' });
        }

        // ✅ Calcular totales CON descuento
        const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
        const discount = parseFloat(cart.discount_amount || 0);
        const finalTotal = (subtotal - discount) + tip;

        // Obtener datos del usuario (dirección)
        const [userRows] = await conn.execute(
            'SELECT address, latitude, longitude FROM users WHERE id = ?',
            [req.user.id]
        );

        const user = userRows[0];
        let orderType = 'delivery';
        let restaurantId = null;
        let deliveryAddress = null;
        let deliveryLat = null;
        let deliveryLng = null;

        // Determinar si es delivery o pickup
        if (user && user.address) {
            orderType = 'delivery';
            deliveryAddress = user.address;
            deliveryLat = user.latitude;
            deliveryLng = user.longitude;
        } else if (cart.restaurant_id) {
            orderType = 'pickup';
            restaurantId = cart.restaurant_id;
        }

        // ✅ Crear orden con discount
        const [orderResult] = await conn.execute(
            `INSERT INTO orders (
                user_id, restaurant_id, delivery_address, delivery_latitude, delivery_longitude,
                order_type, subtotal, delivery_fee, discount, total, 
                status, payment_method, payment_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'confirmed', ?, 'paid')`,
            [
                req.user.id,
                restaurantId,
                deliveryAddress,
                deliveryLat,
                deliveryLng,
                orderType,
                subtotal,
                discount,
                finalTotal,
                payment_method
            ]
        );

        const orderId = orderResult.insertId;

        // Insertar items en order_items
        for (const item of items) {
            await conn.execute(
                `INSERT INTO order_items (order_id, product_id, product_name, size_name, side_name, drink_name, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [orderId, item.product_id, item.name, item.size_name, item.side_name, item.drink_name, item.quantity, item.unit_price, item.total_price]
            );
        }

        // ✅ Si había cupón, incrementar su contador de uso
        if (cart.coupon_id) {
            await conn.execute(
                'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
                [cart.coupon_id]
            );
        }

        // Limpiar carrito
        await conn.execute('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
        await conn.execute('DELETE FROM carts WHERE id = ?', [cart.id]);

        await conn.commit();

        res.json({
            success: true,
            message: '¡Pedido realizado con éxito!',
            order_id: orderId
        });

    } catch (error) {
        await conn.rollback();
        console.error('Error al completar orden:', error);
        res.status(500).json({ success: false, message: 'Error al procesar el pedido' });
    } finally {
        conn.release();
    }
});

export default router;