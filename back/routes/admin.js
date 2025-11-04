// /routes/admin.js
import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import authorizeRole from '../middleware/role.js';

const router = express.Router();

// 👇 UTILIZAMOS LOS EXISTENTES PERO CON ACCESO DE ADMIN

// === USUARIOS ===
router.get('/usuarios', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { role } = req.query;

    if (role === 'repartidor') {
      const [repartidores] = await pool.query(`
        SELECT u.id, u.username, u.email, u.full_name, u.phone, u.profile_image_url
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        INNER JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'repartidor'
        ORDER BY u.full_name
      `);
      return res.json({ usuarios: repartidores });
    }

    const [usuarios] = await pool.query(`
      SELECT 
        u.id, u.username, u.email, u.full_name, u.phone, u.profile_image_url,
        GROUP_CONCAT(r.name) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    const usuariosConRoles = usuarios.map(u => ({
      ...u,
      roles: u.roles ? u.roles.split(',') : []
    }));

    res.json({ usuarios: usuariosConRoles });
  } catch (err) {
    console.error('Error al listar usuarios:', err);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

router.delete('/usuarios/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    // Verificar que no sea el último admin
    const [userRoles] = await pool.query(
      `SELECT r.name FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [userId]
    );
    const isAdmin = userRoles.some(r => r.name === 'admin');

    if (isAdmin) {
      const [adminCount] = await pool.query(
        `SELECT COUNT(*) AS total FROM user_roles ur
         INNER JOIN roles r ON ur.role_id = r.id
         WHERE r.name = 'admin'`
      );
      if (adminCount[0].total <= 1) {
        return res.status(400).json({ error: 'No se puede eliminar al último administrador' });
      }
    }

    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// === PRODUCTOS ===
// Reutilizamos la lógica de /api/products, pero sin filtrar por is_available
router.get('/productos', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT 
        p.*,
        c.name AS category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      ORDER BY p.display_order ASC, p.created_at DESC
    `);

    const formatted = products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: parseFloat(p.base_price),
      image_url: p.image_url,
      category: p.category_name,
      is_available: p.is_available === 1,
      is_combo: p.is_combo === 1
    }));

    res.json({ products: formatted });
  } catch (err) {
    console.error('Error al listar productos:', err);
    res.status(500).json({ error: 'Error al listar productos' });
  }
});

router.delete('/productos/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// === RESTAURANTES ===
// Ya tienes CRUD completo en /api/restaurants con authorizeRole('admin')
// Solo exponemos listado completo (incluyendo cerrados)
router.get('/restaurantes', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [restaurants] = await pool.query(`
      SELECT id, name, address, latitude, longitude, phone, is_open,
             opening_time, closing_time, created_at
      FROM restaurants
      ORDER BY name ASC
    `);
    res.json({ restaurants });
  } catch (err) {
    console.error('Error al listar restaurantes:', err);
    res.status(500).json({ error: 'Error al listar restaurantes' });
  }
});

// Eliminación ya está en /api/restaurants/:id (con admin), pero la repetimos aquí para consistencia
router.delete('/restaurantes/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM restaurants WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }
    res.json({ message: 'Restaurante eliminado' });
  } catch (err) {
    console.error('Error al eliminar restaurante:', err);
    res.status(500).json({ error: 'Error al eliminar restaurante' });
  }
});

// === CUPONES ===
// Ya tienes GET /api/coupons (solo admin) → lo reutilizamos
// Pero lo volvemos a exponer en /admin para consistencia
router.get('/cupones', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [coupons] = await pool.execute(`
      SELECT id, title, description, discount_type, discount_value,
             min_purchase, max_discount, image_url, start_date, end_date,
             is_active, usage_limit, used_count, created_at
      FROM coupons
      ORDER BY created_at DESC
    `);
    res.json({ coupons });
  } catch (err) {
    console.error('Error al listar cupones:', err);
    res.status(500).json({ error: 'Error al listar cupones' });
  }
});

router.delete('/cupones/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }
    res.json({ message: 'Cupón eliminado' });
  } catch (err) {
    console.error('Error al eliminar cupón:', err);
    res.status(500).json({ error: 'Error al eliminar cupón' });
  }
});

// === FLYERS ===
router.get('/flyers', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [flyers] = await pool.query(`
      SELECT id, title, description, image_url, link_url, display_order,
             start_date, end_date, is_active, created_at
      FROM flyers
      ORDER BY display_order ASC
    `);
    res.json({
      flyers: flyers.map(f => ({
        id: f.id,
        title: f.title,
        description: f.description,
        image: f.image_url,
        link: f.link_url,
        display_order: f.display_order,
        start_date: f.start_date,
        end_date: f.end_date,
        is_active: f.is_active === 1
      }))
    });
  } catch (err) {
    console.error('Error al listar flyers:', err);
    res.status(500).json({ error: 'Error al listar flyers' });
  }
});

router.delete('/flyers/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM flyers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Flyer no encontrado' });
    }
    res.json({ message: 'Flyer eliminado' });
  } catch (err) {
    console.error('Error al eliminar flyer:', err);
    res.status(500).json({ error: 'Error al eliminar flyer' });
  }
});

export default router;