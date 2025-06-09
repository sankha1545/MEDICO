import express, { Router, Request, Response } from 'express';
import MedicalInfo from '../models/MedicalInfo';
import Doctor from '../models/Doctor';
import { authenticateJWT } from './auth';
import { IPatient } from '../models/Patient';

const router: Router = express.Router();

/**
 * ── Patient Medical Info ──────────────────────────────────
 */

// GET /api/medical
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
router.put('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as IPatient;
    const {
      bloodType,
      allergies,
      currentMedications,
      medicalConditions,
    } = req.body;
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
    res.json(list);
  } catch (err) {
    console.error('Error fetching doctors:', err);
    res.status(500).json({ message: 'Failed to fetch doctors' });
  }
});

// GET /api/medical/doctors/:id
router.get('/doctors/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const d = await Doctor.findById(req.params.id);
    if (!d) return res.status(404).json({ message: 'Doctor not found' });
    return res.json({
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
      bio: d.bio,
      qualifications: d.qualifications,
      languages: d.languages,
    });
  } catch (err) {
    console.error('Error fetching doctor profile:', err);
    res.status(500).json({ message: 'Failed to fetch doctor profile' });
  }
});

/**
 * ── Rate a Doctor ────────────────────────────────────────
 * POST /api/medical/doctors/:id/rate
 * Body: { rating: number }  // 1 to 5
 * Protected: patient must be logged in
 */
router.post('/doctors/:id/rate', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).role;
    if (userRole !== 'patient') {
      return res.status(403).json({ message: 'Only patients can rate doctors' });
    }
    const { rating } = req.body;
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Update running average
    const totalScore = doctor.rating * doctor.reviewCount;
    const newCount = doctor.reviewCount + 1;
    const newAvg = (totalScore + rating) / newCount;

    doctor.rating = parseFloat(newAvg.toFixed(2));
    doctor.reviewCount = newCount;

    await doctor.save();

    return res.json({
      id: doctor._id,
      rating: doctor.rating,
      reviewCount: doctor.reviewCount,
    });
  } catch (err) {
    console.error('Error rating doctor:', err);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
});

export default router;
