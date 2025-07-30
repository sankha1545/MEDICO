// File: backend/src/routes/medical.ts

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import Doctor, { IDoctor } from '../models/Doctor';
import Appointment from '../models/Appointment';
import Patient from '../models/Patient';

dotenv.config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// --- Auth middleware -------------------------------------------------------
interface AuthRequest extends Request {
  user?: { id: string; role: 'doctor' | 'patient' };
}

async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = auth.slice(7);
  let payload: any;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('JWT error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const { id, role } = payload;
  if (!id || !role) {
    return res.status(401).json({ message: 'Invalid token payload' });
  }

  try {
    if (role === 'doctor') {
      const doc = await Doctor.findById(id);
      if (!doc) return res.status(401).json({ message: 'Doctor not found' });
      if (!doc.isActive)
        return res.status(403).json({ message: 'Account deactivated' });
      req.user = { id: doc._id.toString(), role: 'doctor' };
    } else {
      const pat = await Patient.findById(id);
      if (!pat) return res.status(401).json({ message: 'Patient not found' });
      if (!pat.isActive)
        return res.status(403).json({ message: 'Account deactivated' });
      req.user = { id: pat._id.toString(), role: 'patient' };
    }
    next();
  } catch (err) {
    console.error('authMiddleware DB error:', err);
    return res.status(500).json({ message: 'Authentication failed' });
  }
}

// --- Multer for photo uploads ---------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

// --- Public helper to sanitize a doctor -----------------------------------
function sanitizeDoctor(doc: IDoctor) {
  const now = new Date();
  const slotsIso = Array.isArray(doc.availabilitySlots)
    ? doc.availabilitySlots.map((s) =>
        s.datetime instanceof Date
          ? s.datetime.toISOString()
          : String(s.datetime)
      )
    : [];
  const future = slotsIso
    .map((s) => new Date(s))
    .filter((d) => d > now)
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    id: doc._id,
    name: doc.name,
    specialty: doc.specialty || '',
    experience: doc.experience || '',
    hospitalAffiliation: doc.hospitalAffiliation || '',
    location:
      typeof doc.location === 'string'
        ? doc.location
        : doc.locationObj?.address || '',
    availabilitySlots: slotsIso,
    consultationFee: doc.consultationFee ?? 0,
    rating: doc.rating ?? 0,
    reviewCount: doc.reviewCount ?? 0,
    availableSlotsCount: future.length,
    nextAvailable: future[0]?.toISOString() || null,
    nextSlots: future.slice(0, 3).map((d) => d.toISOString()),
    profileImageUrl: `/api/medical/doctor/${doc._id}/profile-image`,
  };
}

// --------- Public Routes --------------------------------------------------

// GET specialties
router.get('/specialties', (_req, res) => {
  res.json({
    specialties: [
      'Cardiology',
      'Dermatology',
      'Neurology',
      'Oncology',
      'Pediatrics',
      'Psychiatry',
      'Radiology',
      'Urology',
      'Orthopedics',
      'Gastroenterology',
    ],
  });
});

// GET doctors list
router.get('/doctors', async (req, res) => {
  try {
    const { specialty, search, page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));

    const filter: any = { isActive: true };
    if (typeof specialty === 'string' && specialty.trim()) {
      filter.specialty = specialty;
    }
    if (typeof search === 'string' && search.trim()) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const total = await Doctor.countDocuments(filter);
    const docs = await Doctor.find(filter)
      .sort({ rating: -1, reviewCount: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.json({
      page: pageNum,
      limit: limitNum,
      total,
      doctors: docs.map(sanitizeDoctor),
    });
  } catch (err) {
    console.error('GET /doctors error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET single doctor
router.get('/doctors/:id', async (req, res) => {
  try {
    const doc = await Doctor.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Doctor not found' });

    const now = new Date();
    const slotsIso = Array.isArray(doc.availabilitySlots)
      ? doc.availabilitySlots.map((s) =>
          s.datetime instanceof Date
            ? s.datetime.toISOString()
            : String(s.datetime)
        )
      : [];
    const future = slotsIso
      .map((s) => new Date(s))
      .filter((d) => d > now)
      .sort((a, b) => a.getTime() - b.getTime());
    const nextSlots = future.slice(0, 5).map((d) => d.toISOString());

    return res.json({
      id: doc._id,
      name: doc.name,
      email: doc.email || '',
      specialty: doc.specialty || '',
      experience: doc.experience || '',
      hospitalAffiliation: doc.hospitalAffiliation || '',
      location:
        typeof doc.location === 'string'
          ? doc.location
          : doc.locationObj?.address || '',
      availabilitySlots: slotsIso,
      nextSlots,
      consultationFee: doc.consultationFee ?? 0,
      bio: doc.bio || '',
      qualifications: doc.qualifications || [],
      languages: doc.languages || [],
      rating: doc.rating ?? 0,
      reviewCount: doc.reviewCount ?? 0,
      profileImageUrl: `/api/medical/doctor/${doc._id}/profile-image`,
    });
  } catch (err) {
    console.error('GET /doctors/:id error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// --------- Authenticated Doctor Routes ------------------------------------

// GET my profile
router.get('/doctor/me', authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const doc = await Doctor.findById(req.user.id);
    if (!doc) return res.status(404).json({ message: 'Doctor not found' });

    const now = new Date();
    const slotsIso = Array.isArray(doc.availabilitySlots)
      ? doc.availabilitySlots.map((s) =>
          s.datetime instanceof Date
            ? s.datetime.toISOString()
            : String(s.datetime)
        )
      : [];
    const future = slotsIso
      .map((s) => new Date(s))
      .filter((d) => d > now)
      .sort((a, b) => a.getTime() - b.getTime());
    const nextSlots = future.slice(0, 5).map((d) => d.toISOString());

    // total earnings
    const earningsAgg = await Appointment.aggregate([
      {
        $match: {
          doctor: new mongoose.Types.ObjectId(doc._id),
          status: 'completed',
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' },
        },
      },
    ]);
    const totalEarnings = earningsAgg[0]?.totalEarnings ?? 0;

    return res.json({
      id: doc._id,
      name: doc.name,
      email: doc.email,
      specialty: doc.specialty || '',
      phone: doc.phone || '',
      dob: doc.dob?.toISOString().split('T')[0] || '',
      location:
        typeof doc.location === 'string'
          ? doc.location
          : doc.locationObj?.address || '',
      locationObj: doc.locationObj || null,
      availabilitySlots: slotsIso,
      nextSlots,
      maxPatients: doc.maxPatients,
      experience: doc.experience,
      hospitalAffiliation: doc.hospitalAffiliation,
      bio: doc.bio,
      qualifications: doc.qualifications || [],
      languages: doc.languages || [],
      consultationFee: doc.consultationFee ?? 0,
      totalEarnings,
      rating: doc.rating ?? 0,
      reviewCount: doc.reviewCount ?? 0,
      profileImageUrl: `/api/medical/doctor/${doc._id}/profile-image`,
    });
  } catch (err) {
    console.error('GET /doctor/me error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET my profile image
router.get(
  '/doctor/me/profile-image',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }
    try {
      const doc = await Doctor.findById(req.user.id).select('profileImage');
      if (!doc || !doc.profileImage?.data) {
        return res.status(404).json({ message: 'Profile image not found' });
      }
      res.setHeader('Content-Type', doc.profileImage.contentType);
      return res.send(doc.profileImage.data);
    } catch (err) {
      console.error('GET /doctor/me/profile-image error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT (upsert) my profile
router.put(
  '/doctor/me',
  authMiddleware,
  upload.single('profileImage'),
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    try {
      const doc = await Doctor.findById(req.user.id);
      if (!doc) return res.status(404).json({ message: 'Doctor not found' });

      const {
        name,
        email,
        specialty,
        phone,
        dob,
        locationObj,
        availabilitySlots,
        maxPatients,
        experience,
        hospitalAffiliation,
        bio,
        qualifications,
        languages,
        consultationFee,
      } = req.body;

      // Simple fields
      if (name) doc.name = name;
      if (email) doc.email = email;
      if (specialty) doc.specialty = specialty;
      if (phone) doc.phone = phone;
      if (dob) {
        const d = new Date(dob);
        if (!isNaN(d.getTime())) doc.dob = d;
      }

      // Location
      if (locationObj) {
        try {
          const loc =
            typeof locationObj === 'string'
              ? JSON.parse(locationObj)
              : locationObj;
          if (
            loc.address &&
            typeof loc.lat === 'number' &&
            typeof loc.lng === 'number'
          ) {
            doc.locationObj = loc;
            doc.location = loc.address;
          }
        } catch {}
      }

      // Availability slots
      if (availabilitySlots) {
        const arr =
          typeof availabilitySlots === 'string'
            ? JSON.parse(availabilitySlots)
            : availabilitySlots;
        if (Array.isArray(arr)) {
          doc.availabilitySlots = arr
            .map((s: any): { datetime: Date; quantity?: number } | null => {
              const d = new Date(
                typeof s === 'string' ? s : s?.datetime
              );
              if (isNaN(d.getTime())) return null;
              return {
                datetime: d,
                quantity:
                  typeof s === 'object' && 'quantity' in s
                    ? s.quantity
                    : undefined,
              };
            })
            .filter(
              (slot): slot is { datetime: Date; quantity?: number } =>
                slot !== null
            );
        }
      }

      // Debug + save
      console.log('Saving slots:', doc.availabilitySlots);
      await doc.save();

      // Other array fields
      if (qualifications) {
        try {
          const q =
            typeof qualifications === 'string'
              ? JSON.parse(qualifications)
              : qualifications;
          doc.qualifications = Array.isArray(q)
            ? q.map(String)
            : String(qualifications)
                .split(',')
                .map((s) => s.trim());
        } catch {
          doc.qualifications = String(qualifications)
            .split(',')
            .map((s) => s.trim());
        }
      }

      if (languages) {
        try {
          const l =
            typeof languages === 'string'
              ? JSON.parse(languages)
              : languages;
          doc.languages = Array.isArray(l)
            ? l.map(String)
            : String(languages)
                .split(',')
                .map((s) => s.trim());
        } catch {
          doc.languages = String(languages)
            .split(',')
            .map((s) => s.trim());
        }
      }

      if (maxPatients) {
        const mp = parseInt(maxPatients, 10);
        if (!isNaN(mp)) doc.maxPatients = mp;
      }

      if (experience) doc.experience = experience;
      if (hospitalAffiliation) doc.hospitalAffiliation = hospitalAffiliation;
      if (bio) doc.bio = bio;

      if (consultationFee !== undefined) {
        const fee = parseFloat(String(consultationFee));
        if (!isNaN(fee)) doc.consultationFee = fee;
      }

      // Profile photo
      if (req.file) {
        doc.profileImage = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        };
      }

      // Final save & response
      await doc.save();
      return res.json({
        id: doc._id,
        name: doc.name,
        email: doc.email,
        specialty: doc.specialty || '',
        phone: doc.phone || '',
        dob: doc.dob?.toISOString().split('T')[0] || '',
        location: doc.location || doc.locationObj?.address || '',
        locationObj: doc.locationObj || null,
        availabilitySlots: doc.availabilitySlots.map((s) =>
          s.datetime.toISOString()
        ),
        maxPatients: doc.maxPatients,
        experience: doc.experience,
        hospitalAffiliation: doc.hospitalAffiliation,
        bio: doc.bio,
        qualifications: doc.qualifications || [],
        languages: doc.languages || [],
        consultationFee: doc.consultationFee ?? 0,
        profileImageUrl: `/api/medical/doctor/${doc._id}/profile-image`,
      });
    } catch (err) {
      console.error('PUT /doctor/me error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE my profile
router.delete(
  '/doctor/me',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }
    try {
      await Doctor.findByIdAndDelete(req.user.id);
      return res.json({ message: 'Profile deleted' });
    } catch (err) {
      console.error('DELETE /doctor/me error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET appointments for a doctor
router.get(
  '/doctor/:id/appointments',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    if (
      !req.user ||
      req.user.role !== 'doctor' ||
      req.user.id !== req.params.id
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }
    try {
      const appointments = await Appointment.find({
        doctor: req.params.id,
      }).sort({ date: 1 });
      return res.json({ appointments });
    } catch (err) {
      console.error('GET /doctor/:id/appointments error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
