import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { getDashboardStats } from '../controllers/adminController';

const router = express.Router();

router.get('/stats', requireAuth, requireAdmin, getDashboardStats);

export default router;
