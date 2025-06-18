import express, { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import Appointment from '../models/Appointment';
import Patient, { IPatient } from '../models/Patient';
import Doctor, { IDoctor } from '../models/Doctor';
import { authenticateJWT } from './auth';
import sendMail from '../utils/email';
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
 * Body: { doctorId: string, datetime: string, message?: string }
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

    // Check availabilitySlots if set
    if (Array.isArray(doctor.availabilitySlots) && doctor.availabilitySlots.length > 0) {
      const match = doctor.availabilitySlots.some(slotDate => slotDate.toISOString() === apptDate.toISOString());
      if (!match) {
        return res.status(400).json({ message: 'Requested datetime not in doctor availability slots' });
      }
    }
    // Prevent double-booking
    const conflict = await Appointment.findOne({
      doctor: doctor._id,
      datetime: apptDate,
      status: { $in: ['scheduled', 'pending'] },
    }).exec();
    if (conflict) {
      return res.status(400).json({ message: 'This timeslot is already booked' });
    }

    // Determine amount
    const amountINR = doctor.consultationFee;
    if (typeof amountINR !== 'number' || amountINR <= 0) {
      return res.status(400).json({ message: 'Invalid consultation fee configured' });
    }

    // Create Razorpay order
    const orderOptions = {
      amount: amountINR * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${user._id.toString()}`,
      payment_capture: 1,
    };
    const order = await razorpayInstance.orders.create(orderOptions);

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
      amount: order.amount,
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

  if (
    !Types.ObjectId.isValid(appointmentId) ||
    !razorpay_payment_id ||
    !razorpay_order_id ||
    !razorpay_signature
  ) {
    return res.status(400).json({ message: 'Invalid payment verification data' });
  }

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.patient.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: not your appointment' });
    }
    if (
      appointment.paymentStatus !== 'pending' ||
      appointment.razorpayOrderId !== razorpay_order_id
    ) {
      return res
        .status(400)
        .json({ message: 'Appointment not in pending state or order mismatch' });
    }

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      appointment.paymentStatus = 'failed';
      await appointment.save();
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    appointment.paymentStatus = 'paid';
    appointment.razorpayPaymentId = razorpay_payment_id;
    appointment.status = 'scheduled';
    await appointment.save();

    const doctor = await Doctor.findById(appointment.doctor);
    const apptTimeStr = formatAppointmentDate(appointment.datetime);

    if (user.email) {
      const subject = 'Booking Confirmed';
      const text = `Your appointment with Dr. ${doctor?.name} has been confirmed at ${apptTimeStr}.`;
      try {
        await sendMail({ to: user.email, subject, text });
      } catch (e) {
        console.error('Failed to send confirmation email to patient:', e);
      }
    }
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
 * PUT /api/appointments/:id/status
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

    return res.json({ appointment });
  } catch (err) {
    console.error('Error updating appointment status:', err);
    return res.status(500).json({ message: 'Failed to update status' });
  }
});

export default router;
