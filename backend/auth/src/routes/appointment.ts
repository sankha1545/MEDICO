// File: backend/src/routes/appointment.ts

import express, { Request, Response } from 'express';
import Appointment from '../models/Appointment';
import Doctor from '../models/Doctor';
import { authenticateJWT } from './auth'; // adjust import
import mongoose from 'mongoose';

const router = express.Router();

// POST /api/appointments
router.post(
  '/',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const role = (req as any).role;
      if (role !== 'patient') {
        return res.status(403).json({ message: 'Only patients can book appointments' });
      }
      const { doctorId, datetime, message, fee } = req.body as {
        doctorId: string;
        datetime: string;
        message?: string;
        fee: number;
      };
      if (!doctorId || !datetime || fee == null) {
        return res.status(400).json({ message: 'doctorId, datetime, and fee are required' });
      }
      // Validate doctor exists
      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({ message: 'Invalid doctorId' });
      }
      const doctor = await Doctor.findById(doctorId).exec();
      if (!doctor || !doctor.isActive) {
        return res.status(404).json({ message: 'Doctor not found or inactive' });
      }
      // Validate slot: optional: check if datetime matches one of doctor's availabilitySlots
      // For simplicity, skip strict check here (frontend selects from valid slots).
      const apptDate = new Date(datetime);
      if (isNaN(apptDate.getTime()) || apptDate <= new Date()) {
        return res.status(400).json({ message: 'Invalid or past datetime' });
      }
      // Create appointment
      const newAppt = new Appointment({
        patient: user._id,
        doctor: doctorId,
        datetime: apptDate,
        message: message || '',
        amount: fee,
        currency: 'INR',
        status: 'pending_payment', // as per updated enum
        paymentStatus: 'pending',
      });
      const saved = await newAppt.save();
      return res.status(201).json({ appointmentId: saved._id });
    } catch (err) {
      console.error('Error creating appointment:', err);
      return res.status(500).json({ message: 'Failed to create appointment' });
    }
  }
);

// GET /api/appointments/:id
router.get(
  '/:id',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const role = (req as any).role;
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid appointment ID' });
      }
      const appt = await Appointment.findById(id)
        .populate('doctor', 'name email consultationFee razorpayAccountId')
        .populate('patient', 'name email')
        .exec();
      if (!appt) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      // Only patient or doctor involved can fetch
      if (
        role === 'patient' && appt.patient.toString() !== user._id.toString()
        || role === 'doctor' && appt.doctor._id.toString() !== user._id.toString()
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }
      return res.json(appt);
    } catch (err) {
      console.error('Error fetching appointment:', err);
      return res.status(500).json({ message: 'Failed to fetch appointment' });
    }
  }
);

export default router;
