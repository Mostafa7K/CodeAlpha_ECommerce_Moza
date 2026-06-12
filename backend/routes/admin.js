import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';
import upload from '../middleware/upload.js';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  getAdminStats
} from '../controllers/adminController.js';

const router = Router();

router.use(requireAuth, isAdmin);

router.post('/products', upload.single('image'), createProduct);
router.put('/products/:id', upload.single('image'), updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getAllOrders);
router.get('/stats', getAdminStats);

export default router;
