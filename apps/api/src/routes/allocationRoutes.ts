import { Router } from 'express';
import { 
  getAdminGroups, 
  getEventsForGroup, 
  getAllocationData, 
  commitAssignments 
} from '../controllers/allocationController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/groups', requireAuth, getAdminGroups);
router.get('/events/:groupId', requireAuth, getEventsForGroup);
router.get('/data/:eventId', requireAuth, getAllocationData);
router.post('/commit', requireAuth, commitAssignments);

export default router;
