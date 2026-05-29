import express from 'express';
import { createSparePart, getSpareParts } from '../controllers/sparePartController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, createSparePart)
  .get(protect, getSpareParts);

export default router;
