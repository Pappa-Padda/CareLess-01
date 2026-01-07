import express from 'express';
import { requireAuth } from '../middleware/auth';
import { getMyOffers, createLiftOffer, deleteLiftOffer, getDriverDashboard, updateLiftOfferCar } from '../controllers/liftOfferController';

const router = express.Router();

router.use(requireAuth);

router.get('/my', getMyOffers);
router.get('/dashboard', getDriverDashboard);
router.post('/', createLiftOffer);
router.put('/:id/car', updateLiftOfferCar);
router.delete('/event/:eventId', deleteLiftOffer);

export default router;
