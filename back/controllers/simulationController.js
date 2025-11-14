// simulationController.js - Versión completa corregida
import pool from '../db.js';


const simulationController = {

    
    // Generar pedido simulado
    generateSimulatedOrder: async (req, res) => {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Obtener un restaurante aleatorio
            const [restaurants] = await connection.execute(
                'SELECT id, name, address FROM restaurants WHERE is_open = 1 ORDER BY RAND() LIMIT 1'
            );

            if (restaurants.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'No hay restaurantes disponibles' });
            }

            const restaurant = restaurants[0];

            // Obtener un usuario aleatorio (cliente)
            const [users] = await connection.execute(
                'SELECT id, full_name, phone FROM users WHERE id != ? ORDER BY RAND() LIMIT 1',
                [req.user?.id || 0]
            );

            const user = users.length > 0 ? users[0] : {
                id: 1,
                full_name: 'Cliente Demo',
                phone: '+5491112345678'
            };

            // Direcciones de entrega simuladas en Mar del Plata
            const deliveryAddresses = [
                'Av. Colón 2500, Mar del Plata',
                'Calle San Martín 1800, Mar del Plata',
                'Av. Independencia 3200, Mar del Plata',
                'Calle Rivadavia 1500, Mar del Plata',
                'Av. Juan B. Justo 2800, Mar del Plata',
                'Calle Olavarría 2200, Mar del Plata',
                'Av. Luro 3500, Mar del Plata',
                'Calle Corrientes 1200, Mar del Plata'
            ];

            const randomAddress = deliveryAddresses[Math.floor(Math.random() * deliveryAddresses.length)];

            // Precios aleatorios entre $5000 y $25000
            const subtotal = Math.floor(Math.random() * 20000) + 5000;
            const deliveryFee = 1500;
            const total = subtotal + deliveryFee;

            // Tiempo de entrega estimado entre 15-40 minutos
            const estimatedDeliveryTime = Math.floor(Math.random() * 25) + 15;

            // Insertar pedido simulado
            const [orderResult] = await connection.execute(
                `INSERT INTO orders (
          user_id, restaurant_id, delivery_address, order_type,
          subtotal, delivery_fee, total, status, estimated_delivery_time
        ) VALUES (?, ?, ?, 'delivery', ?, ?, ?, 'confirmed', ?)`,
                [user.id, restaurant.id, randomAddress, subtotal, deliveryFee, total, estimatedDeliveryTime]
            );

            const orderId = orderResult.insertId;

            // Obtener algunos productos aleatorios para agregar al pedido
            const [products] = await connection.execute(
                'SELECT id, name, base_price FROM products WHERE is_available = 1 ORDER BY RAND() LIMIT 3'
            );

            // Agregar items al pedido
            for (const product of products) {
                const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 unidades
                const unitPrice = product.base_price;
                const totalPrice = unitPrice * quantity;

                await connection.execute(
                    `INSERT INTO order_items (
            order_id, product_id, product_name, quantity, unit_price, total_price
          ) VALUES (?, ?, ?, ?, ?, ?)`,
                    [orderId, product.id, product.name, quantity, unitPrice, totalPrice]
                );
            }

            await connection.commit();

            res.json({
                message: 'Pedido simulado generado correctamente',
                order: {
                    id: orderId,
                    restaurant_name: restaurant.name,
                    restaurant_address: restaurant.address,
                    delivery_address: randomAddress,
                    total: total,
                    estimated_delivery_time: estimatedDeliveryTime,
                    customer_name: user.full_name,
                    customer_phone: user.phone
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error en generateSimulatedOrder:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        } finally {
            connection.release();
        }
    },

    // Generar múltiples pedidos simulados
    generateMultipleOrders: async (req, res) => {
        const connection = await pool.getConnection();

        try {
            const { count = 3 } = req.body;
            const generatedOrders = [];

            for (let i = 0; i < count; i++) {
                try {
                    await connection.beginTransaction();

                    // Obtener restaurante
                    const [restaurants] = await connection.execute(
                        'SELECT id, name, address FROM restaurants WHERE is_open = 1 ORDER BY RAND() LIMIT 1'
                    );

                    if (restaurants.length === 0) continue;

                    const restaurant = restaurants[0];

                    // Obtener usuario
                    const [users] = await connection.execute(
                        'SELECT id, full_name, phone FROM users WHERE id != ? ORDER BY RAND() LIMIT 1',
                        [req.user?.id || 0]
                    );

                    const user = users.length > 0 ? users[0] : {
                        id: 1, full_name: 'Cliente Demo', phone: '+5491112345678'
                    };

                    const deliveryAddresses = [
                        'Av. Colón 2500, Mar del Plata',
                        'Calle San Martín 1800, Mar del Plata',
                        'Av. Independencia 3200, Mar del Plata',
                        'Calle Rivadavia 1500, Mar del Plata',
                        'Av. Juan B. Justo 2800, Mar del Plata',
                        'Calle Olavarría 2200, Mar del Plata',
                        'Av. Luro 3500, Mar del Plata',
                        'Calle Corrientes 1200, Mar del Plata'
                    ];

                    const randomAddress = deliveryAddresses[Math.floor(Math.random() * deliveryAddresses.length)];
                    const subtotal = Math.floor(Math.random() * 20000) + 5000;
                    const deliveryFee = 1500;
                    const total = subtotal + deliveryFee;
                    const estimatedDeliveryTime = Math.floor(Math.random() * 25) + 15;

                    const [orderResult] = await connection.execute(
                        `INSERT INTO orders (
              user_id, restaurant_id, delivery_address, order_type,
              subtotal, delivery_fee, total, status, estimated_delivery_time
            ) VALUES (?, ?, ?, 'delivery', ?, ?, ?, 'confirmed', ?)`,
                        [user.id, restaurant.id, randomAddress, subtotal, deliveryFee, total, estimatedDeliveryTime]
                    );

                    const orderId = orderResult.insertId;

                    // Agregar productos
                    const [products] = await connection.execute(
                        'SELECT id, name, base_price FROM products WHERE is_available = 1 ORDER BY RAND() LIMIT 3'
                    );

                    for (const product of products) {
                        const quantity = Math.floor(Math.random() * 2) + 1;
                        const unitPrice = product.base_price;
                        const totalPrice = unitPrice * quantity;

                        await connection.execute(
                            `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
               VALUES (?, ?, ?, ?, ?, ?)`,
                            [orderId, product.id, product.name, quantity, unitPrice, totalPrice]
                        );
                    }

                    await connection.commit();

                    generatedOrders.push({
                        id: orderId,
                        restaurant_name: restaurant.name,
                        restaurant_address: restaurant.address,
                        delivery_address: randomAddress,
                        total: total,
                        estimated_delivery_time: estimatedDeliveryTime,
                        customer_name: user.full_name,
                        customer_phone: user.phone
                    });

                } catch (error) {
                    await connection.rollback();
                    console.error(`Error generando pedido ${i + 1}:`, error);
                }
            }

            res.json({
                message: `${generatedOrders.length} pedidos simulados generados`,
                orders: generatedOrders
            });

        } catch (error) {
            console.error('Error en generateMultipleOrders:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        } finally {
            connection.release();
        }
    },

    // En simulationController.js - CORREGIR la función
    simulateOrderReady: async (req, res) => {
        console.log('🔵 simulateOrderReady llamado');
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            console.log('🔍 Buscando pedidos en estado preparing...');
            const [preparingOrders] = await connection.execute(
                `SELECT id, status, driver_id FROM orders 
       WHERE status = 'preparing' 
       AND driver_id IS NOT NULL
       AND created_at < DATE_SUB(NOW(), INTERVAL 1 MINUTE)
       ORDER BY created_at ASC 
       LIMIT 10`
            );

            console.log(`📦 Pedidos encontrados: ${preparingOrders.length}`);
            console.log('Pedidos:', preparingOrders);

            let updatedCount = 0;

            for (const order of preparingOrders) {
                console.log(`🔄 Marcando pedido ${order.id} como ready`);
                await connection.execute(
                    `UPDATE orders SET 
         status = 'ready',
         updated_at = NOW() 
         WHERE id = ?`,
                    [order.id]
                );
                updatedCount++;
            }

            await connection.commit();

            console.log(`✅ ${updatedCount} pedidos marcados como listos`);

            res.json({
                message: `${updatedCount} pedidos marcados como listos`,
                updated_orders: updatedCount
            });

        } catch (error) {
            await connection.rollback();
            console.error('❌ Error en simulateOrderReady:', error);
            res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
        } finally {
            connection.release();
        }
    },

    rejectOrder: async (req, res) => {
        let connection;

        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const { order_id } = req.body;
            const user_id = req.user.id;

            console.log('🚫 Rechazando pedido:', { order_id, user_id });

            // 1. Verificar que el usuario está registrado como repartidor
            const driver_id = await getDriverId(user_id, connection);
            if (!driver_id) {
                await connection.rollback();
                return res.status(400).json({
                    error: 'No estás registrado como repartidor'
                });
            }

            // 2. Verificar que el pedido existe y está disponible
            const [orders] = await connection.execute(
                `SELECT id, status, driver_id 
             FROM orders 
             WHERE id = ? AND status = 'confirmed' AND driver_id IS NULL`,
                [order_id]
            );

            if (orders.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    error: 'El pedido no está disponible o ya fue aceptado'
                });
            }

            // 3. Simplemente no hacer nada - el pedido queda disponible para otros repartidores
            // O si quieres llevar registro, podrías crear una tabla de rechazos
            await connection.commit();

            console.log('✅ Pedido rechazado correctamente:', order_id);

            res.json({
                success: true,
                message: 'Pedido rechazado correctamente',
                order_id: order_id
            });

        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error('Error en rollback:', rollbackError);
                }
            }

            console.error('❌ Error en rejectOrder:', error);
            res.status(500).json({
                error: 'Error interno del servidor: ' + error.message
            });
        } finally {
            if (connection) {
                try {
                    connection.release();
                } catch (releaseError) {
                    console.error('Error liberando conexión:', releaseError);
                }
            }
        }
    },

    // Limpiar pedidos simulados antiguos
    cleanupSimulatedOrders: async (req, res) => {
        try {
            const [result] = await pool.execute(
                `DELETE FROM orders 
         WHERE status = 'confirmed' 
         AND driver_id IS NULL 
         AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)`
            );

            res.json({
                message: `${result.affectedRows} pedidos antiguos eliminados`,
                deleted_count: result.affectedRows
            });

        } catch (error) {
            console.error('Error en cleanupSimulatedOrders:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

// 👇 ASEGURATE DE EXPORTAR CORRECTAMENTE
export default simulationController;