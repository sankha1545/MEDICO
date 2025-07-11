// File: backend/src/routes/appointment.ts

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import Appointment from '../models/Appointment';
import Notification from '../models/Notification';
import razorpayInstance from '../utils/razorpayClient';
import { authenticateJWT } from './auth';

const router = express.Router();

/**
 * POST /api/appointments/confirm-after-payment
 * Verifies Razorpay signature and confirms the appointment payment.
 */
router.post(
  '/confirm-after-payment',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const role = (req as any).role;
      if (role !== 'patient') {
        return res
          .status(403)
          .json({ message: 'Only patients can confirm appointment' });
      }

      const {
        appointmentId,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      } = req.body as {
        appointmentId: string;
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      };

      if (
        !appointmentId ||
        !razorpay_payment_id ||
        !razorpay_order_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid signature' });
      }

      const appt = await Appointment.findById(appointmentId);
      if (!appt) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      if (appt.patient.toString() !== user._id.toString()) {
        return res
          .status(403)
          .json({ message: 'Not authorized for this appointment' });
      }

      appt.status = 'scheduled';
      appt.paymentStatus = 'paid';
      appt.razorpayOrderId = razorpay_order_id;
      appt.razorpayPaymentId = razorpay_payment_id;
      await appt.save();

      // Notify patient of successful booking
      try {
        const slot = appt.datetime.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        await Notification.create({
          userId: appt.patient,
          type: 'payment_confirmed',
          message: `Your payment for the appointment on ${slot} has been received and confirmed.`,
          read: false,
          createdAt: new Date(),
        });
      } catch (notifErr) {
        console.error('Failed to notify patient of payment confirmation:', notifErr);
      }

      return res.json({ appointmentId: appt._id });
    } catch (err: any) {
      console.error('Error in confirm-after-payment:', err);
      return res.status(500).json({ message: 'Failed to confirm appointment' });
    }
  }
);

/**
 * GET /api/appointments
 * Fetch appointments for the authenticated patient.
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = (req as any).role;
    if (role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can view their appointments' });
    }

    const appts = await Appointment.find({ patient: user._id })
      .populate('doctor', 'name specialty profileImageUrl')
      .sort({ datetime: -1 })
      .lean();

    const result = appts.map((a) => ({
      _id: a._id.toString(),
      doctor: {
        _id: (a.doctor as any)._id.toString(),
        name: (a.doctor as any).name,
        specialty: (a.doctor as any).specialty,
        profileImageUrl: (a.doctor as any).profileImageUrl,
      },
      datetime: a.datetime.toISOString(),
      status: a.status,
    }));
    return res.json(result);
  } catch (err) {
    console.error('Error fetching patient appointments:', err);
    return res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

/**
 * GET /api/appointments/doctor
 * Fetch non-cancelled appointments for the authenticated doctor.
 */
router.get('/doctor', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = (req as any).role;
    if (role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can view their appointments' });
    }

    const appts = await Appointment.find({
      doctor: user._id,
      status: { $ne: 'cancelled' },
    })
      .populate('patient', 'name')
      .sort({ datetime: -1 })
      .lean();

    const result = appts.map((a) => ({
      id: a._id.toString(),
      patientName: (a.patient as any).name,
      date: a.datetime.toISOString(),
      status:
        a.status === 'scheduled'
          ? 'upcoming'
          : a.status === 'completed'
          ? 'completed'
          : a.status,
    }));

    return res.json(result);
  } catch (err) {
    console.error('Error fetching doctor appointments:', err);
    return res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

/**
 * GET /api/appointments/:id
 * Fetch appointment details by ID for doctors.
 */
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = (req as any).role;
    if (role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can access this route' });
    }

    const appointment = await Appointment.findById(id)
      .populate('patient', 'name email phone message')
      .lean();
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const p = appointment.patient as any;
    return res.json({
      _id: appointment._id.toString(),
      datetime: appointment.datetime,
      status: appointment.status,
      message: appointment.message,
      patient: {
        name: p.name,
        email: p.email,
        phone: p.phone,
        message: p.message,
      },
    });
  } catch (err) {
    console.error('Error fetching appointment by ID:', err);
    return res.status(500).json({ message: 'Failed to fetch appointment details' });
  }
});

/**
 * POST /api/appointments/:id/cancel
 * Cancels an appointment, attempts Razorpay refund, updates status,
 * and sends a notification to the patient.
 */
router.post('/:id/cancel', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const role = (req as any).role;

    if (role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can cancel appointments' });
    }

    const appt = await Appointment.findById(id);
    if (!appt) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appt.doctor.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    // If not already cancelled, mark and refund
    if (appt.status !== 'cancelled') {
      appt.status = 'cancelled';
      if (appt.razorpayPaymentId) {
        appt.paymentStatus = 'refunded';
      }
      await appt.save();

      // Attempt refund
      let refundId: string | null = null;
      if (appt.razorpayPaymentId) {
        try {
          const refund = await razorpayInstance.payments.refund(
            appt.razorpayPaymentId,
            { amount: Math.round(appt.amount * 100) }
          );
          refundId = refund.id;
        } catch (refundErr) {
          console.error('Razorpay refund failed:', refundErr);
        }
      }

      // Notify patient
      try {
        const slot = appt.datetime.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        const msg = refundId
          ? `Your appointment of ${slot} has been cancelled and the fee has been refunded to your account.`
          : `Your appointment of ${slot} has been cancelled. We will process your refund shortly.`;

        await Notification.create({
          userId: appt.patient,
          type: 'appointment_cancelled',
          message: msg,
          read: false,
          createdAt: new Date(),
        });
      } catch (notifErr) {
        console.error('Failed to create cancellation notification:', notifErr);
      }

      return res.json({ message: 'Appointment cancelled successfully', refundId });
    }

    // Already cancelled: still notify
    try {
      const slot = appt.datetime.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      await Notification.create({
        userId: appt.patient,
        type: 'appointment_already_cancelled',
        message: `Your appointment of ${slot} was already cancelled.`,
        read: false,
        createdAt: new Date(),
      });
    } catch (notifErr) {
      console.error('Failed to notify already-cancelled:', notifErr);
    }

    return res.json({ message: 'Appointment was already cancelled' });
  } catch (err: any) {
    console.error('Error cancelling appointment:', err);
    return res.status(500).json({ message: 'Failed to cancel appointment' });
  }
});

export default router;
