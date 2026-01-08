import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { 
  getDashboardStats, 
  getPickups, 
  createPickup, 
  updatePickup, 
  deletePickup 
} from '../controllers/adminController';
import { getUsers, deleteUser } from '../controllers/userController';

const router = express.Router();

router.get('/stats', requireAuth, requireAdmin, getDashboardStats);

// User Management
router.get('/users', requireAuth, requireAdmin, getUsers);
router.delete('/users/:id', requireAuth, requireAdmin, deleteUser);

// Pickup Point Management
router.get('/pickups', requireAuth, requireAdmin, getPickups);
router.post('/pickups', requireAuth, requireAdmin, createPickup);
router.put('/pickups/:id', requireAuth, requireAdmin, updatePickup);
router.delete('/pickups/:id', requireAuth, requireAdmin, deletePickup);

export default router;
