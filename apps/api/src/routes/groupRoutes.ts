import { Router } from 'express';
import { getGroups, createGroup, joinGroup, leaveGroup } from '../controllers/groupController';
import { requireAuth } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.use(requireAuth);

router.get('/', getGroups);
router.post('/', upload.single('profilePicture'), createGroup);
router.post('/join', joinGroup);
router.post('/leave', leaveGroup);

export default router;
