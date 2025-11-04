import pool from '../db.js';

const deliveryController = {
  // Registrar nuevo repartidor (sin verificación)
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
  }
};

export default deliveryController;