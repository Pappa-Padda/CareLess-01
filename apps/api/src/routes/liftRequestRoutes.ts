import express from 'express';
import { requireAuth } from '../middleware/auth';
import { getMyRequests, createLiftRequest, deleteLiftRequest } from '../controllers/liftRequestController';

const router = express.Router();

router.use(requireAuth);

router.get('/my', getMyRequests);
router.post('/', createLiftRequest);
router.delete('/event/:eventId', deleteLiftRequest);

export default router;
