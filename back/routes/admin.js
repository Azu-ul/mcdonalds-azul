// /routes/admin.js
import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import authorizeRole from '../middleware/role.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// === OBTENER INGREDIENTES ===
router.get('/ingredientes', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [ingredients] = await pool.query(`
      SELECT id, name, extra_price, is_required, max_quantity
      FROM ingredients
      ORDER BY name ASC
    `);
    res.json({ ingredients });
  } catch (err) {
    console.error('Error al obtener ingredientes:', err);
    res.status(500).json({ error: 'Error al obtener ingredientes' });
  }
});

// === OBTENER CATEGORÍAS ===
router.get('/categorias', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT id, name, icon, display_order
      FROM categories
      WHERE is_active = 1
      ORDER BY display_order ASC, name ASC
    `);
    res.json({ categories });
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

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

    // Para usuarios regulares, EXCLUIR repartidores
    const [usuarios] = await pool.query(`
      SELECT 
        u.id, u.username, u.email, u.full_name, u.phone, u.profile_image_url,
        GROUP_CONCAT(r.name) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id NOT IN (
        SELECT DISTINCT u2.id
        FROM users u2
        INNER JOIN user_roles ur2 ON u2.id = ur2.user_id
        INNER JOIN roles r2 ON ur2.role_id = r2.id
        WHERE r2.name = 'repartidor'
      )
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

    // No permitir eliminarse a sí mismo
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    // Verificar que el usuario existe
    const [user] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
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

    // Usar transacción para eliminar dependencias
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Eliminar dependencias primero
      await connection.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM oauth_tokens WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM sessions WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM user_coupons WHERE user_id = ?', [userId]);

      // Finalmente eliminar el usuario
      await connection.query('DELETE FROM users WHERE id = ?', [userId]);

      await connection.commit();
      res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

router.delete('/repartidores/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // No permitir eliminarse a sí mismo
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    // Verificar que el usuario existe
    const [user] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'Repartidor no encontrado' });
    }

    // Verificar que el usuario tiene el rol de repartidor
    const [userRoles] = await pool.query(
      `SELECT r.id, r.name FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [userId]
    );

    const hasRepartidorRole = userRoles.some(r => r.name === 'repartidor');

    if (!hasRepartidorRole) {
      // Opcional: podrías permitir eliminarlo igual si tiene otros roles,
      // pero para mantener la lógica de "eliminar repartidor", lo restringimos.
      // Si solo quieres validar que sea un repartidor, esto está bien.
      return res.status(400).json({ error: 'El usuario no es un repartidor' });
    }

    // Verificar que no sea admin (por seguridad adicional, aunque en teoría un repartidor no debería ser admin)
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

    // Usar transacción para eliminar dependencias
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Eliminar dependencias específicas de repartidores (si las hay)
      // Ej: DELETE FROM delivery_assignments WHERE delivery_person_id = userId;
      // Asegúrate de eliminar cualquier relación específica de repartidor aquí.

      // Eliminar el rol de repartidor (o todos los roles si es solo repartidor y quieres eliminarlo completamente)
      // Opción 1: Eliminar solo el rol de repartidor (si puede tener otros roles)
      // await connection.query('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?', [userId, repartidorRoleId]);

      // Opción 2: Eliminar TODOS los roles (asumiendo que si se elimina desde 'repartidores', se va completamente)
      await connection.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);

      // Eliminar otros datos relacionados (oauth, sesiones, etc.)
      await connection.query('DELETE FROM oauth_tokens WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM sessions WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM user_coupons WHERE user_id = ?', [userId]);

      // Finalmente eliminar el usuario
      await connection.query('DELETE FROM users WHERE id = ?', [userId]);

      await connection.commit();
      res.json({ message: 'Repartidor eliminado exitosamente' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error al eliminar repartidor:', err);
    res.status(500).json({ error: 'Error al eliminar repartidor' });
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
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Eliminar dependencias EN EL ORDEN CORRECTO
      await connection.query('DELETE FROM product_ingredients WHERE product_id = ?', [req.params.id]);
      await connection.query('DELETE FROM product_sizes WHERE product_id = ?', [req.params.id]);

      // ✅ Eliminar de cart_items (NUEVO)
      await connection.query('DELETE FROM cart_items WHERE product_id = ?', [req.params.id]);

      // ✅ Eliminar de order_items (NUEVO)
      await connection.query('DELETE FROM order_items WHERE product_id = ?', [req.params.id]);

      // Eliminar producto
      const [result] = await connection.query('DELETE FROM products WHERE id = ?', [req.params.id]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      await connection.commit();
      res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

router.put('/usuarios/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { full_name, email, phone } = req.body;

    // Verificar que el usuario existe
    const [user] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el email no esté en uso por otro usuario
    if (email) {
      const [existingUser] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
    }

    // Actualizar usuario
    const updateFields = [];
    const updateValues = [];

    if (full_name !== undefined) {
      updateFields.push('full_name = ?');
      updateValues.push(full_name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updateValues.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await pool.query(query, updateValues);

    // Obtener usuario actualizado
    const [updatedUser] = await pool.query(`
      SELECT id, username, email, full_name, phone, profile_image_url 
      FROM users WHERE id = ?
    `, [userId]);

    res.json(updatedUser[0]);
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// === EDITAR PRODUCTO ===
router.put('/productos/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, description, price, is_available } = req.body;

    // Verificar que el producto existe
    const [product] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (product.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Actualizar producto
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (price !== undefined) {
      updateFields.push('base_price = ?');
      updateValues.push(price);
    }
    if (is_available !== undefined) {
      updateFields.push('is_available = ?');
      updateValues.push(is_available);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updateValues.push(productId);

    const query = `UPDATE products SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await pool.query(query, updateValues);

    // Obtener producto actualizado
    const [updatedProduct] = await pool.query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [productId]);

    const formatted = {
      id: updatedProduct[0].id,
      name: updatedProduct[0].name,
      description: updatedProduct[0].description,
      price: parseFloat(updatedProduct[0].base_price),
      category: updatedProduct[0].category_name,
      is_available: updatedProduct[0].is_available === 1
    };

    res.json(formatted);
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// Agregar endpoints GET individuales para edición
router.get('/usuarios/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [user] = await pool.query(`
      SELECT id, username, email, full_name, phone, profile_image_url, is_verified
      FROM users WHERE id = ?
    `, [req.params.id]);

    if (user.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user[0]);
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

router.get('/productos/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [product] = await pool.query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (product.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const formatted = {
      id: product[0].id,
      name: product[0].name,
      description: product[0].description,
      price: parseFloat(product[0].base_price),
      category: product[0].category_name,
      is_available: product[0].is_available === 1
    };

    res.json(formatted);
  } catch (err) {
    console.error('Error al obtener producto:', err);
    res.status(500).json({ error: 'Error al obtener producto' });
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
      SELECT id, title, description, discount_value, min_purchase, max_discount,
             image_url, start_date, end_date, is_active, usage_limit, used_count, created_at
      FROM coupons
      ORDER BY created_at DESC
    `);
    res.json({ coupons });
  } catch (err) {
    console.error('Error al listar cupones:', err);
    res.status(500).json({ error: 'Error al listar cupones' });
  }
});


router.get('/cupones/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [coupon] = await pool.query(`
      SELECT id, title, description, discount_value, min_purchase, max_discount,
             image_url, start_date, end_date, is_active, usage_limit, used_count, created_at
      FROM coupons
      WHERE id = ?
    `, [req.params.id]);

    if (coupon.length === 0) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    res.json(coupon[0]);
  } catch (err) {
    console.error('Error al obtener cupón:', err);
    res.status(500).json({ error: 'Error al obtener cupón' });
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

// === OBTENER RESTAURANTE INDIVIDUAL ===
router.get('/restaurantes/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [restaurant] = await pool.query(`
      SELECT id, name, address, latitude, longitude, phone, is_open,
             opening_time, closing_time, created_at
      FROM restaurants
      WHERE id = ?
    `, [req.params.id]);

    if (restaurant.length === 0) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }

    res.json(restaurant[0]);
  } catch (err) {
    console.error('Error al obtener restaurante:', err);
    res.status(500).json({ error: 'Error al obtener restaurante' });
  }
});

// === OBTENER FLYER INDIVIDUAL ===
router.get('/flyers/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const [flyer] = await pool.query(`
      SELECT id, title, description, image_url, link_url, display_order,
             start_date, end_date, is_active, created_at
      FROM flyers
      WHERE id = ?
    `, [req.params.id]);

    if (flyer.length === 0) {
      return res.status(404).json({ error: 'Flyer no encontrado' });
    }

    res.json({
      id: flyer[0].id,
      title: flyer[0].title,
      description: flyer[0].description,
      image_url: flyer[0].image_url,
      link_url: flyer[0].link_url,
      display_order: flyer[0].display_order,
      start_date: flyer[0].start_date,
      end_date: flyer[0].end_date,
      is_active: flyer[0].is_active === 1
    });
  } catch (err) {
    console.error('Error al obtener flyer:', err);
    res.status(500).json({ error: 'Error al obtener flyer' });
  }
});

// === EDITAR RESTAURANTE ===
router.put('/restaurantes/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id);
    const { name, address, phone, is_open, opening_time, closing_time, latitude, longitude } = req.body;

    // Verificar que el restaurante existe
    const [restaurant] = await pool.query('SELECT id FROM restaurants WHERE id = ?', [restaurantId]);
    if (restaurant.length === 0) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }

    // Actualizar restaurante
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (is_open !== undefined) {
      updateFields.push('is_open = ?');
      updateValues.push(is_open);
    }
    if (opening_time !== undefined) {
      updateFields.push('opening_time = ?');
      updateValues.push(opening_time);
    }
    if (closing_time !== undefined) {
      updateFields.push('closing_time = ?');
      updateValues.push(closing_time);
    }
    if (latitude !== undefined) {
      updateFields.push('latitude = ?');
      updateValues.push(latitude);
    }
    if (longitude !== undefined) {
      updateFields.push('longitude = ?');
      updateValues.push(longitude);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updateValues.push(restaurantId);

    const query = `UPDATE restaurants SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await pool.query(query, updateValues);

    // Obtener restaurante actualizado
    const [updatedRestaurant] = await pool.query(`
      SELECT id, name, address, phone, is_open, opening_time, closing_time, latitude, longitude
      FROM restaurants WHERE id = ?
    `, [restaurantId]);

    res.json(updatedRestaurant[0]);
  } catch (err) {
    console.error('Error al actualizar restaurante:', err);
    res.status(500).json({ error: 'Error al actualizar restaurante' });
  }
});

// === EDITAR CUPÓN ===
router.put('/cupones/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const couponId = parseInt(req.params.id);
    const {
      title,
      description,
      discount_value,
      min_purchase,
      max_discount,
      start_date,
      end_date,
      is_active,
      usage_limit
    } = req.body;

    const [exists] = await pool.query('SELECT id FROM coupons WHERE id = ?', [couponId]);
    if (exists.length === 0) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) { updateFields.push('title = ?'); updateValues.push(title); }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
    if (discount_value !== undefined) { updateFields.push('discount_value = ?'); updateValues.push(discount_value); }
    if (min_purchase !== undefined) { updateFields.push('min_purchase = ?'); updateValues.push(min_purchase); }
    if (max_discount !== undefined) { updateFields.push('max_discount = ?'); updateValues.push(max_discount); }
    if (start_date !== undefined) { updateFields.push('start_date = ?'); updateValues.push(start_date); }
    if (end_date !== undefined) { updateFields.push('end_date = ?'); updateValues.push(end_date); }
    if (is_active !== undefined) { updateFields.push('is_active = ?'); updateValues.push(is_active); }
    if (usage_limit !== undefined) { updateFields.push('usage_limit = ?'); updateValues.push(usage_limit); }

    updateValues.push(couponId);

    await pool.query(
      `UPDATE coupons SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    const [updatedCoupon] = await pool.query(`
      SELECT id, title, description, discount_value, min_purchase, max_discount,
             image_url, start_date, end_date, is_active, usage_limit
      FROM coupons WHERE id = ?
    `, [couponId]);

    res.json(updatedCoupon[0]);
  } catch (err) {
    console.error('Error al actualizar cupón:', err);
    res.status(500).json({ error: 'Error al actualizar cupón' });
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


// === EDITAR FLYER ===
router.put('/flyers/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const flyerId = parseInt(req.params.id);
    const {
      title, description, image_url, link_url, display_order,
      start_date, end_date, is_active
    } = req.body;

    // Verificar que el flyer existe
    const [flyer] = await pool.query('SELECT id FROM flyers WHERE id = ?', [flyerId]);
    if (flyer.length === 0) {
      return res.status(404).json({ error: 'Flyer no encontrado' });
    }

    // Actualizar flyer
    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (image_url !== undefined) {
      updateFields.push('image_url = ?');
      updateValues.push(image_url);
    }
    if (link_url !== undefined) {
      updateFields.push('link_url = ?');
      updateValues.push(link_url);
    }
    if (display_order !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(display_order);
    }
    if (start_date !== undefined) {
      updateFields.push('start_date = ?');
      updateValues.push(start_date);
    }
    if (end_date !== undefined) {
      updateFields.push('end_date = ?');
      updateValues.push(end_date);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updateValues.push(flyerId);

    const query = `UPDATE flyers SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await pool.query(query, updateValues);

    // Obtener flyer actualizado
    const [updatedFlyer] = await pool.query(`
      SELECT id, title, description, image_url, link_url, display_order,
             start_date, end_date, is_active
      FROM flyers WHERE id = ?
    `, [flyerId]);

    res.json({
      id: updatedFlyer[0].id,
      title: updatedFlyer[0].title,
      description: updatedFlyer[0].description,
      image_url: updatedFlyer[0].image_url,
      link_url: updatedFlyer[0].link_url,
      display_order: updatedFlyer[0].display_order,
      start_date: updatedFlyer[0].start_date,
      end_date: updatedFlyer[0].end_date,
      is_active: updatedFlyer[0].is_active === 1
    });
  } catch (err) {
    console.error('Error al actualizar flyer:', err);
    res.status(500).json({ error: 'Error al actualizar flyer' });
  }
});

// === CREAR USUARIO ===
// === CREAR USUARIO ===
router.post('/usuarios', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { full_name, email, phone, password, role } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Verificar que el email no exista
    const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // ✅ Hashear la contraseña
    const saltRounds = 10; // Número de rondas para el salt, 10 es un valor estándar
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // ✅ Insertar el hash en lugar de la contraseña en texto plano
      const [result] = await connection.query(
        'INSERT INTO users (full_name, email, phone, password_hash, auth_provider) VALUES (?, ?, ?, ?, ?)',
        [full_name, email, phone, hashedPassword, 'local']
      );

      const userId = result.insertId;

      // Asignar rol (por defecto cliente, o el especificado)
      const roleName = role || 'cliente';
      const [roleResult] = await connection.query('SELECT id FROM roles WHERE name = ?', [roleName]);

      if (roleResult.length > 0) {
        await connection.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [userId, roleResult[0].id]
        );
      }

      await connection.commit();

      // Devolver usuario creado (no devuelvas la contraseña ni el hash)
      const [newUser] = await pool.query(`
        SELECT id, username, email, full_name, phone, profile_image_url 
        FROM users WHERE id = ?
    `, [userId]);

      res.status(201).json(newUser[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error al crear usuario:', err); // Esto te ayudará a ver el error real en la consola del servidor
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// === CREAR PRODUCTO ===
router.post('/productos', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category_id,
      image_url,  // ✅ AGREGAR
      is_available = true,
      ingredients = []  // ✅ AGREGAR
    } = req.body;

    if (!name || !price || !category_id) {
      return res.status(400).json({ error: 'Nombre, precio y categoría son requeridos' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Crear producto
      const [result] = await connection.query(
        `INSERT INTO products 
         (name, description, category_id, base_price, image_url, is_available) 
         VALUES (?, ?, ?, ?, ?, ?)`,  // ✅ AGREGAR image_url
        [name, description, category_id, price, image_url || null, is_available]
      );

      const productId = result.insertId;

      // ✅ Guardar ingredientes si los hay
      if (ingredients && ingredients.length > 0) {
        for (const ingredientId of ingredients) {
          await connection.query(
            `INSERT INTO product_ingredients (product_id, ingredient_id, is_default, is_removable)
             VALUES (?, ?, 1, 1)`,
            [productId, ingredientId]
          );
        }
      }

      await connection.commit();

      // Obtener producto creado
      const [newProduct] = await connection.query(`
        SELECT p.*, c.name AS category_name
        FROM products p
        INNER JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `, [productId]);

      const formatted = {
        id: newProduct[0].id,
        name: newProduct[0].name,
        description: newProduct[0].description,
        price: parseFloat(newProduct[0].base_price),
        image_url: newProduct[0].image_url,  // ✅ AGREGAR
        category: newProduct[0].category_name,
        is_available: newProduct[0].is_available === 1
      };

      res.status(201).json(formatted);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// === CREAR RESTAURANTE ===
router.post('/restaurantes', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const {
      name,
      address,
      phone,
      latitude,
      longitude,
      is_open = true,
      opening_time = '08:00:00',
      closing_time = '23:00:00'
    } = req.body;

    // Validaciones
    if (!name || !address) {
      return res.status(400).json({ error: 'Nombre y dirección son requeridos' });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitud y longitud son requeridas' });
    }

    const [result] = await pool.query(
      `INSERT INTO restaurants 
       (name, address, phone, latitude, longitude, is_open, opening_time, closing_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, address, phone, latitude, longitude, is_open, opening_time, closing_time]
    );

    // Obtener restaurante creado
    const [newRestaurant] = await pool.query(`
      SELECT id, name, address, latitude, longitude, phone, is_open,
             opening_time, closing_time, created_at
      FROM restaurants WHERE id = ?
    `, [result.insertId]);

    res.status(201).json(newRestaurant[0]);
  } catch (err) {
    console.error('Error al crear restaurante:', err);
    res.status(500).json({ error: 'Error al crear restaurante' });
  }
});

// === CREAR CUPÓN ===
router.post('/cupones', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const {
      title,
      description = '',
      discount_value,
      min_purchase = 0,
      max_discount = null,
      start_date = null,
      end_date = null,
      is_active = true,
      usage_limit = null
    } = req.body;

    if (!title || !discount_value) {
      return res.status(400).json({ error: 'Título y valor de descuento son requeridos' });
    }

    const [result] = await pool.query(
      `INSERT INTO coupons 
      (title, description, discount_value, min_purchase, max_discount, start_date, end_date, is_active, usage_limit) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, description, discount_value, min_purchase, max_discount,
        start_date, end_date, is_active, usage_limit
      ]
    );

    const [newCoupon] = await pool.query(`
      SELECT id, title, description, discount_value, min_purchase, max_discount,
             image_url, start_date, end_date, is_active, usage_limit, used_count, created_at
      FROM coupons WHERE id = ?
    `, [result.insertId]);

    res.status(201).json(newCoupon[0]);
  } catch (err) {
    console.error('Error al crear cupón:', err);
    res.status(500).json({ error: 'Error al crear cupón' });
  }
});


// === CREAR FLYER ===
router.post('/flyers', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const {
      title,
      description = '',
      image_url,
      link_url = null,
      display_order = 0,
      start_date = null,
      end_date = null,
      is_active = true
    } = req.body;

    // Validaciones
    if (!title || !image_url) {
      return res.status(400).json({ error: 'Título y URL de imagen son requeridos' });
    }

    const [result] = await pool.query(
      `INSERT INTO flyers 
       (title, description, image_url, link_url, display_order, start_date, end_date, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, image_url, link_url, display_order, start_date, end_date, is_active]
    );

    // Obtener flyer creado
    const [newFlyer] = await pool.query(`
      SELECT id, title, description, image_url, link_url, display_order,
             start_date, end_date, is_active, created_at
      FROM flyers WHERE id = ?
    `, [result.insertId]);

    res.status(201).json({
      id: newFlyer[0].id,
      title: newFlyer[0].title,
      description: newFlyer[0].description,
      image_url: newFlyer[0].image_url,
      link_url: newFlyer[0].link_url,
      display_order: newFlyer[0].display_order,
      start_date: newFlyer[0].start_date,
      end_date: newFlyer[0].end_date,
      is_active: newFlyer[0].is_active === 1
    });
  } catch (err) {
    console.error('Error al crear flyer:', err);
    res.status(500).json({ error: 'Error al crear flyer' });
  }
});

export default router;