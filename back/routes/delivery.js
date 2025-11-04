import express from 'express';
import deliveryController from '../controllers/deliveryController.js';
import {authenticateToken} from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authenticateToken, deliveryController.registerDriver);
router.get('/profile/:user_id', authenticateToken, deliveryController.getDriverProfile);

export default router;