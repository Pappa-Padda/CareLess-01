import { Router } from 'express';
import { signin, signout, signup, me } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/signin', signin);
router.post('/signup', signup);
router.post('/signout', signout);
router.get('/me', requireAuth, me);

export default router;
