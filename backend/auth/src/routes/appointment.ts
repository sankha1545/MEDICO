// File: backend/src/routes/appointment.ts

import express, { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import Appointment from '../models/Appointment';
import Patient, { IPatient } from '../models/Patient';
import Doctor, { IDoctor } from '../models/Doctor';
import { authenticateJWT } from './auth';
import sendMail from '../utils/email';
import sendSmsViaEmail from '../utils/sendSmsViaEmail';

const router: Router = express.Router();

// Example: Create appointment
// POST /api/appointments
// Body: { doctorId: string, datetime: string, ... }
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  const user = (req as any).user as IPatient;
  const { doctorId, datetime, ...other } = req.body as {
    doctorId: string;
    datetime: string; // ISO string
    // ... other fields
  };
  if (!Types.ObjectId.isValid(doctorId) || !datetime) {
    return res.status(400).json({ message: 'Invalid data' });
  }
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    // Create appointment document (assuming schema)
    const appointment = new Appointment({
      patient: user._id,
      doctor: doctor._id,
      datetime: new Date(datetime),
      status: 'scheduled',
      // ...other fields
    });
    await appointment.save();

    // Send immediate notifications if enabled
    // 1. To patient
    const pSettings = user.notificationSettings || {};
    const appointmentTimeStr = new Date(datetime).toLocaleString('en-US', {
      timeZone: 'UTC',
      hour12: true,
    });
    if (pSettings.emailAppointments && user.email) {
      // Send email to patient
      const subject = 'Appointment Scheduled';
      const text = `Your appointment with Dr. ${doctor.name} is scheduled at ${appointmentTimeStr}.`;
      try {
        await sendMail({ to: user.email, subject, text });
      } catch (e) {
        console.error('Failed to send appointment email to patient:', e);
      }
    }
    if (pSettings.smsAlerts && pSettings.smsPhone && pSettings.smsCarrierDomain) {
      const smsText = `Appt scheduled w/ Dr. ${doctor.name} at ${appointmentTimeStr}`;
      try {
        await sendSmsViaEmail(pSettings.smsPhone, pSettings.smsCarrierDomain, smsText);
      } catch (e) {
        console.error('Failed to send appointment SMS to patient:', e);
      }
    }
    // 2. To doctor: if they have notificationSettings (similar schema on Doctor model)
    // Assuming Doctor model also has notificationSettings; adapt similarly.
    // For brevity, skip here or implement if Doctor model extended.

    return res.status(201).json({ appointment });
  } catch (err) {
    console.error('Error creating appointment:', err);
    return res.status(500).json({ message: 'Failed to create appointment' });
  }
});

// Example: Update appointment status (e.g., doctor confirms or completes)
// PUT /api/appointments/:id/status
router.put('/:id/status', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: string };
  if (!Types.ObjectId.isValid(id) || !status) {
    return res.status(400).json({ message: 'Invalid data' });
  }
  try {
    const appointment = await Appointment.findById(id).populate('patient').populate('doctor');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    appointment.status = status;
    await appointment.save();

    // Notify patient if relevant: e.g., when confirmed or completed
    const patient = appointment.patient as IPatient;
    const doctor = appointment.doctor as IDoctor;
    const pSettings = patient.notificationSettings || {};

    const subject = `Appointment ${status}`;
    const apptTimeStr = appointment.datetime.toLocaleString('en-US', { timeZone: 'UTC', hour12: true });
    const text = `Your appointment with Dr. ${doctor.name} on ${apptTimeStr} is now ${status}.`;

    if (pSettings.emailAppointments && patient.email) {
      try {
        await sendMail({ to: patient.email, subject, text });
      } catch (e) {
        console.error('Failed to send status email to patient:', e);
      }
    }
    if (pSettings.smsAlerts && pSettings.smsPhone && pSettings.smsCarrierDomain) {
      const smsText = `Appt w/ Dr. ${doctor.name} on ${apptTimeStr} is now ${status}`;
      try {
        await sendSmsViaEmail(pSettings.smsPhone, pSettings.smsCarrierDomain, smsText);
      } catch (e) {
        console.error('Failed to send status SMS to patient:', e);
      }
    }

    return res.json({ appointment });
  } catch (err) {
    console.error('Error updating appointment status:', err);
    return res.status(500).json({ message: 'Failed to update status' });
  }
});

export default router;
