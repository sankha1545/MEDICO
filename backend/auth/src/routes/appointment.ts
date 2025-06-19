// File: backend/src/routes/appointment.ts

import express from 'express';
import Appointment from '../models/Appointment';
import Doctor from '../models/Doctor';
import { authenticateJWT } from './auth';
import crypto from 'crypto';

const router = express.Router();

// POST /api/appointments/confirm-after-payment
router.post(
  '/confirm-after-payment',
  authenticateJWT,
  async (req, res) => {
    try {
      const user = (req as any).user;
      const role = (req as any).role;
      if (role !== 'patient') {
        return res.status(403).json({ message: 'Only patients can confirm appointment' });
      }
      const {
        doctorId,
        datetime,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      } = req.body as {
        doctorId: string;
        datetime: string;
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      };
      if (!doctorId || !datetime || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      // Verify signature
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');
      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid signature' });
      }
      // Optionally verify payment captured via Razorpay API
      // e.g., const payment = await razorpay.payments.fetch(razorpay_payment_id);
      // if payment.status !== 'captured' => error
      // Validate doctor and datetime again
      const doctor = await Doctor.findById(doctorId).exec();
      if (!doctor || !doctor.isActive) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      const dt = new Date(datetime);
      if (isNaN(dt.getTime()) || dt <= new Date()) {
        return res.status(400).json({ message: 'Invalid or past datetime' });
      }
      // Create Appointment record
      const fee = doctor.consultationFee;
      const newAppt = new Appointment({
        patient: user._id,
        doctor: doctorId,
        datetime: dt,
        message: '',
        amount: fee,
        currency: 'INR',
        status: 'scheduled',
        paymentStatus: 'paid',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });
      const saved = await newAppt.save();
      return res.json({ appointmentId: saved._id });
    } catch (err: any) {
      console.error('Error in confirm-after-payment:', err);
      return res.status(500).json({ message: 'Failed to confirm appointment' });
    }
  }
);

export default router;
