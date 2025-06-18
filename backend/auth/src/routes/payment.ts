// File: backend/src/routes/payments.ts

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import razorpay from '../utils/razorpay';
import Appointment from '../models/Appointment';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import { authenticateJWT } from './auth';
import rateLimit from 'express-rate-limit';
import sendMail from '../utils/email'; // your existing email util

const router = express.Router();

// Rate limiter for create-order
const createOrderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'Too many requests, please try again later.',
});

// POST /api/payments/create-order/:appointmentId
router.post(
  '/create-order/:appointmentId',
  authenticateJWT,
  createOrderLimiter,
  async (req: Request, res: Response) => {
    try {
      const appointmentId = req.params.appointmentId;
      const user = (req as any).user;
      const role = (req as any).role;
      // Only the patient who booked can create order
      const appt = await Appointment.findById(appointmentId).exec();
      if (!appt) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      if (role !== 'patient' || appt.patient.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (appt.status !== 'pending_payment') {
        return res.status(400).json({ message: 'Appointment not pending payment' });
      }
      // Create Razorpay order
      const amountPaise = appt.amount * 100;
      const orderOptions: any = {
        amount: amountPaise,
        currency: appt.currency || 'INR',
        receipt: appointmentId,
        notes: {
          appointmentId: appointmentId,
        },
      };
      const order = await razorpay.orders.create(orderOptions);
      // Save order_id in appointment for reference
      appt.razorpayOrderId = order.id;
      await appt.save();
      return res.json({ orderId: order.id, razorpayKey: process.env.RAZORPAY_KEY_ID });
    } catch (err: any) {
      console.error('Error in create-order:', err);
      return res.status(500).json({ message: 'Failed to create payment order' });
    }
  }
);

// Webhook endpoint: Razorpay will POST here
// Express needs raw body to verify signature; in your index.ts use:
// app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentsRouter);
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  const signature = req.headers['x-razorpay-signature'] as string;
  const body = req.body as Buffer;

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.warn('Invalid Razorpay webhook signature');
    return res.status(400).send('Invalid signature');
  }

  const event = JSON.parse(body.toString());
  // Handle payment events
  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    try {
      // Find appointment by orderId
      const appt = await Appointment.findOne({ razorpayOrderId: orderId }).exec();
      if (!appt) {
        console.warn('Appointment not found for order:', orderId);
        return res.status(200).send('ok');
      }
      // Update appointment status
      appt.paymentStatus = 'paid';
      appt.razorpayPaymentId = payment.id;
      appt.status = 'scheduled'; // or 'confirmed'
      await appt.save();

      // Trigger payout to doctor account
      const doctor = await Doctor.findById(appt.doctor).exec();
      const patient = await Patient.findById(appt.patient).exec();
      if (doctor && doctor.razorpayAccountId) {
        // Create payout
        // Note: You need to have beneficiary setup and approved in Razorpay Dashboard for Payouts.
        // For demonstration, we create a transfer from your platform to doctor's fund account.
        // Be careful: ensure your account is enabled for payouts in production.
        try {
          await razorpay.payouts.create({
            account: process.env.RAZORPAY_PAYOUT_ACCOUNT_ID!, // your platform account
            fund_account: doctor.razorpayAccountId,
            amount: appt.amount * 100,
            currency: appt.currency,
            mode: 'IMPS',
            purpose: 'payout',
            queue_if_low_balance: true,
            reference_id: `payout_${appt._id}`,
            narration: `Payout for appointment ${appt._id}`,
          });
        } catch (payoutErr) {
          console.error('Payout creation failed:', payoutErr);
          // You may retry later via scheduler
        }
      }

      // Send email notifications
      try {
        // to patient
        if (patient && patient.email) {
          await sendMail({
            to: patient.email,
            subject: 'Appointment Confirmed',
            text: `Your appointment with Dr. has been confirmed for ${new Date(appt.datetime).toLocaleString()}.`,
          });
        }
        // to doctor
        if (doctor && doctor.email) {
          await sendMail({
            to: doctor.email,
            subject: 'New Appointment Booked',
            text: `A new appointment has been booked by ${patient?.name} for ${new Date(appt.datetime).toLocaleString()}.`,
          });
        }
      } catch (emailErr) {
        console.error('Error sending email notifications:', emailErr);
      }
      return res.status(200).send('ok');
    } catch (err) {
      console.error('Error handling payment.captured webhook:', err);
      return res.status(500).send('error');
    }
  } else if (event.event === 'payment.failed') {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    try {
      const appt = await Appointment.findOne({ razorpayOrderId: orderId }).exec();
      if (!appt) {
        return res.status(200).send('ok');
      }
      appt.paymentStatus = 'failed';
      appt.status = 'failed';
      await appt.save();
      // Notify patient about failure
      const patient = await Patient.findById(appt.patient).exec();
      if (patient && patient.email) {
        await sendMail({
          to: patient.email,
          subject: 'Payment Failed for Appointment',
          text: `Your payment for appointment ${appt._id} failed. Please retry at ${process.env.FRONTEND_URL}/payment/${appt._id}.`,
        });
      }
      return res.status(200).send('ok');
    } catch (err) {
      console.error('Error handling payment.failed webhook:', err);
      return res.status(500).send('error');
    }
  } else {
    // Other events - ignore
    return res.status(200).send('ignored');
  }
});

export default router;
