import { Router } from 'express';
import { getGroups, createGroup, joinGroup, leaveGroup, getGroupMembers, updateGroup, toggleGroupAdmin } from '../controllers/groupController';
import { requireAuth } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.use(requireAuth);

router.get('/', getGroups);
router.post('/', upload.single('profilePicture'), createGroup);
router.put('/:id', upload.single('profilePicture'), updateGroup);
router.post('/join', joinGroup);
router.post('/leave', leaveGroup);
router.get('/:id/members', getGroupMembers);
router.put('/:id/members/:userId', toggleGroupAdmin);

export default router;
