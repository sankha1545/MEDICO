// File: backend/src/routes/medical.ts

import express, { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import Doctor from '../models/Doctor';
import MedicalInfo from '../models/MedicalInfo';
import Appointment from '../models/Appointment';
import { authenticateJWT } from './auth';
import { IPatient } from '../models/Patient';

const router: Router = express.Router();

/**
 * ── Patient Medical Info ──────────────────────────────────
 */

// GET /api/medical
// Returns the logged‐in patient’s stored medical info (or defaults if none).
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as IPatient;
    const record = await MedicalInfo.findOne({ user: user._id }).lean();
    if (!record) {
      return res.json({
        medicalInfo: {
          bloodType: '',
          allergies: '',
          currentMedications: '',
          medicalConditions: '',
        },
      });
    }
    return res.json({ medicalInfo: record });
  } catch (err) {
    console.error('Error fetching medical info:', err);
    return res.status(500).json({ message: 'Failed to fetch medical info' });
  }
});

// PUT /api/medical
// Creates or updates the logged‐in patient’s medical info.
router.put('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as IPatient;
    const { bloodType, allergies, currentMedications, medicalConditions } = req.body;
    if (
      typeof bloodType !== 'string' ||
      typeof allergies !== 'string' ||
      typeof currentMedications !== 'string' ||
      typeof medicalConditions !== 'string'
    ) {
      return res.status(400).json({ message: 'Invalid medical info data' });
    }

    let record = await MedicalInfo.findOne({ user: user._id });
    if (!record) {
      record = new MedicalInfo({
        user: user._id,
        bloodType,
        allergies,
        currentMedications,
        medicalConditions,
      });
    } else {
      record.set({ bloodType, allergies, currentMedications, medicalConditions });
    }

    const saved = await record.save();
    return res.json({ medicalInfo: saved });
  } catch (err) {
    console.error('Error saving medical info:', err);
    return res.status(500).json({ message: 'Failed to save medical info' });
  }
});

/**
 * ── Doctor Listing & Profiles ────────────────────────────
 */

// GET /api/medical/doctors
// Returns a list of all doctors (no authentication required).
router.get('/doctors', async (req: Request, res: Response) => {
  try {
    const docs = await Doctor.find();
    const list = docs.map((d) => ({
      id: d._id,
      name: d.name,
      specialty: d.specialty,
      rating: d.rating,
      reviewCount: d.reviewCount,
      experience: d.experience,
      hospitalAffiliation: d.hospitalAffiliation,
      location: d.location,
      availableSlots: d.availableSlots,
      nextAvailable: d.nextAvailable,
      image:
        d.profileImage?.data && d.profileImage.contentType
          ? `data:${d.profileImage.contentType};base64,${d.profileImage.data.toString('base64')}`
          : `${process.env.FRONTEND_URL}/default-doctor.png`,
    }));
    return res.json(list);
  } catch (err) {
    console.error('Error fetching doctors:', err);
    return res.status(500).json({ message: 'Failed to fetch doctors' });
  }
});

// GET /api/medical/doctors/:id
// Returns the full profile of a single doctor (protected: must be authenticated).
router.get('/doctors/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid doctor ID' });
  }

  try {
    const d = await Doctor.findById(id);
    if (!d) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    return res.json({
      id: d._id,
      name: d.name,
      email: d.email,
      specialty: d.specialty,
      experience: d.experience,
      hospitalAffiliation: d.hospitalAffiliation,
      location: d.location,
      availableSlots: d.availableSlots,
      nextAvailable: d.nextAvailable,
      rating: d.rating,
      reviewCount: d.reviewCount,
      bio: d.bio,
      qualifications: d.qualifications,
      languages: d.languages,
      profileImageUrl:
        d.profileImage?.data && d.profileImage.contentType
          ? `data:${d.profileImage.contentType};base64,${d.profileImage.data.toString('base64')}`
          : `${process.env.FRONTEND_URL}/default-doctor.png`,
    });
  } catch (err) {
    console.error('Error fetching doctor profile:', err);
    return res.status(500).json({ message: 'Failed to fetch doctor profile' });
  }
});

/**
 * ── Rate a Doctor (One‐Time per Appointment) ─────────────────────────────────
 * POST /api/medical/appointments/:id/rate
 * Body: { rating: number }  // between 1 and 5
 * Only patients whose appointment has status 'completed' and who have not yet rated can rate.
 */
router.post('/appointments/:id/rate', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rating } = req.body as { rating: number };

  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid appointment ID' });
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
  }

  try {
    const user = (req as any).user as IPatient;

    // 1) Find the appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // 2) Ensure this appointment belongs to the logged‐in patient
    if (!appointment.patient.equals(user._id)) {
      return res.status(403).json({ message: 'You can only rate your own appointments' });
    }

    // 3) Ensure appointment is completed
    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed appointments' });
    }

    // 4) Ensure not already rated
    if (appointment.rated) {
      return res.status(400).json({ message: 'You have already rated this appointment' });
    }

    // 5) Fetch the corresponding doctor
    const doctor = await Doctor.findById(appointment.doctor);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // 6) Recalculate running average rating
    const totalScore = doctor.rating * doctor.reviewCount;
    const newCount = doctor.reviewCount + 1;
    const newAvg = (totalScore + rating) / newCount;

    doctor.rating = parseFloat(newAvg.toFixed(2));
    doctor.reviewCount = newCount;
    await doctor.save();

    // 7) Mark appointment as rated
    appointment.rated = true;
    await appointment.save();

    return res.json({
      doctorId: doctor._id,
      rating: doctor.rating,
      reviewCount: doctor.reviewCount,
    });
  } catch (err) {
    console.error('Error rating appointment:', err);
    return res.status(500).json({ message: 'Failed to submit rating' });
  }
});

export default router;
