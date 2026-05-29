import express from 'express';
import { getDailyStockOutReport, getDailyStockStatusReport } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/stockout', protect, getDailyStockOutReport);
router.get('/status', protect, getDailyStockStatusReport);

export default router;
