// File: backend/src/routes/appointment.ts

import express, { Router, Request, Response } from 'express';
import Appointment, { IAppointment } from '../models/Appointment';
import { authenticateJWT } from './auth';
import { Types } from 'mongoose';

const router: Router = express.Router();

// POST /api/appointments
// Create a new appointment (status: pending)
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, email, phone, message } = req.body as {
      name: string;
      email: string;
      phone: string;
      message: string;
    };
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const newAppointment = new Appointment({
      user: user._id,
      name,
      email,
      phone,
      message,
      status: 'pending',
    });
    const saved = await newAppointment.save();
    return res.status(201).json({ id: saved._id });
  } catch (err) {
    console.error('Error creating appointment:', err);
    return res.status(500).json({ message: 'Failed to create appointment' });
  }
});

// POST /api/appointments/:id/pay
// Process payment and mark appointment confirmed
router.post('/:id/pay', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentMethod } = req.body as { paymentMethod: 'netbanking' | 'upi' | 'cash' };

  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid appointment ID' });
  }
  if (!['netbanking', 'upi', 'cash'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Invalid payment method' });
  }

  try {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    // Ensure the logged-in user owns this appointment
    const user = (req as any).user;
    if (appointment.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to pay for this appointment' });
    }
    appointment.status = 'confirmed';
    appointment.paymentMethod = paymentMethod;
    appointment.paidAt = new Date();
    await appointment.save();
    return res.json({ message: 'Payment successful', status: appointment.status });
  } catch (err) {
    console.error('Error processing payment:', err);
    return res.status(500).json({ message: 'Payment processing failed' });
  }
});

// GET /api/appointments/:id
// (Optional) Fetch appointment details
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid appointment ID' });
  }
  try {
    const appointment = await Appointment.findById(id).lean();
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    const user = (req as any).user;
    if (appointment.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to view this appointment' });
    }
    return res.json(appointment);
  } catch (err) {
    console.error('Error fetching appointment:', err);
    return res.status(500).json({ message: 'Failed to fetch appointment' });
  }
});

export default router;
