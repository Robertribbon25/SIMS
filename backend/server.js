import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getDbStatus } from './config/db.js';

// Load routes
import authRoutes from './routes/authRoutes.js';
import sparePartRoutes from './routes/sparePartRoutes.js';
import stockInRoutes from './routes/stockInRoutes.js';
import stockOutRoutes from './routes/stockOutRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/spareparts', sparePartRoutes);
app.use('/api/stockin', stockInRoutes);
app.use('/api/stockout', stockOutRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    db: getDbStatus(),
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect Mongoose/mock database
  await connectDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 STANDALONE SIMS Backend Server listening on port ${PORT}`);
  });
};

startServer();
