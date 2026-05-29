import express from 'express';
import { createStockIn, getStockIn } from '../controllers/stockInController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, createStockIn)
  .get(protect, getStockIn);

export default router;
