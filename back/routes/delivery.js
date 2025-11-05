import express from 'express';
import deliveryController from '../controllers/deliveryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.get('/orders/available', authenticateToken, deliveryController.getAvailableOrders);
router.post('/orders/accept', authenticateToken, deliveryController.acceptOrder);
router.post('/orders/reject', authenticateToken, deliveryController.rejectOrder); // 👈 LÍNEA 11
router.get('/orders/active', authenticateToken, deliveryController.getActiveOrders);
router.post('/orders/pickup', authenticateToken, deliveryController.markAsPickedUp);
router.post('/orders/deliver', authenticateToken, deliveryController.markAsDelivered);
router.get('/orders/history', authenticateToken, deliveryController.getOrderHistory);

export default router;