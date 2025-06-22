// File: backend/src/routes/payment.ts

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import razorpayInstance from '../utils/razorpayClient';
import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';
import { Payment } from '../models/Payment';
import Notification from '../models/Notification';
import Patient from '../models/Patient';
import { authenticateJWT } from './auth';

const router = express.Router();

/**
 * POST /api/payments/create-order
 * Body: { doctorId: string, datetime: string (ISO), message?: string }
 * Creates:
 *  - Appointment (status 'pending')
 *  - Razorpay order
 *  - Payment record
 *  - Notifications: 
 *      * For doctor: “New appointment request from <patientName> on <date>”
 *      * For patient: “Appointment request created for Dr. <doctorName> on <date>. Please complete payment.”
 */
router.post('/create-order', authenticateJWT, async (req: Request, res: Response) => {
  console.log('==> [create-order] body:', req.body);

  try {
    const user = (req as any).user; // patient
    const role = (req as any).role as 'patient' | 'doctor';
    if (role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can pay' });
    }

    const { doctorId, datetime, message } = req.body as {
      doctorId?: string;
      datetime?: string;
      message?: string;
    };
    if (!doctorId || !datetime) {
      return res.status(400).json({ message: 'doctorId and datetime are required' });
    }

    // Fetch doctor
    const doctor = await Doctor.findById(doctorId).exec();
    if (!doctor || !(doctor as any).isActive) {
      return res.status(404).json({ message: 'Doctor not found or inactive' });
    }

    // Validate datetime
    const dt = new Date(datetime);
    if (isNaN(dt.getTime()) || dt <= new Date()) {
      return res.status(400).json({ message: 'Invalid or past datetime' });
    }

    // Determine fee
    const fee = typeof (doctor as any).consultationFee === 'number'
      ? (doctor as any).consultationFee
      : 0;
    const amountPaise = Math.round(fee * 100);

    // Create pending Appointment: ensure schema fields match (datetime, amount required)
    const appt = new Appointment({
      doctor: doctorId,
      patient: user._id,
      datetime: dt,
      amount: fee,
      currency: 'INR',        // if your schema includes currency
      status: 'pending',      // must be a valid enum value
      message: message || '',
      // ...any other required fields
    });
    await appt.save();
    const appointmentId = appt._id.toString();
    console.log('    Created pending appointment:', appointmentId);

    // Create notifications about the new appointment request
    // 1. Patient notification
    const patientName = (user as any).name || 'You';
    const doctorName = (doctor as any).name || 'Doctor';
    const formattedDate = dt.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const notifPatientMsg = `Appointment request created for Dr. ${doctorName} on ${formattedDate}. Please complete payment.`;
    await new Notification({
      userId: user._id,
      type: 'appointment_requested',
      message: notifPatientMsg,
      read: false,
      createdAt: new Date(),
    }).save();

    // 2. Doctor notification
    const notifDoctorMsg = `New appointment request from ${patientName} on ${formattedDate}.`;
    await new Notification({
      userId: doctor._id,
      type: 'appointment_requested',
      message: notifDoctorMsg,
      read: false,
      createdAt: new Date(),
    }).save();

    // Prepare Razorpay order
    const receiptId = `receipt_${crypto.randomBytes(8).toString('hex')}`;
    const orderOptions: any = {
      amount: amountPaise,
      currency: 'INR',
      receipt: receiptId,
      payment_capture: 1,
      notes: {
        appointmentId,
        patientId: user._id.toString(),
        doctorId,
      },
    };
    console.log('    Razorpay orderOptions:', orderOptions);
    const order = await razorpayInstance.orders.create(orderOptions);
    console.log('    Razorpay order created:', order.id);

    // Persist Payment record
    const paymentDoc = new Payment({
      orderId: order.id,
      appointmentId,
      patientId: user._id,
      doctorId,
      amount: fee,
      currency: order.currency || 'INR',
      status: 'created',
      receipt: receiptId,
      rawPayload: order,
    });
    await paymentDoc.save();
    console.log('    Payment record saved:', paymentDoc._id);

    // Respond with details for frontend
    return res.json({
      appointmentId,
      orderId: order.id,
      amount: order.amount,             // in paise
      currency: order.currency || 'INR',
      keyId: process.env.RAZORPAY_KEY_ID, // frontend uses this
    });
  } catch (err: any) {
    console.error('Error in create-order:', err);
    return res.status(500).json({ message: 'Failed to create payment order' });
  }
});

export default router;
