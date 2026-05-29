import express from 'express';
import {
  createStockOut,
  getStockOut,
  updateStockOut,
  deleteStockOut,
} from '../controllers/stockOutController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, createStockOut)
  .get(protect, getStockOut);

router.route('/:id')
  .put(protect, updateStockOut)
  .delete(protect, deleteStockOut);

export default router;
