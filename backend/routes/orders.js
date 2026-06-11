import { Router } from 'express';
import { createOrder, getOrderStats } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/stats', getOrderStats);
router.post('/', requireAuth, createOrder);

export default router;
