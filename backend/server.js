import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import multer from 'multer';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5500';

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'moza-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler — clean JSON for any unknown API route instead of an HTML trace.
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Requested API endpoint not found.' });
});

// Global, catch-all error handler. The full stack is logged server-side only;
// the client always receives a generic message so no internal details, file
// paths, or database credentials can leak in the response.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err && err.message === 'Only image files are allowed.') {
    return res.status(400).json({ success: false, message: err.message });
  }

  console.error('Internal Server Error:', err?.stack || err);
  res.status(500).json({ success: false, message: 'An unexpected database or server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`Server running securely on port ${PORT}`);
});
