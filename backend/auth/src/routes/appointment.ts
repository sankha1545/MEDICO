// File: backend/src/routes/appointment.ts

import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment';
import Doctor from '../models/Doctor';
import Notification from '../models/Notification';
import razorpayInstance from '../utils/razorpayClient';
import { authenticateJWT } from './auth';
import { generatePrescriptionPdf } from '../utils/generatePrescriptionPdf';
import { sendPrescriptionEmail, sendNotificationEmail } from '../utils/email';

const router = express.Router();

/**
 * GET /api/appointments/slots/:doctorId
 * — Return each future availability slot plus how many seats remain. **/


router.get('/slots/:doctorId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const now = new Date();

    // Normalize slots: support both Date strings or objects with { datetime, quantity }
    const normalized = doctor.availabilitySlots.map((slot: any) => {
      if (slot && typeof slot === 'object' && slot.datetime) {
        return {
          datetime: slot.datetime,
          quantity: slot.quantity,
        };
      } else {
        return {
          datetime: slot,
          quantity: undefined,
        };
      }
    });

    const slotsData = await Promise.all(
      normalized
        .filter((s) => new Date(s.datetime) > now)                // only future slots
        .map(async (s) => {
          const slotDate = new Date(s.datetime);
          const bookedCount = await Appointment.countDocuments({
            doctor: doctorId,
            datetime: slotDate,
            status: { $ne: 'cancelled' },
          });

          // capacity from quantity override or doctor's maxPatients
          const capacity = s.quantity ?? doctor.maxPatients ?? 1;
          const remaining = Math.max(0, capacity - bookedCount);

          return {
            slot: slotDate.toISOString(),
            remaining,
            total: capacity,
          };
        })
    );

    // Debug logging
    console.log('Doctor availabilitySlots:', doctor.availabilitySlots);
    console.log('Computed slotsData:', slotsData);

    // Filter out fully booked slots
    const filteredSlots = slotsData.filter((s) => s.remaining > 0);
    console.log('Slots to return:', filteredSlots);

    return res.json(filteredSlots);
  } catch (error) {
    console.error('Error fetching slots:', error);
    return res.status(500).json({ message: 'Failed to fetch slots' });
  }
});


/**
 * POST /api/appointments/confirm-after-payment
 * — Verify Razorpay signature, re‐check capacity atomically, and mark appointment as scheduled.
 */
router.post(
  '/confirm-after-payment',
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
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

      if (
        !appointmentId ||
        !razorpay_payment_id ||
        !razorpay_order_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Verify webhook signature
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      if (expected !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid signature' });
      }

      // Load the appointment record
      const appt = await Appointment.findById(appointmentId);
      if (!appt) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      if (appt.patient.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized for this appointment' });
      }

      // Load doctor's slot definitions
      const doc = await Doctor.findById(
        appt.doctor,
        'availabilitySlots maxPatients'
      ).lean();
      if (!doc) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      // Find the matching slot definition
      const slotDef = doc.availabilitySlots.find(
        (s) => new Date(s.datetime).getTime() === appt.datetime.getTime()
      );
      const capacity = slotDef?.quantity ?? doc.maxPatients;

      // Count current bookings
      const existing = await Appointment.countDocuments({
        doctor: appt.doctor,
        datetime: appt.datetime,
        status: { $ne: 'cancelled' },
      });
      if (existing >= capacity) {
        return res.status(409).json({ message: 'Sorry, this slot has just filled up.' });
      }

      // All good: mark scheduled & paid
      appt.status = 'scheduled';
      appt.paymentStatus = 'paid';
      appt.razorpayOrderId = razorpay_order_id;
      appt.razorpayPaymentId = razorpay_payment_id;
      await appt.save();

      // Notify patient
      try {
        const slotStr = appt.datetime.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        await Notification.create({
          userId: appt.patient,
          type: 'payment_confirmed',
          message: `Your appointment on ${slotStr} has been confirmed.`,
          read: false,
          createdAt: new Date(),
        });
      } catch (notifErr) {
        console.error('Notification error:', notifErr);
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
 * — Patient’s own appointments
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if ((req as any).role !== 'patient') {
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
 * — Doctor’s upcoming appointments
 */
router.get('/doctor', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if ((req as any).role !== 'doctor') {
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
      status: a.status === 'scheduled' ? 'upcoming' : a.status,
    }));
    return res.json(result);
  } catch (err) {
    console.error('Error fetching doctor appointments:', err);
    return res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

/**
 * GET /api/appointments/:id
 * — Doctor views single appointment detail
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
 * POST /api/appointments/cancel-slot
 * — Doctor cancels all appointments in a given slot (hour window)
 */
router.post(
  '/cancel-slot',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const role = (req as any).role;
      const { slotLabel } = req.body as { slotLabel: string };

      if (role !== 'doctor') {
        return res.status(403).json({ message: 'Only doctors can cancel slots' });
      }
      if (!slotLabel || typeof slotLabel !== 'string') {
        return res
          .status(400)
          .json({ message: 'slotLabel is required and must be a string' });
      }

      const slotDate = new Date(slotLabel);
      if (isNaN(slotDate.getTime())) {
        return res
          .status(400)
          .json({ message: 'Invalid slotLabel format. Must be ISO 8601 string.' });
      }

      const start = new Date(slotDate);
      const end = new Date(slotDate);
      end.setMinutes(end.getMinutes() + 59);

      const appts = await Appointment.find({
        doctor: user._id,
        datetime: { $gte: start, $lte: end },
        status: { $ne: 'cancelled' },
      }).populate('patient', 'email');

      let cancelledCount = 0;
      let refundedCount = 0;
      const errors: string[] = [];

      for (const appt of appts) {
        try {
          appt.status = 'cancelled';
          if (appt.razorpayPaymentId) {
            appt.paymentStatus = 'refunded';
          }
          await appt.save();
          cancelledCount++;

          if (appt.razorpayPaymentId) {
            try {
              await razorpayInstance.payments.refund(appt.razorpayPaymentId, {
                amount: Math.round((appt.amount || 0) * 100),
              });
              refundedCount++;
            } catch (refundErr) {
              console.error(`Refund failed for ${appt._id}:`, refundErr);
              errors.push(`Refund failed for ${appt._id}: ${refundErr.message}`);
            }
          }

          const slotStr = slotDate.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short',
          });
          const notifMsg = appt.razorpayPaymentId
            ? `Your appointment on ${slotStr} has been cancelled and refunded.`
            : `Your appointment on ${slotStr} has been cancelled.`;

          await Notification.create({
            userId: appt.patient,
            type: 'appointment_cancelled',
            message: notifMsg,
            read: false,
            createdAt: new Date(),
          });

          const email = (appt.patient as any)?.email;
          if (email) {
            try {
              await sendNotificationEmail(email, 'Appointment Cancelled', notifMsg);
            } catch (emailErr) {
              console.error(`Email failed for ${appt._id}:`, emailErr);
              errors.push(`Email failed for ${appt._id}: ${emailErr.message}`);
            }
          } else {
            errors.push(`No email found for patient ${appt.patient}`);
          }
        } catch (err: any) {
          console.error(`Error processing appointment ${appt._id}:`, err);
          errors.push(`${appt._id}: ${err.message}`);
        }
      }

      return res.status(200).json({
        message: `Cancelled ${cancelledCount} appointments, ${refundedCount} refunded.`,
        cancelledCount,
        refundedCount,
        errors,
      });
    } catch (err: any) {
      console.error('Error in /cancel-slot:', err);
      return res
        .status(500)
        .json({ message: 'Internal server error while cancelling slot' });
    }
  }
);

/**
 * POST /api/appointments/:id/cancel
 * — Doctor cancels a single appointment
 */
router.post(
  '/:id/cancel',
  authenticateJWT,
  async (req: Request, res: Response) => {
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

      if (appt.status !== 'cancelled') {
        appt.status = 'cancelled';
        if (appt.razorpayPaymentId) {
          appt.paymentStatus = 'refunded';
        }
        await appt.save();

        let refundId: string | null = null;
        if (appt.razorpayPaymentId) {
          try {
            const refund = await razorpayInstance.payments.refund(
              appt.razorpayPaymentId,
              { amount: Math.round((appt.amount || 0) * 100) }
            );
            refundId = refund.id;
          } catch (refundErr) {
            console.error('Razorpay refund failed:', refundErr);
          }
        }

        const slotStr = appt.datetime.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        const msg = refundId
          ? `Your appointment on ${slotStr} has been cancelled and refunded.`
          : `Your appointment on ${slotStr} has been cancelled. Refund pending.`;

        await Notification.create({
          userId: appt.patient,
          type: 'appointment_cancelled',
          message: msg,
          read: false,
          createdAt: new Date(),
        });

        return res.json({ message: 'Appointment cancelled', refundId });
      } else {
        const slotStr = appt.datetime.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        await Notification.create({
          userId: appt.patient,
          type: 'appointment_already_cancelled',
          message: `Your appointment on ${slotStr} was already cancelled.`,
          read: false,
          createdAt: new Date(),
        });
        return res.json({ message: 'Appointment was already cancelled' });
      }
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      return res.status(500).json({ message: 'Failed to cancel appointment' });
    }
  }
);

/**
 * POST /api/appointments/:id/prescription
 * — Doctor issues a prescription PDF, emails it, and notifies patient.
 */
router.post(
  '/:id/prescription',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const role = (req as any).role;
      if (role !== 'doctor') {
        return res.status(403).json({ message: 'Only doctors can issue prescriptions' });
      }

      const appt = await Appointment.findById(id).populate('patient', 'name email');
      if (!appt) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      if (appt.doctor.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized for this appointment' });
      }

      const prescriptionItems = req.body.prescriptionItems;
      if (!Array.isArray(prescriptionItems) || prescriptionItems.length === 0) {
        return res
          .status(400)
          .json({ message: 'prescriptionItems must be a non‑empty array' });
      }

      const pdfBuffer = await generatePrescriptionPdf({
        clinicName: 'MedicoX Clinic',
        clinicLogoPath: path.join(__dirname, '../../public/assets/medicox-logo.png'),
        doctorName: user.name,
        doctorSpecialty: user.specialty || '',
        patientName: (appt.patient as any).name,
        appointmentDate: appt.datetime.toISOString().split('T')[0],
        issueDate: new Date(),
        prescriptionItems,
      });
      if (!Buffer.isBuffer(pdfBuffer)) {
        throw new Error('Failed to generate valid PDF buffer');
      }

      const dir = path.join(__dirname, '../../public/prescriptions');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filename = `prescription_${id}_${Date.now()}.pdf`;
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, pdfBuffer);
      const fileUrl = `/prescriptions/${filename}`;

      // Email PDF to patient
      try {
        await sendPrescriptionEmail((appt.patient as any).email, user.name, pdfBuffer);
      } catch (emailErr) {
        console.error('Error sending prescription email:', emailErr);
      }

      // Create notification
      await Notification.create({
        userId: appt.patient,
        type: 'prescription',
        message: `Dr. ${user.name} issued your prescription.`,
        fileUrl,
        read: false,
        createdAt: new Date(),
      });

      return res.json({ message: 'Prescription issued', fileUrl });
    } catch (err: any) {
      console.error('Error issuing prescription:', err);
      return res.status(500).json({ message: 'Failed to issue prescription' });
    }
  }
);

/**
 * PUT /api/appointments/clean-slots/:doctorId
 * — Mark past slots inactive by toggling `isSlotActive` flag.
 */
router.put(
  '/clean-slots/:doctorId',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { doctorId } = req.params;
      const now = new Date();

      const result = await Appointment.updateMany(
        {
          doctor: doctorId,
          datetime: { $lt: now },
          isSlotActive: true,
        },
        { $set: { isSlotActive: false } }
      );

      return res
        .status(200)
        .json({ message: `${result.modifiedCount} expired slots cleaned.` });
    } catch (err) {
      console.error('Error cleaning slots:', err);
      return res.status(500).json({ message: 'Failed to clean expired slots' });
    }
  }
);

export default router;
