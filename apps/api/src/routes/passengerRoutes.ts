import express from 'express';
import { requireAuth } from '../middleware/auth';
import { getDashboard, confirmAllocation, declineAllocation } from '../controllers/passengerController';

const router = express.Router();

router.use(requireAuth);

router.get('/dashboard', getDashboard);
router.patch('/confirm', confirmAllocation);
router.post('/decline', declineAllocation); // POST or DELETE with body. Usually DELETE shouldn't have body. Using POST for action.

export default router;
