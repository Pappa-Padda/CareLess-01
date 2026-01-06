import express from 'express';
import { requireAuth } from '../middleware/auth';
import { getMyOffers, createLiftOffer, deleteLiftOffer } from '../controllers/liftOfferController';

const router = express.Router();

router.use(requireAuth);

router.get('/my', getMyOffers);
router.post('/', createLiftOffer);
router.delete('/event/:eventId', deleteLiftOffer);

export default router;
