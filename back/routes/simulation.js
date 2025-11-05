import express from 'express';
import simulationController from '../controllers/simulationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Solo permitir simulación en desarrollo
const isDevelopment = process.env.NODE_ENV === 'development';

// Middleware para verificar desarrollo
const developmentOnly = (req, res, next) => {
  if (!isDevelopment) {
    return res.status(403).json({ error: 'Simulación solo disponible en desarrollo' });
  }
  next();
};

// Aplicar el middleware a todas las rutas
router.use(developmentOnly);
router.use(authenticateToken);

// Rutas de simulación
router.post('/orders/generate', simulationController.generateSimulatedOrder);
router.post('/orders/generate-multiple', simulationController.generateMultipleOrders);
router.post('/orders/simulate-ready', simulationController.simulateOrderReady); // 👈 ESTA ES LA LÍNEA 31 - VERIFICA QUE simulationController.simulateOrderReady EXISTA
router.delete('/orders/cleanup', simulationController.cleanupSimulatedOrders);


// Agrega esto temporalmente en simulation.js para debuggear
console.log('simulationController:', simulationController);
console.log('simulateOrderReady exists:', typeof simulationController.simulateOrderReady);

export default router;