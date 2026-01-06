import express from 'express';
import { requireAuth } from '../middleware/auth';
import { getCars, createCar, updateCar, deleteCar } from '../controllers/carController';

const router = express.Router();

router.use(requireAuth); // All car routes require authentication

router.get('/', getCars);
router.post('/', createCar);
router.put('/:id', updateCar);
router.delete('/:id', deleteCar);

export default router;
