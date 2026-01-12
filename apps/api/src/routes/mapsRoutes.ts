import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { calculateRoute } from '../controllers/mapsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Rate limiting for maps endpoints to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.post('/routes', requireAuth, limiter, calculateRoute);

export default router;
