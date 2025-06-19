// File: backend/src/routes/payments.ts

import express from 'express';
import crypto from 'crypto';
import razorpay from '../utils/razorpay';
import Doctor from '../models/Doctor';
import { authenticateJWT } from './auth';

const router = express.Router();

// Rate limiter etc. omitted for brevity

// POST /api/payments/create-order
router.post(
  '/create-order',
  authenticateJWT,
  async (req, res) => {
    try {
      const user = (req as any).user;
      const role = (req as any).role;
      if (role !== 'patient') {
        return res.status(403).json({ message: 'Only patients can pay' });
      }
      const { doctorId, datetime } = req.body as { doctorId: string; datetime: string };
      if (!doctorId || !datetime) {
        return res.status(400).json({ message: 'doctorId and datetime required' });
      }
      // Validate doctorId
      const doctor = await Doctor.findById(doctorId).exec();
      if (!doctor || !doctor.isActive) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      // Validate datetime is future
      const dt = new Date(datetime);
      if (isNaN(dt.getTime()) || dt <= new Date()) {
        return res.status(400).json({ message: 'Invalid or past datetime' });
      }
      // Consultation fee
      const fee = doctor.consultationFee;
      const amountPaise = fee * 100;
      // Create Razorpay order
      const orderOptions: any = {
        amount: amountPaise,
        currency: 'INR',
        receipt: `receipt_${crypto.randomBytes(8).toString('hex')}`, // or use doctorId/datetime in notes
        notes: {
          doctorId,
          datetime,
          patientId: user._id.toString(),
        },
      };
      const order = await razorpay.orders.create(orderOptions);
      return res.json({
        orderId: order.id,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
        amount: amountPaise,
        currency: 'INR',
      });
    } catch (err: any) {
      console.error('Error in create-order:', err);
      return res.status(500).json({ message: 'Failed to create payment order' });
    }
  }
);

export default router;
