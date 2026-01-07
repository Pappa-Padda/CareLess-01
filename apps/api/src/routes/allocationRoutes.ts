import { Router } from 'express';
import { 
  getAdminGroups, 
  getEventsForGroup, 
  getAllocationData, 
  commitAssignments,
  clearAllocations
} from '../controllers/allocationController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/groups', requireAuth, getAdminGroups);
router.get('/events/:groupId', requireAuth, getEventsForGroup);
router.get('/data/:eventId', requireAuth, getAllocationData);
router.post('/commit', requireAuth, commitAssignments);
router.delete('/clear/:eventId', requireAuth, clearAllocations);

export default router;
