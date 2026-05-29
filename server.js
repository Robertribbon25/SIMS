import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

// Load configurations
dotenv.config();
dotenv.config({ path: './backend/.env' });

// Load backend files directly from their locations
import { connectDB, getDbStatus } from './backend/config/db.js';
import authRoutes from './backend/routes/authRoutes.js';
import sparePartRoutes from './backend/routes/sparePartRoutes.js';
import stockInRoutes from './backend/routes/stockInRoutes.js';
import stockOutRoutes from './backend/routes/stockOutRoutes.js';
import reportRoutes from './backend/routes/reportRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000; // AI Studio active ingress port

app.use(cors());
app.use(express.json());

// API Middlewares
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

const startServer = async () => {
  // Connect Mongoose / Fallback database
  await connectDB();

  // Auto-seed for rapid testing in AI Studio
  try {
    const User = (await import('./backend/models/User.js')).default;
    const SparePart = (await import('./backend/models/SparePart.js')).default;
    const StockIn = (await import('./backend/models/StockIn.js')).default;
    const usersLength = (await User.find()).length;

    if (usersLength === 0) {
      console.log('📝 Seeding empty database for active preview convenience...');
      const bcrypt = (await import('bcryptjs')).default;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin123@', salt);

      await User.create({
        username: 'System Admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
      });

      const parts = [
        {
          name: 'Spark Plug Bosch X5',
          category: 'Engine Parts',
          quantity: 120,
          unitPrice: 4500,
        },
        {
          name: 'Oil Filter Sakura',
          category: 'Filters',
          quantity: 85,
          unitPrice: 3200,
        },
        {
          name: 'Front Brake Pads Toyota',
          category: 'Braking System',
          quantity: 50,
          unitPrice: 12500,
        },
        {
          name: 'AC Belts Mitsuboshi',
          category: 'Belts & Chains',
          quantity: 95,
          unitPrice: 1800,
        },
      ];

      const createdParts = await SparePart.insertMany(parts);
      for (const p of createdParts) {
        await StockIn.create({
          sparePart: p._id,
          stockInQuantity: p.quantity,
          stockInDate: new Date(),
        });
      }
      console.log('✅ Database seeded. Login credentials: admin@gmail.com / Admin123@');
    }
  } catch (err) {
    console.warn('⚠️ Database autoseed error:', err.message);
  }

  if (process.env.NODE_ENV !== 'production') {
    // Integrate Vite as development middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.join(__dirname, 'frontend'),
    });
    app.use(vite.middlewares);
    console.log(`📡 Dev Server loading Vite middleware from "/frontend" context...`);
  } else {
    // Serve build from frontend/dist
    const distPath = path.join(__dirname, 'frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`📡 Production Server serving static bundle from ${distPath}...`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Integrated SIMS Server running at http://localhost:${PORT}`);
  });
};

startServer();
