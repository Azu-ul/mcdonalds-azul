import pool from '../db.js';

// Función helper para obtener driver_id
const getDriverId = async (user_id, connection = pool) => {
  const [drivers] = await connection.execute(
    `SELECT id FROM delivery_drivers WHERE user_id = ?`,
    [user_id]
  );
  return drivers.length > 0 ? drivers[0].id : null;
};

const deliveryController = {
  registerDriver: async (req, res) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const {
        user_id,
        birth_date,
        vehicle_type,
        address,
        availability_days,
        start_time,
        end_time
      } = req.body;

      // Verificar si el usuario ya es repartidor
      const [existingDriver] = await connection.execute(
        'SELECT * FROM delivery_drivers WHERE user_id = ?',
        [user_id]
      );

      if (existingDriver.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'El usuario ya está registrado como repartidor'
        });
      }

      // Insertar repartidor
      const [result] = await connection.execute(
        `INSERT INTO delivery_drivers 
        (user_id, birth_date, vehicle_type, address, availability_days, start_time, end_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          birth_date,
          vehicle_type,
          address,
          availability_days ? availability_days.join(',') : null,
          start_time,
          end_time
        ]
      );

      const driverId = result.insertId;

      // Asignar rol de repartidor
      await connection.execute(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [user_id, 3] // 3 = repartidor
      );

      await connection.commit();

      res.status(201).json({
        message: '¡Registro como repartidor exitoso! Ya podés empezar a recibir pedidos.',
        driver_id: driverId
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error en registerDriver:', error);
      res.status(500).json({
        error: 'Error interno del servidor'
      });
    } finally {
      connection.release();
    }
  },

  // Obtener perfil de repartidor
  getDriverProfile: async (req, res) => {
    try {
      const { user_id } = req.params;

      const [driver] = await pool.execute(
        `SELECT dd.*, u.full_name, u.email, u.phone, u.profile_image_url 
         FROM delivery_drivers dd 
         JOIN users u ON dd.user_id = u.id 
         WHERE dd.user_id = ?`,
        [user_id]
      );

      if (driver.length === 0) {
        return res.status(404).json({
          error: 'Repartidor no encontrado'
        });
      }

      res.json(driver[0]);

    } catch (error) {
      console.error('Error en getDriverProfile:', error);
      res.status(500).json({
        error: 'Error interno del servidor'
      });
    }
  },

  getAvailableOrders: async (req, res) => {
    try {
      const user_id = req.user.id;
      const driver_id = await getDriverId(user_id);

      const [orders] = await pool.execute(
        `SELECT 
                o.id,
                o.total,
                o.delivery_address,
                o.status,
                o.driver_id,
                r.name as restaurant_name,
                r.address as restaurant_address,
                u.full_name as customer_name,
                u.phone as customer_phone,
                TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) as minutes_ago,
                o.estimated_delivery_time AS estimateddeliverytime
             FROM orders o
             JOIN restaurants r ON o.restaurant_id = r.id
             JOIN users u ON o.user_id = u.id
             WHERE o.status = 'confirmed' 
             AND o.driver_id IS NULL
             AND o.order_type = 'delivery'
             AND o.id NOT IN (
                 SELECT order_id FROM order_rejections WHERE driver_id = ?
             )
             ORDER BY o.created_at ASC`,
        [driver_id]  // Excluir pedidos que este repartidor ya rechazó
      );

      console.log('📦 Pedidos disponibles (excluyendo rechazados):', orders.length);
      res.json({ orders });
    } catch (error) {
      console.error('Error en getAvailableOrders:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  acceptOrder: async (req, res) => {
    console.log("🟡 Entró a acceptOrder");
    console.log("req.body:", req.body);
    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const { order_id } = req.body;
      const user_id = req.user.id;

      console.log('🔄 Aceptando pedido:', { order_id, user_id });

      // 1. Verificar que el usuario está registrado como repartidor
      const driver_id = await getDriverId(user_id, connection);
      if (!driver_id) {
        await connection.rollback();
        return res.status(400).json({
          error: 'No estás registrado como repartidor. Completa tu registro primero.'
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
      console.log('⚠️ Valores antes del UPDATE:', { driver_id, order_id });

      // 3. Actualizar el pedido usando el driver_id correcto
      const [updateResult] = await connection.execute(

        `UPDATE orders 
         SET driver_id = ?, 
             status = 'preparing',
             updated_at = NOW() 
         WHERE id = ?`,
        [driver_id, order_id]
      );

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'No se pudo actualizar el pedido'
        });
      }

      await connection.commit();

      console.log('✅ Pedido aceptado correctamente:', { order_id, driver_id });

      res.json({
        success: true,
        message: 'Pedido aceptado correctamente',
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

      console.error('❌ Error en acceptOrder:', error);
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

  // En deliveryController.js - función rejectOrder mejorada
  // En deliveryController.js - función rejectOrder original con validación
  rejectOrder: async (req, res) => {
    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // ✅ Obtener order_id de req.body
      const { order_id } = req.body;
      const user_id = req.user.id;

      // ✅ Validar que order_id sea un número
      if (!order_id || isNaN(parseInt(order_id))) {
        await connection.rollback();
        console.log('❌ order_id inválido recibido en body:', req.body);
        return res.status(400).json({
          error: 'ID de pedido inválido o no proporcionado'
        });
      }

      // Convertir a número entero para usarlo en la DB
      const orderIdInt = parseInt(order_id);

      console.log('🚫 Rechazando pedido:', { order_id: orderIdInt, user_id });

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
        [orderIdInt] // <--- Usar el número entero
      );

      if (orders.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'El pedido no está disponible o ya fue aceptado'
        });
      }

      // 3. 👇 REGISTRAR EL RECHAZO EN UNA NUEVA TABLA
      // La creación de la tabla debería hacerse en la inicialización de la DB, no en cada llamada
      // await connection.execute(...); // <--- Comenta esta línea

      // Insertar el rechazo
      await connection.execute(
        `INSERT INTO order_rejections (order_id, driver_id) VALUES (?, ?)`,
        [orderIdInt, driver_id] // <--- Usar el número entero
      );

      await connection.commit();

      console.log('✅ Pedido rechazado y registrado:', orderIdInt);

      res.json({
        success: true,
        message: 'Pedido rechazado correctamente',
        order_id: orderIdInt // <--- Devuelve un número
      });

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('❌ Error en rejectOrder:', error);
      res.status(500).json({
        error: 'Error interno del servidor: ' + error.message
      });
    } finally {
      if (connection) connection.release();
    }
  },

  getActiveOrders: async (req, res) => {
    try {
      const user_id = req.user.id;

      // Obtener el driver_id del usuario
      const driver_id = await getDriverId(user_id);
      if (!driver_id) {
        return res.status(400).json({
          error: 'No estás registrado como repartidor'
        });
      }

      console.log('🔄 Obteniendo pedidos activos para driver:', driver_id);

      const [orders] = await pool.execute(
        `SELECT 
          o.id,
          o.total,
          o.delivery_address,
          r.name as restaurant_name,
          r.address as restaurant_address,
          u.full_name as customer_name,
          u.phone as customer_phone,
          o.status,
          o.pickup_time,
          o.delivered_time,
          o.estimated_delivery_time AS estimateddeliverytime
         FROM orders o
         JOIN restaurants r ON o.restaurant_id = r.id
         JOIN users u ON o.user_id = u.id
         WHERE o.driver_id = ? 
         AND o.status IN ('preparing', 'ready', 'delivering')
         ORDER BY o.created_at DESC`,
        [driver_id]
      );

      console.log('✅ Pedidos activos encontrados:', orders.length);

      res.json({ orders });
    } catch (error) {
      console.error('❌ Error en getActiveOrders:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  markAsPickedUp: async (req, res) => {
    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const { order_id } = req.body;
      const user_id = req.user.id;

      // Obtener el driver_id del usuario
      const driver_id = await getDriverId(user_id, connection);
      if (!driver_id) {
        await connection.rollback();
        return res.status(400).json({
          error: 'No estás registrado como repartidor'
        });
      }

      // Verificar que el pedido pertenezca al repartidor
      const [orders] = await connection.execute(
        `SELECT id FROM orders 
         WHERE id = ? AND driver_id = ?`,
        [order_id, driver_id]
      );

      if (orders.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      await connection.execute(
        `UPDATE orders SET 
         status = 'delivering',
         pickup_time = NOW(),
         updated_at = NOW() 
         WHERE id = ?`,
        [order_id]
      );

      await connection.commit();

      res.json({
        message: 'Pedido marcado como retirado',
        order_id
      });

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error en markAsPickedUp:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      if (connection) connection.release();
    }
  },

  markAsDelivered: async (req, res) => {
    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const { order_id } = req.body;
      const user_id = req.user.id;

      // Obtener el driver_id del usuario
      const driver_id = await getDriverId(user_id, connection);
      if (!driver_id) {
        await connection.rollback();
        return res.status(400).json({
          error: 'No estás registrado como repartidor'
        });
      }

      // Verificar que el pedido pertenezca al repartidor
      const [orders] = await connection.execute(
        `SELECT id FROM orders 
         WHERE id = ? AND driver_id = ?`,
        [order_id, driver_id]
      );

      if (orders.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      await connection.execute(
        `UPDATE orders SET 
         status = 'completed',
         delivered_time = NOW(),
         updated_at = NOW() 
         WHERE id = ?`,
        [order_id]
      );

      await connection.commit();

      res.json({
        message: 'Pedido marcado como entregado',
        order_id
      });

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error en markAsDelivered:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      if (connection) connection.release();
    }
  },

  // Obtener historial de pedidos del repartidor
  // Obtener historial de pedidos del repartidor
  getOrderHistory: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { page: pageStr = '1', limit: limitStr = '10' } = req.query; // Obtener como strings

      // ✅ Validar y convertir page y limit a números enteros
      const page = parseInt(pageStr, 10);
      const limit = parseInt(limitStr, 10);

      if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
        return res.status(400).json({ error: 'Parámetros page y limit inválidos' });
      }

      const offset = (page - 1) * limit;

      // Obtener el driver_id del usuario
      const driver_id = await getDriverId(user_id);
      if (!driver_id) {
        return res.status(400).json({
          error: 'No estás registrado como repartidor'
        });
      }

      // CONSULTA PRINCIPAL - Ahora con valores garantizados como números
      const [orders] = await pool.execute(
        `SELECT 
          o.id,
          o.total,
          o.delivery_address,
          r.name as restaurant_name,
          u.full_name as customer_name,
          o.delivered_time,
          o.created_at,
          COUNT(oi.id) as items_count
         FROM orders o
         JOIN restaurants r ON o.restaurant_id = r.id
         JOIN users u ON o.user_id = u.id
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.driver_id = ? 
         AND o.status = 'completed'
         GROUP BY o.id
         ORDER BY o.delivered_time DESC
         LIMIT ? OFFSET ?`, // <--- 3 placeholders
        [driver_id, limit, offset] // <--- 3 valores numéricos
      );

      // CONSULTA PARA TOTAL
      const [total] = await pool.execute(
        `SELECT COUNT(*) as total FROM orders 
         WHERE driver_id = ? AND status = 'completed'`,
        [driver_id] // <--- 1 valor
      );

      res.json({
        orders,
        pagination: {
          page: page, // <--- Enviar los valores ya parseados
          limit: limit,
          total: total[0].total
        }
      });
    } catch (error) {
      console.error('Error en getOrderHistory:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

// 👇 ASEGURATE DE QUE ESTA LÍNEA ESTÉ AL FINAL
export default deliveryController;