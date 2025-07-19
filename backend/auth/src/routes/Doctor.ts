// File: backend/src/routes/doctor.ts

import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import razorpay from '../utils/razorpayClient';
import Doctor from '../models/Doctor';
import { authenticateJWT } from './auth';

const router = express.Router();
const upload = multer();

// Rate limiter for Razorpay onboarding
const onboardingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many onboarding attempts, please try later.',
});

// Middleware: ensure the user is a doctor
const authorizeDoctor = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if ((req as any).role !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors are allowed' });
  }
  next();
};

/**
 * GET /api/doctor/profile
 * — Return the authenticated doctor’s profile.
 */
router.get(
  '/profile',
  authenticateJWT,
  authorizeDoctor,
  async (req, res) => {
    try {
      const doctorId = (req as any).user._id;
      const doctor = await Doctor.findById(doctorId)
        .select('-__v')
        .lean();
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      return res.json(doctor);
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * PUT /api/doctor/me
 * — Update specialty, slots, maxPatients, fee, bio, etc.
 */


router.put(
  '/me',
  authenticateJWT,
  authorizeDoctor,
  upload.single('photo'),
  async (req, res) => {
    try {
      const doctorId = (req as any).user._id;

      const {
        specialty,
        experience,
        consultationFee,
        maxPatients,
        hospitalAffiliation,
        bio,
        availabilitySlots, // Should be JSON stringified array of ISO strings
      } = req.body;

      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      // Update profile fields if provided
      if (specialty !== undefined) doctor.specialty = specialty;
      if (experience !== undefined) doctor.experience = experience;
      if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee);
      if (maxPatients !== undefined) doctor.maxPatients = Number(maxPatients);
      if (hospitalAffiliation !== undefined) doctor.hospitalAffiliation = hospitalAffiliation;
      if (bio !== undefined) doctor.bio = bio;

      // Handle profile image upload
      if (req.file) {
        doctor.profileImage = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        };
      }

      // Parse and update availabilitySlots if provided
      if (availabilitySlots) {
        let parsedSlots: string[] = [];

        try {
          parsedSlots = JSON.parse(availabilitySlots);
          if (!Array.isArray(parsedSlots)) {
            return res.status(400).json({ message: 'Invalid availabilitySlots format' });
          }
        } catch (parseErr) {
          return res.status(400).json({ message: 'Error parsing availabilitySlots' });
        }

        doctor.availabilitySlots = parsedSlots.map((iso: string) => ({
          datetime: new Date(iso),
          quantity: doctor.maxPatients, // Use updated maxPatients dynamically
        }));
      }

      await doctor.save();
      return res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err) {
      console.error('Error updating doctor profile:', err);
      return res.status(500).json({ message: 'Failed to update profile' });
    }
  }
);


/**
 * POST /api/doctor/onboard-razorpay
 * — Onboard doctor for payouts via Razorpay (contact & fund account).
 */
router.post(
  '/onboard-razorpay',
  authenticateJWT,
  authorizeDoctor,
  onboardingLimiter,
  express.json(),
  async (req, res) => {
    try {
      const doctorId = (req as any).user._id;
      const { name, email, contact, bankAccountNumber, ifsc } = req.body;
      if (!name || !email || !contact || !bankAccountNumber || !ifsc) {
        return res.status(400).json({ message: 'All fields required: name, email, contact, bankAccountNumber, ifsc' });
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
      const contactResp = await razorpay.contacts.create({
        name,
        email,
        contact,
        type: 'vendor',
      });
      // 2. Create Fund Account
      const fundResp = await razorpay.fundAccounts.create({
        contact_id: contactResp.id,
        account_type: 'bank_account',
        bank_account: {
          name,
          ifsc,
          account_number: bankAccountNumber,
        },
      });

      // Save Razorpay IDs in doctor record
      doc.razorpayContactId = contactResp.id;
      doc.razorpayFundAccountId = fundResp.id;
      // Optionally store bank details (will be stripped from JSON output)
      doc.bankAccountNumber = bankAccountNumber;
      doc.ifsc = ifsc;
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
