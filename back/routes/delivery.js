import express from 'express';
import deliveryController from '../controllers/deliveryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rutas existentes...
router.post('/register', authenticateToken, deliveryController.registerDriver);
router.get('/profile/:user_id', authenticateToken, deliveryController.getDriverProfile);

// Nuevas rutas para pedidos
router.get('/orders/available', authenticateToken, deliveryController.getAvailableOrders);
router.post('/orders/accept', authenticateToken, deliveryController.acceptOrder);
router.get('/orders/active', authenticateToken, deliveryController.getActiveOrders);
router.post('/orders/pickup', authenticateToken, deliveryController.markAsPickedUp);
router.post('/orders/deliver', authenticateToken, deliveryController.markAsDelivered);
router.get('/orders/history', authenticateToken, deliveryController.getOrderHistory);

export default router;