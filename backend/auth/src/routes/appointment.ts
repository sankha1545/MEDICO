// File: backend/src/routes/appointment.ts

import express, { Request, Response } from 'express';
import Appointment from '../models/Appointment';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import { authenticateJWT } from './auth';
import crypto from 'crypto';
import razorpayInstance from '../utils/razorpayClient';
import Notification from '../models/Notification';

const router = express.Router();

/**
 * POST /api/appointments/confirm-after-payment
 * Body: { appointmentId: string, razorpay_payment_id, razorpay_order_id, razorpay_signature }
 * Verifies signature, updates appointment to scheduled, paymentStatus to 'paid'.
 */
router.post('/confirm-after-payment', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = (req as any).role;
    if (role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can confirm appointment' });
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
    if (!appointmentId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
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
    // Fetch appointment
    const appt = await Appointment.findById(appointmentId);
    if (!appt) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    // Ensure this patient owns it
    if (appt.patient.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this appointment' });
    }
    // Update appointment
    appt.status = 'scheduled';
    appt.paymentStatus = 'paid';
    appt.razorpayOrderId = razorpay_order_id;
    appt.razorpayPaymentId = razorpay_payment_id;
    await appt.save();
    return res.json({ appointmentId: appt._id });
  } catch (err: any) {
    console.error('Error in confirm-after-payment:', err);
    return res.status(500).json({ message: 'Failed to confirm appointment' });
  }
});

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
    // Map to desired shape
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
      // assume type field if exists; otherwise omit
      type: (a as any).type || undefined,
    }));
    return res.json(result);
  } catch (err) {
    console.error('Error fetching patient appointments:', err);
    return res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

/**
 * GET /api/appointments/doctor
 * Fetch appointments for the authenticated doctor.
 * Returns array of { id, patientName, date: ISO string, status }.
 * Requires role 'doctor'.
 * This is used by the doctor dashboard.
 */
router.get('/doctor', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = (req as any).role;
    if (role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can view their appointments' });
    }
    const appts = await Appointment.find({ doctor: user._id })
      .populate('patient', 'name')
      .sort({ datetime: -1 })
      .lean();
    const result = appts.map((a) => ({
      id: a._id.toString(),
      patientName: (a.patient as any).name,
      date: a.datetime.toISOString(),
      status: a.status === 'scheduled' ? 'upcoming'
             : a.status === 'completed' ? 'completed'
             : a.status, // e.g., 'pending' or 'cancelled'
    }));
    return res.json(result);
  } catch (err) {
    console.error('Error fetching doctor appointments:', err);
    return res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

export default router;
