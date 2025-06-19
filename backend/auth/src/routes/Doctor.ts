// File: backend/src/routes/doctor.ts

import express from 'express';
import razorpay from '../utils/razorpay';
import Doctor from '../models/Doctor';
import rateLimit from 'express-rate-limit';
import { authenticateJWT } from './auth'; // uses your auth.ts

const router = express.Router();

// Rate limiter for onboarding attempts
const onboardingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many onboarding attempts, please try later.',
});

// Middleware: ensure authenticated user is a doctor
const authorizeDoctor = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const role = (req as any).role;
  if (role !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors are allowed' });
  }
  next();
};

// GET /api/doctor/profile
// Returns the authenticated doctor's profile, including Razorpay fields if present.
router.get(
  '/profile',
  authenticateJWT,
  authorizeDoctor,
  async (req, res) => {
    try {
      // req.user is the full user document (Doctor instance) from auth.ts
      const doctor = (req as any).user as typeof Doctor.prototype;
      // Re-fetch to get latest fields if needed, or use req.user directly
      const fresh = await Doctor.findById(doctor._id).select('-__v').exec();
      if (!fresh) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      // toJSON transform on model strips sensitive fields like passwordHash, bankAccountNumber, ifsc
      return res.json(fresh);
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/doctor/onboard-razorpay
// Body: { name, email, contact, bankAccountNumber, ifsc }
// Creates Razorpay Contact & Fund Account for payouts.
router.post(
  '/onboard-razorpay',
  authenticateJWT,
  authorizeDoctor,
  onboardingLimiter,
  express.json(),
  async (req, res) => {
    try {
      const doctorId = ((req as any).user as any)._id;
      const { name, email, contact, bankAccountNumber, ifsc } = req.body as {
        name: string;
        email: string;
        contact: string;
        bankAccountNumber: string;
        ifsc: string;
      };
      // Validate required fields
      if (!name || !email || !contact || !bankAccountNumber || !ifsc) {
        return res.status(400).json({
          message:
            'All fields required: name, email, contact, bankAccountNumber, ifsc',
        });
      }
      const doctor = await Doctor.findById(doctorId).exec();
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      // If already onboarded, return existing IDs
      if (doctor.razorpayContactId && doctor.razorpayFundAccountId) {
        return res.json({
          message: 'Already onboarded',
          razorpayContactId: doctor.razorpayContactId,
          razorpayFundAccountId: doctor.razorpayFundAccountId,
        });
      }
      // 1. Create Razorpay Contact
      const contactPayload = {
        name,
        email,
        contact, // phone number, e.g., '9123456789'
        type: 'vendor',
      };
      const contactResponse = await razorpay.contacts.create(contactPayload);
      const razorpayContactId = contactResponse.id;
      // 2. Create Fund Account (bank) for the contact
      const fundAccountPayload = {
        contact_id: razorpayContactId,
        account_type: 'bank_account',
        bank_account: {
          name,
          ifsc,
          account_number: bankAccountNumber,
        },
      };
      const fundAccountResponse = await razorpay.fundAccounts.create(fundAccountPayload);
      const razorpayFundAccountId = fundAccountResponse.id;
      // Save in Doctor model
      doctor.razorpayContactId = razorpayContactId;
      doctor.razorpayFundAccountId = razorpayFundAccountId;
      // Optionally store raw bank details; toJSON strips them
      doctor.bankAccountNumber = bankAccountNumber;
      doctor.ifsc = ifsc;
      await doctor.save();
      return res.json({
        message: 'Onboarding successful',
        razorpayContactId,
        razorpayFundAccountId,
      });
    } catch (error: any) {
      console.error('Razorpay onboarding error:', error);
      return res
        .status(500)
        .json({ message: 'Failed to onboard for payouts' });
    }
  }
);

export default router;
