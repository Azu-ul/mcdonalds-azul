import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import homeRoutes from './routes/home.js';
import profileRoutes from './routes/profile.js';
import flyersRoutes from './routes/flyers.js';
import couponsRoutes from './routes/coupons.js';
import restaurantsRoutes from './routes/restaurants.js';
import addressesRoutes from './routes/addresses.js';
import categoriesRoutes from './routes/categories.js';
import cartRoutes from './routes/cart.js';

import './config/passport.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/flyers', flyersRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/user', addressesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/cart', cartRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/geocode', async (req, res) => {
  const { latitude, longitude } = req.query;
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'TuApp/1.0' }
  });
  const data = await response.json();
  res.json(data);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`✅ API corriendo en http://localhost:${PORT}`);
  console.log(`📁 Uploads dir: ${path.join(__dirname, 'uploads')}`);
});