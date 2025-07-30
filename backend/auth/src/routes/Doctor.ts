// File: backend/src/routes/doctor.ts

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import Doctor, { IDoctor } from '../models/Doctor';
import { authenticateJWT } from './auth';
import razorpayInstance from '../utils/razorpayClient';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage }); // in‐memory storage so req.file.buffer is available

// Rate limiter for Razorpay onboarding
const onboardingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many onboarding attempts. Try again later.',
});

// Middleware: ensure the user is a doctor
const authorizeDoctor = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).role !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors are allowed' });
  }
  next();
};

/**
 * GET /api/doctor/profile
 * — Return the authenticated doctor’s profile (excluding __v).
 */
router.get(
  '/profile',
  authenticateJWT,
  authorizeDoctor,
  async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user._id;
      const doctor = await Doctor.findById(doctorId)
        .select('-__v')
        .lean();
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      // Ensure _id is stringified for frontend consumption
      return res.json({ ...doctor, _id: doctor._id.toString() });
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);
router.get(
  '/me/profile-image',
  authenticateJWT,
  authorizeDoctor,
  async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user._id;
      const doctor = await Doctor.findById(doctorId).select('profileImage');

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      if (!doctor.profileImage || !doctor.profileImage.data) {
        return res.status(404).json({ error: 'Profile image not found' });
      }

      res.set('Content-Type', doctor.profileImage.contentType || 'image/jpeg');
      return res.send(doctor.profileImage.data);
    } catch (err) {
      console.error('Error fetching own profile image:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);
/**
 * GET /api/doctor/:id/profile-image
 * — Serve the stored profile image binary for any doctor.
 */
router.get('/:id/profile-image', async (req: Request, res: Response) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('profileImage');

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (!doctor.profileImage || !doctor.profileImage.data) {
      return res.status(404).json({ error: 'Profile image not found' });
    }

    res.set('Content-Type', doctor.profileImage.contentType || 'image/jpeg');
    return res.send(doctor.profileImage.data);
  } catch (err) {
    console.error('Error fetching profile image:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


/**
 * PUT /api/doctor/me
 * — Update own profile: specialty, experience, fee, bio, slots, photo, etc.
 */
router.put(
  '/me',
  authenticateJWT,
  authorizeDoctor,
upload.single('profileImage'),
  async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user._id;
      const {
        specialty,
        experience,
        consultationFee,
        maxPatients,
        hospitalAffiliation,
        bio,
        availabilitySlots // JSON‑stringified array of ISO datetimes
      } = req.body;

      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      // — Update simple fields if provided
      if (specialty !== undefined)           doctor.specialty           = specialty;
      if (experience !== undefined)          doctor.experience          = experience;
      if (consultationFee !== undefined)     doctor.consultationFee     = Number(consultationFee);
      if (maxPatients !== undefined)         doctor.maxPatients         = Number(maxPatients);
      if (hospitalAffiliation !== undefined) doctor.hospitalAffiliation = hospitalAffiliation;
      if (bio !== undefined)                 doctor.bio                 = bio;

      // — Handle profile image upload
      if (req.file) {
        doctor.profileImage = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        };
      }

      // — Parse and update availabilitySlots
      if (availabilitySlots !== undefined) {
        let slotsParsed: unknown;
        try {
          slotsParsed = JSON.parse(availabilitySlots);
        } catch {
          return res.status(400).json({ message: 'Invalid JSON for availabilitySlots' });
        }
        if (!Array.isArray(slotsParsed)) {
          return res.status(400).json({ message: 'availabilitySlots must be an array' });
        }
        // Map ISO strings to your schema shape
       doctor.availabilitySlots = slotsParsed.map((iso: string) => {
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) throw new Error(`Invalid date: ${iso}`);
  return {
    datetime: dt,
    quantity: doctor.maxPatients,
  };
});

      }

      await doctor.save();
      return res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err: any) {
      console.error('Error updating doctor profile:', err);
      if (err.message?.startsWith('Invalid date:')) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: 'Failed to update profile' });
    }
  }
);

/**
 * POST /api/doctor/onboard-razorpay
 * — Onboard doctor for payouts via Razorpay (contact + fund account).
 */
router.post(
  '/onboard-razorpay',
  authenticateJWT,
  authorizeDoctor,
  onboardingLimiter,
  express.json(),
  async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user._id;
      const { name, email, contact, bankAccountNumber, ifsc } = req.body;

      if (!name || !email || !contact || !bankAccountNumber || !ifsc) {
        return res.status(400).json({
          message: 'All fields required: name, email, contact, bankAccountNumber, ifsc'
        });
      }

      const doc = await Doctor.findById(doctorId);
      if (!doc) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      // If already onboarded, return existing IDs
      if (doc.razorpayContactId && doc.razorpayFundAccountId) {
        return res.json({
          message: 'Already onboarded',
          razorpayContactId: doc.razorpayContactId,
          razorpayFundAccountId: doc.razorpayFundAccountId,
        });
      }

      // 1. Create Razorpay Contact
      const contactResp = await razorpayInstance.contacts.create({
        name,
        email,
        contact,
        type: 'vendor',
      });

      // 2. Create Fund Account
      const fundResp = await razorpayInstance.fundAccounts.create({
        contact_id: contactResp.id,
        account_type: 'bank_account',
        bank_account: {
          name,
          ifsc,
          account_number: bankAccountNumber,
        },
      });

      doc.razorpayContactId = contactResp.id;
      doc.razorpayFundAccountId = fundResp.id;
      await doc.save();

      return res.json({
        message: 'Onboarding successful',
        razorpayContactId: contactResp.id,
        razorpayFundAccountId: fundResp.id,
      });
    } catch (error: any) {
      console.error('Razorpay onboarding error:', error);
      return res.status(500).json({ message: 'Failed to onboard for payouts' });
    }
  }
);

export default router;
