import pool from '../db.js';

const roleController = {
  // Obtener roles de un usuario
  getUserRoles: async (req, res) => {
    try {
      const { user_id } = req.params;

      // Verificar que el usuario existe
      const [users] = await pool.execute(
        'SELECT id FROM users WHERE id = ?',
        [user_id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      // Obtener roles del usuario (usando tu misma query)
      const [roles] = await pool.execute(
        `SELECT r.name 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = ?`,
        [user_id]
      );

      const userRoles = roles.map(role => role.name);

      res.json({
        user_id: parseInt(user_id),
        roles: userRoles
      });

    } catch (error) {
      console.error('Error en getUserRoles:', error);
      res.status(500).json({
        error: 'Error interno del servidor'
      });
    }
  },

  // Obtener todos los roles disponibles (para admin)
  getAllRoles: async (req, res) => {
    try {
      const [roles] = await pool.execute(
        'SELECT id, name, description FROM roles'
      );

      res.json({
        roles
      });

    } catch (error) {
      console.error('Error en getAllRoles:', error);
      res.status(500).json({
        error: 'Error interno del servidor'
      });
    }
  }
};

export default roleController;