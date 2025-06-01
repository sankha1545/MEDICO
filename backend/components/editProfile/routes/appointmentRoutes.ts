import express from 'express';
import { getAppointment, saveAppointment } from '../controllers/appointmentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();
router.get('/', protect, getAppointment);
router.post('/', protect, saveAppointment);

export default router;
