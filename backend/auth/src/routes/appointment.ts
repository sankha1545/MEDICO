// File: backend/src/routes/appointment.ts

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import Appointment from '../models/Appointment';
import Notification from '../models/Notification';
import razorpayInstance from '../utils/razorpayClient';
import { authenticateJWT } from './auth';
import { generatePrescriptionPdf } from '../utils/generatePrescriptionPdf';
import { sendPrescriptionEmail } from '../utils/email';

const router = express.Router();

interface PrescriptionInput {
  medicineName: string;
  timesPerDay: number;
  intervalDays: number;
  durationDays: number;
  beginDate: string;
  endDate: string;
}

/**
 * POST /api/appointments/confirm-after-payment
 * Verify Razorpay signature and mark appointment as scheduled/paid.
 */
router.post(
  '/confirm-after-payment',
  authenticateJWT,
  async (req: Request, res: Response) => {
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

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid signature' });
      }

      const appt = await Appointment.findById(appointmentId);
      if (!appt) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      if (appt.patient.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized for this appointment' });
      }

      appt.status = 'scheduled';
      appt.paymentStatus = 'paid';
      appt.razorpayOrderId = razorpay_order_id;
      appt.razorpayPaymentId = razorpay_payment_id;
      await appt.save();

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
        console.error('Failed notification:', notifErr);
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
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

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
 * Cancel an appointment, refund if paid, and notify patient.
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
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (appt.doctor.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    if (appt.status !== 'cancelled') {
      appt.status = 'cancelled';
      if (appt.razorpayPaymentId) appt.paymentStatus = 'refunded';
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

      const slot = appt.datetime.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      const msg = refundId
        ? `Your appointment on ${slot} has been cancelled and refunded.`
        : `Your appointment on ${slot} has been cancelled. Refund pending.`;
      await Notification.create({
        userId: appt.patient,
        type: 'appointment_cancelled',
        message: msg,
        read: false,
        createdAt: new Date(),
      });

      return res.json({ message: 'Appointment cancelled', refundId });
    }

    // already cancelled
    const slot = appt.datetime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    await Notification.create({
      userId: appt.patient,
      type: 'appointment_already_cancelled',
      message: `Your appointment on ${slot} was already cancelled.`,
      read: false,
      createdAt: new Date(),
    });
    return res.json({ message: 'Appointment was already cancelled' });
  } catch (err: any) {
    console.error('Error cancelling appointment:', err);
    return res.status(500).json({ message: 'Failed to cancel appointment' });
  }
});

/**
 * POST /api/appointments/:id/prescription
 * Generate prescription PDF, email it, save to disk, and notify patient.
 */
router.post('/:id/prescription', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const role = (req as any).role;

    if (role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can issue prescriptions' });
    }

    const appt = await Appointment.findById(id).populate('patient', 'name email');
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (appt.doctor.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this appointment' });
    }

    const prescriptionItems: PrescriptionInput[] = req.body.prescriptionItems;
    console.log('📦 Incoming prescriptionItems:', prescriptionItems);
    if (!Array.isArray(prescriptionItems) || prescriptionItems.length === 0) {
      return res.status(400).json({ message: 'prescriptionItems must be a non‑empty array' });
    }

    // Generate PDF
    const pdfBuffer = await generatePrescriptionPdf({
      clinicName: 'MedicoX Clinic',
      clinicLogoPath: path.join(__dirname, '../../public/assets/medicox-logo.png'),
      doctorName: user.name,
      doctorSpecialty: user.specialty || '',
      patientName: (appt.patient as any).name,
      appointmentDate: appt.datetime.toISOString().split('T')[0],
      issueDate: new Date(),
      prescriptionItems
    });
    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error('Failed to generate valid PDF buffer');
    }

    // Save PDF
    const dir = path.join(__dirname, '../../public/prescriptions');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `prescription_${id}_${Date.now()}.pdf`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, pdfBuffer);
    const fileUrl = `/prescriptions/${filename}`;
    console.log(`💾 PDF saved at ${filePath}`);

    // Email prescription
    try {
      console.log(`📧 Sending prescription to ${(appt.patient as any).email}`);
      await sendPrescriptionEmail((appt.patient as any).email, user.name, pdfBuffer);
      console.log('✅ Prescription email sent');
    } catch (emailErr) {
      console.error('❌ Error sending prescription email:', emailErr);
      // continue, still notify in-app
    }

    // In-app notification
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
    console.error('❌ Error issuing prescription:', err);
    return res.status(500).json({ message: 'Failed to issue prescription' });
  }
});
// File: backend/src/routes/appointment.ts (part)

router.post(
  '/cancel-slot',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const role = (req as any).role;

      // Validate input
      const { slotLabel } = req.body as { slotLabel: string };

      if (role !== 'doctor') {
        return res.status(403).json({ message: 'Only doctors can cancel slots' });
      }

      if (!slotLabel || typeof slotLabel !== 'string') {
        return res.status(400).json({ message: 'slotLabel is required and must be a string' });
      }

      // Convert slotLabel to Date object (must be in ISO format)
      const slotDate = new Date(slotLabel);
      if (isNaN(slotDate.getTime())) {
        return res.status(400).json({ message: 'Invalid slotLabel format. Must be ISO 8601 string.' });
      }

      // Ensure exact match by using UTC time for comparison
      const start = new Date(slotDate);
      const end = new Date(slotDate);
      end.setMinutes(end.getMinutes() + 59); // allow 1-hour slot range if needed

      // Find all non-cancelled appointments for this doctor at this slot
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
          // Cancel appointment
          appt.status = 'cancelled';
          if (appt.razorpayPaymentId) {
            appt.paymentStatus = 'refunded';
          }
          await appt.save();
          cancelledCount++;

          // Attempt refund
          if (appt.razorpayPaymentId) {
            try {
              await razorpayInstance.payments.refund(appt.razorpayPaymentId, {
                amount: Math.round((appt.amount || 0) * 100),
              });
              refundedCount++;
            } catch (refundErr) {
              console.error(`❌ Refund failed for appointment ${appt._id}:`, refundErr);
              errors.push(`Refund failed for ${appt._id}: ${refundErr.message}`);
            }
          }

          // Construct user-friendly slot string
          const slotStr = slotDate.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short',
          });

          const notifMsg = appt.razorpayPaymentId
            ? `Your appointment on ${slotStr} has been cancelled and refunded.`
            : `Your appointment on ${slotStr} has been cancelled.`;

          // In-app notification
          await Notification.create({
            userId: appt.patient,
            type: 'appointment_cancelled',
            message: notifMsg,
            read: false,
            createdAt: new Date(),
          });

          // Email notification (fallback-safe)
          const email = (appt.patient as any)?.email;
          if (email) {
            try {
              await sendNotificationEmail(email, 'Appointment Cancelled', notifMsg);
            } catch (emailErr) {
              console.error(`❌ Email failed for ${appt._id}:`, emailErr);
              errors.push(`Email failed for ${appt._id}: ${emailErr.message}`);
            }
          } else {
            errors.push(`No email found for patient ${appt.patient}`);
          }
        } catch (err: any) {
          console.error(`❌ Error processing appointment ${appt._id}:`, err);
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
      console.error('❌ Error in /cancel-slot route:', err);
      return res.status(500).json({ message: 'Internal server error while cancelling slot' });
    }
  }
);


export default router;
