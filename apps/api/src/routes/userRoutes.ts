import { Router } from 'express';
import { 
  getUsers, 
  createUser, 
  updateProfile, 
  getAddresses, 
  addAddress, 
  updateAddress, 
  deleteAddress,
  setDefaultAddress
} from '../controllers/userController';
import { requireAuth } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.get('/', getUsers);
router.post('/', createUser);

// Profile & Address management
router.put('/profile', requireAuth, upload.single('profilePicture'), updateProfile);
router.get('/addresses', requireAuth, getAddresses);
router.post('/addresses', requireAuth, addAddress);
router.put('/addresses/:id', requireAuth, updateAddress);
router.put('/addresses/:id/default', requireAuth, setDefaultAddress);
router.delete('/addresses/:id', requireAuth, deleteAddress);

export default router;
