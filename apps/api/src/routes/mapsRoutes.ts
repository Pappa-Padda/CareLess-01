import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { calculateRoute } from '../controllers/mapsController';
import { requireAuth } from '../middleware/auth';
import { MAPS_RATE_LIMIT_WINDOW_MS, MAPS_RATE_LIMIT_MAX_REQUESTS } from '../config/constants';

const router = Router();

// Rate limiting for maps endpoints to prevent abuse
const limiter = rateLimit({
  windowMs: MAPS_RATE_LIMIT_WINDOW_MS,
  max: MAPS_RATE_LIMIT_MAX_REQUESTS
});


router.post('/routes', requireAuth, limiter, calculateRoute);

export default router;
