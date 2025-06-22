// File: backend/src/routes/Webhook.ts

import { Request, Response } from 'express';
import crypto from 'crypto';
import Notification from '../models/Notification';
import Appointment from '../models/Appointment';
import { Payment } from '../models/Payment';
import Wallet from '../models/wallet';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export default async function razorpayWebhookHandler(req: Request, res: Response) {
  try {
    const sig = req.headers['x-razorpay-signature'] as string;
    const bodyBuffer = req.body as Buffer;
    const bodyString = bodyBuffer.toString('utf8');
    const generatedSig = crypto.createHmac('sha256', webhookSecret).update(bodyString).digest('hex');
    if (generatedSig !== sig) {
      console.warn('Invalid Razorpay webhook signature');
      return res.status(400).send('Invalid signature');
    }
    const event = JSON.parse(bodyString);
    const eventType = event.event;
    const payload = event.payload;

    if (eventType === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const razorpayPaymentId: string = paymentEntity.id;
      const amountPaise: number = paymentEntity.amount;
      const notes = paymentEntity.notes || {};
      const appointmentId = notes.appointmentId;
      const patientId = notes.patientId;
      const doctorId = notes.doctorId;

      // Update Payment record
      const amountRupees = amountPaise / 100;
      let paymentDoc = await Payment.findOne({ orderId: paymentEntity.order_id });
      if (!paymentDoc) {
        paymentDoc = new Payment({
          orderId: paymentEntity.order_id,
          paymentId: razorpayPaymentId,
          appointmentId,
          patientId,
          doctorId,
          amount: amountRupees,
          currency: paymentEntity.currency,
          status: 'captured',
          rawPayload: event,
        });
      } else {
        paymentDoc.paymentId = razorpayPaymentId;
        paymentDoc.status = 'captured';
        paymentDoc.rawPayload = event;
      }
      await paymentDoc.save();

      // Update Appointment status to a valid enum, e.g., 'scheduled'
      const appt = await Appointment.findById(appointmentId);
      if (appt) {
        appt.status = 'scheduled'; 
        appt.razorpayOrderId = paymentEntity.order_id;
        appt.razorpayPaymentId = razorpayPaymentId;
        appt.paymentStatus = 'paid';
        await appt.save();
      }

      // Credit doctor wallet
      let wallet = await Wallet.findOne({ doctorId });
      if (!wallet) {
        wallet = new Wallet({ doctorId, balance: 0, transactions: [] });
      }
      wallet.balance += amountRupees;
      wallet.transactions.push({
        amount: amountRupees,
        type: 'credit',
        timestamp: new Date(),
        metadata: { paymentId: razorpayPaymentId, appointmentId },
      });
      await wallet.save();

      // Create notifications:
      const doctor = await Doctor.findById(doctorId);
      const patient = await Patient.findById(patientId);
      const apptDate = appt?.datetime; 
      const formattedDate = apptDate
        ? new Date(apptDate).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : '';

      if (doctor) {
        const msg = `You received ₹${amountRupees} for appointment with ${patient?.name || 'patient'} on ${formattedDate}.`;
        await new Notification({
          userId: doctor._id,
          type: 'payment_received',
          message: msg,
          read: false,
          createdAt: new Date(),
        }).save();
      }
      if (patient) {
        const msgPt = `Your payment of ₹${amountRupees} for appointment with Dr. ${doctor?.name || 'doctor'} on ${formattedDate} was successful.`;
        await new Notification({
          userId: patient._id,
          type: 'payment_success',
          message: msgPt,
          read: false,
          createdAt: new Date(),
        }).save();
      }
    } else {
      console.log(`Unhandled Razorpay webhook event: ${eventType}`);
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Error in Razorpay webhook handler:', err);
    res.status(500).send('Server error');
  }
}
