import db from '../config/database.js';

const deliveryController = {
  // Obtener pedidos disponibles para repartidores
  getAvailableOrders: async (req, res) => {
    try {
      const { latitude, longitude } = req.query;
      
      const [orders] = await db.execute(
        `SELECT 
          o.id,
          o.total,
          o.delivery_address,
          o.delivery_latitude,
          o.delivery_longitude,
          r.name as restaurant_name,
          r.address as restaurant_address,
          r.latitude as restaurant_latitude,
          r.longitude as restaurant_longitude,
          u.full_name as customer_name,
          u.phone as customer_phone,
          TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) as minutes_ago,
          o.estimated_delivery_time,
          o.delivery_distance
         FROM orders o
         JOIN restaurants r ON o.restaurant_id = r.id
         JOIN users u ON o.user_id = u.id
         WHERE o.status = 'confirmed' 
         AND o.driver_id IS NULL
         AND o.order_type = 'delivery'
         ORDER BY o.created_at ASC`
      );

      // Calcular distancias si se proporcionan coordenadas
      if (latitude && longitude) {
        const ordersWithDistance = orders.map(order => {
          let distanceToRestaurant = null;
          if (order.restaurant_latitude && order.restaurant_longitude) {
            distanceToRestaurant = calculateDistance(
              parseFloat(latitude),
              parseFloat(longitude),
              parseFloat(order.restaurant_latitude),
              parseFloat(order.restaurant_longitude)
            );
          }
          
          return {
            ...order,
            distance_to_restaurant: distanceToRestaurant
          };
        });
        
        // Ordenar por distancia más cercana
        ordersWithDistance.sort((a, b) => (a.distance_to_restaurant || 999) - (b.distance_to_restaurant || 999));
        
        return res.json({ orders: ordersWithDistance });
      }

      res.json({ orders });
    } catch (error) {
      console.error('Error en getAvailableOrders:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Aceptar un pedido
  acceptOrder: async (req, res) => {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const { order_id } = req.body;
      const driver_id = req.user.id;

      // Verificar que el pedido esté disponible
      const [orders] = await connection.execute(
        `SELECT id, status, driver_id FROM orders 
         WHERE id = ? AND status = 'confirmed' AND driver_id IS NULL`,
        [order_id]
      );

      if (orders.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'El pedido no está disponible' });
      }

      // Asignar pedido al repartidor
      await connection.execute(
        `UPDATE orders SET 
         driver_id = ?, 
         status = 'preparing',
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [driver_id, order_id]
      );

      // Registrar en el tracking
      await connection.execute(
        `INSERT INTO order_tracking (order_id, driver_id, status) 
         VALUES (?, ?, 'assigned')`,
        [order_id, driver_id]
      );

      await connection.commit();

      res.json({ 
        message: 'Pedido aceptado correctamente',
        order_id 
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error en acceptOrder:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      connection.release();
    }
  },

  // Obtener pedidos activos del repartidor
  getActiveOrders: async (req, res) => {
    try {
      const driver_id = req.user.id;

      const [orders] = await db.execute(
        `SELECT 
          o.id,
          o.total,
          o.delivery_address,
          o.delivery_latitude,
          o.delivery_longitude,
          r.name as restaurant_name,
          r.address as restaurant_address,
          r.latitude as restaurant_latitude,
          r.longitude as restaurant_longitude,
          u.full_name as customer_name,
          u.phone as customer_phone,
          o.status,
          o.pickup_time,
          o.delivered_time,
          o.estimated_delivery_time,
          ot.status as tracking_status
         FROM orders o
         JOIN restaurants r ON o.restaurant_id = r.id
         JOIN users u ON o.user_id = u.id
         LEFT JOIN order_tracking ot ON o.id = ot.order_id AND ot.id = (
           SELECT id FROM order_tracking 
           WHERE order_id = o.id 
           ORDER BY created_at DESC LIMIT 1
         )
         WHERE o.driver_id = ? 
         AND o.status IN ('preparing', 'ready', 'delivering')
         ORDER BY o.created_at DESC`
      );

      res.json({ orders });
    } catch (error) {
      console.error('Error en getActiveOrders:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Marcar pedido como retirado
  markAsPickedUp: async (req, res) => {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const { order_id } = req.body;
      const driver_id = req.user.id;

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

      // Actualizar pedido
      await connection.execute(
        `UPDATE orders SET 
         status = 'delivering',
         pickup_time = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [order_id]
      );

      // Registrar en tracking
      await connection.execute(
        `INSERT INTO order_tracking (order_id, driver_id, status) 
         VALUES (?, ?, 'picked_up')`,
        [order_id, driver_id]
      );

      await connection.commit();

      res.json({ 
        message: 'Pedido marcado como retirado',
        order_id 
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error en markAsPickedUp:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      connection.release();
    }
  },

  // Marcar pedido como entregado
  markAsDelivered: async (req, res) => {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const { order_id } = req.body;
      const driver_id = req.user.id;

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

      // Actualizar pedido
      await connection.execute(
        `UPDATE orders SET 
         status = 'completed',
         delivered_time = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [order_id]
      );

      // Registrar en tracking
      await connection.execute(
        `INSERT INTO order_tracking (order_id, driver_id, status) 
         VALUES (?, ?, 'delivered')`,
        [order_id, driver_id]
      );

      await connection.commit();

      res.json({ 
        message: 'Pedido marcado como entregado',
        order_id 
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error en markAsDelivered:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      connection.release();
    }
  },

  // Obtener historial de pedidos del repartidor
  getOrderHistory: async (req, res) => {
    try {
      const driver_id = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const [orders] = await db.execute(
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
         LIMIT ? OFFSET ?`,
        [driver_id, parseInt(limit), offset]
      );

      const [total] = await db.execute(
        `SELECT COUNT(*) as total FROM orders 
         WHERE driver_id = ? AND status = 'completed'`,
        [driver_id]
      );

      res.json({ 
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total[0].total
        }
      });
    } catch (error) {
      console.error('Error en getOrderHistory:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

// Función auxiliar para calcular distancia (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Redondear a 2 decimales
}

export default deliveryController;