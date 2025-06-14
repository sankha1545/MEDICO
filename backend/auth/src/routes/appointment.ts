// File: backend/src/routes/appointment.ts

import express, { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import Appointment from '../models/Appointment';
import Patient, { IPatient } from '../models/Patient';
import Doctor, { IDoctor } from '../models/Doctor';
import { authenticateJWT } from './auth';
import sendMail from '../utils/email';
import sendSmsViaEmail from '../utils/sendSmsViaEmail';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router: Router = express.Router();

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Helper to format date-time
function formatAppointmentDate(dt: Date): string {
  // e.g., "14:30, 25 Jun 2025"
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour12: false,
    timeZone: 'UTC',
  };
  return new Intl.DateTimeFormat('en-GB', options).format(dt) + ' UTC';
}

/**
 * POST /api/appointments/order
 * Body: { doctorId: string, datetime: string, message: string }
 * Creates a Razorpay order and a pending Appointment document.
 * Returns { key: string, orderId: string, amount: number, currency: string, appointmentId: string }
 */
router.post('/order', authenticateJWT, async (req: Request, res: Response) => {
  const user = (req as any).user as IPatient;
  const { doctorId, datetime, message } = req.body as {
    doctorId: string;
    datetime: string; // ISO string
    message?: string;
  };

  if (!Types.ObjectId.isValid(doctorId) || !datetime) {
    return res.status(400).json({ message: 'Invalid data: doctorId and datetime required' });
  }
  const apptDate = new Date(datetime);
  if (isNaN(apptDate.getTime()) || apptDate <= new Date()) {
    return res.status(400).json({ message: 'Invalid appointment datetime' });
  }

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Determine amount: use doctor's consultationFee (in rupees)
    const amountINR = doctor.consultationFee;
    if (typeof amountINR !== 'number' || amountINR <= 0) {
      return res.status(400).json({ message: 'Invalid consultation fee configured' });
    }

    // Create Razorpay order: amount in paise
    const orderOptions = {
      amount: amountINR * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${user._id.toString()}`,
      payment_capture: 1, // auto-capture
    };
    const order = await razorpayInstance.orders.create(orderOptions);

    // Create pending appointment in DB
    const appointment = new Appointment({
      patient: user._id,
      doctor: doctor._id,
      datetime: apptDate,
      status: 'pending',
      message: message || '',
      amount: amountINR,
      currency: 'INR',
      paymentStatus: 'pending',
      razorpayOrderId: order.id,
    });
    await appointment.save();

    return res.status(201).json({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount, // in paise
      currency: order.currency,
      appointmentId: appointment._id,
    });
  } catch (err) {
    console.error('Error creating order:', err);
    return res.status(500).json({ message: 'Failed to create payment order' });
  }
});

/**
 * POST /api/appointments/verify
 * Body: { appointmentId: string, razorpay_payment_id: string, razorpay_order_id: string, razorpay_signature: string }
 * Verify signature, update appointment to paid/scheduled, send notifications.
 */
router.post('/verify', authenticateJWT, async (req: Request, res: Response) => {
  const user = (req as any).user as IPatient;
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

  if (!Types.ObjectId.isValid(appointmentId) || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Invalid payment verification data' });
  }

  try {
    // Find the pending appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.paymentStatus !== 'pending' || appointment.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: 'Appointment not in pending state or order mismatch' });
    }

    // Verify signature: expected = sha256(order_id + "|" + payment_id) using key_secret
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      // mark failed
      appointment.paymentStatus = 'failed';
      await appointment.save();
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Payment is valid
    appointment.paymentStatus = 'paid';
    appointment.razorpayPaymentId = razorpay_payment_id;
    appointment.status = 'scheduled';
    await appointment.save();

    // Send notifications
    // 1. Notify patient: can skip because frontend shows confirmation, but can email
    const doctor = await Doctor.findById(appointment.doctor);
    if (!doctor) {
      console.warn('Doctor not found for appointment after payment');
    }
    // Format appointment date-time
    const apptTimeStr = formatAppointmentDate(appointment.datetime);
    // Patient email
    if (user.email) {
      const subject = 'Booking Confirmed';
      const text = `Your appointment with Dr. ${doctor?.name} has been confirmed at ${apptTimeStr}.`;
      try {
        await sendMail({ to: user.email, subject, text });
      } catch (e) {
        console.error('Failed to send confirmation email to patient:', e);
      }
    }
    // Doctor notification: assuming doctor has email field
    if (doctor && doctor.email) {
      const subjectDoc = 'New Appointment Booked';
      const textDoc = `Patient ${user.name} (email: ${user.email}) has booked an appointment at ${apptTimeStr}.`;
      try {
        await sendMail({ to: doctor.email, subject: subjectDoc, text: textDoc });
      } catch (e) {
        console.error('Failed to send notification email to doctor:', e);
      }
    }

    return res.json({
      message: 'Payment verified and appointment scheduled',
      appointment: {
        id: appointment._id,
        datetime: appointment.datetime,
        status: appointment.status,
      },
    });
  } catch (err) {
    console.error('Error in payment verification:', err);
    return res.status(500).json({ message: 'Server error in payment verification' });
  }
});

/**
 * You may keep or remove the old PUT status endpoint as needed.
 * E.g., for marking completed/cancelled after scheduling.
 * Below is an example for updating status, unchanged:
 */
router.put('/:id/status', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: string };
  if (!Types.ObjectId.isValid(id) || !status) {
    return res.status(400).json({ message: 'Invalid data' });
  }
  if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }
  try {
    const appointment = await Appointment.findById(id).populate('patient').populate('doctor');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    appointment.status = status as any;
    await appointment.save();

    // Notify patient if relevant
    const patient = appointment.patient as IPatient;
    const doctor = appointment.doctor as IDoctor;
    const apptTimeStr = formatAppointmentDate(appointment.datetime);
    const subject = `Appointment ${status}`;
    const text = `Your appointment with Dr. ${doctor.name} on ${apptTimeStr} is now ${status}.`;

    if (patient.email) {
      try {
        await sendMail({ to: patient.email, subject, text });
      } catch (e) {
        console.error('Failed to send status email to patient:', e);
      }
    }
    // ... SMS if configured
    return res.json({ appointment });
  } catch (err) {
    console.error('Error updating appointment status:', err);
    return res.status(500).json({ message: 'Failed to update status' });
  }
});

export default router;
