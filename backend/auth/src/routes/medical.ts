// File: backend/src/routes/medical.ts

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';
import Patient from '../models/Patient'; // if you need to lookup patients in auth
// No import of '../models/User' since it does not exist

dotenv.config();

const router = express.Router();

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// --------- Inline auth middleware (JWT) ---------
// Expects Authorization: Bearer <token>
// Payload must include { id: string, role: string }
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const userId = payload.id;
    const role = payload.role;
    if (!userId || !role) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    // Lookup in appropriate collection
    if (role === 'doctor') {
      const doc = await Doctor.findById(userId).exec();
      if (!doc) {
        return res.status(401).json({ message: 'Doctor not found' });
      }
      req.user = { id: doc._id.toString(), role: 'doctor' };
    } else if (role === 'patient') {
      const pat = await Patient.findById(userId).exec();
      if (!pat) {
        return res.status(401).json({ message: 'Patient not found' });
      }
      req.user = { id: pat._id.toString(), role: 'patient' };
    } else {
      // Other roles if any
      return res.status(403).json({ message: 'Unknown role' });
    }

    next();
  } catch (err) {
    console.error('authMiddleware error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// --------- Multer setup for profile image uploads ---------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// --------- Helper: sanitize doctor for public listing ---------
function sanitizeDoctor(doc: any): any {
  return {
    id: doc._id,
    name: doc.name,
    specialty: doc.specialty,
    rating: doc.rating,
    reviewCount: doc.reviewCount,
    experience: doc.experience,
    hospitalAffiliation: doc.hospitalAffiliation,
    location: doc.location, // address string
    nextAvailable: doc.nextAvailable,
    availableSlots: doc.availableSlots,
    bio: doc.bio,
    qualifications: doc.qualifications,
    languages: doc.languages,
    consultationFee: doc.consultationFee,
  };
}

// ----------------- Public routes -----------------

// GET /api/medical/specialties
router.get('/specialties', (_req: Request, res: Response) => {
  const SPECIALTIES = [
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
  ];
  res.json({ specialties: SPECIALTIES });
});

// GET /api/medical/doctors
// List doctors with optional filters: specialty, search by name, pagination
router.get('/doctors', async (req: Request, res: Response) => {
  try {
    const { specialty, search, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const filter: any = { isActive: true };
    if (specialty) filter.specialty = specialty;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const skip = (pageNum - 1) * limitNum;
    const total = await Doctor.countDocuments(filter).exec();
    const docs = await Doctor.find(filter)
      .sort({ rating: -1, reviewCount: -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();
    const sanitized = docs.map((d) => sanitizeDoctor(d));
    return res.json({
      page: pageNum,
      limit: limitNum,
      total,
      doctors: sanitized,
    });
  } catch (err) {
    console.error('GET /api/medical/doctors error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/medical/doctors/:id
router.get('/doctors/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await Doctor.findById(id).exec();
    if (!doc) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    const data: any = sanitizeDoctor(doc);
    return res.json(data);
  } catch (err) {
    console.error('GET /api/medical/doctors/:id error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/medical/doctor/:id/profile-image
router.get('/doctor/:id/profile-image', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await Doctor.findById(id).exec();
    if (!doc) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    if (doc.profileImage && doc.profileImage.data) {
      res.set('Content-Type', doc.profileImage.contentType || 'image/jpeg');
      return res.send(doc.profileImage.data);
    } else {
      return res.status(404).json({ message: 'No profile image' });
    }
  } catch (err) {
    console.error('GET /api/medical/doctor/:id/profile-image error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ----------------- Authenticated doctor routes -----------------

// GET /api/medical/doctor/me
router.get('/doctor/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied: not a doctor' });
    }
    const doctorId = req.user.id;
    const doc = await Doctor.findById(doctorId).exec();
    if (!doc) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    return res.json({
      id: doc._id,
      name: doc.name,
      email: doc.email,
      specialty: doc.specialty || '',
      phone: doc.phone || '',
      dob: doc.dob ? doc.dob.toISOString().split('T')[0] : '',
      location: doc.location || '',
      slotDateTime: doc.nextAvailable || '',
      maxPatients: doc.availableSlots,
      experience: doc.experience,
      hospitalAffiliation: doc.hospitalAffiliation,
      bio: doc.bio,
      qualifications: doc.qualifications,
      languages: doc.languages,
      consultationFee: doc.consultationFee,
      rating: doc.rating,
      reviewCount: doc.reviewCount,
    });
  } catch (err) {
    console.error('GET /api/medical/doctor/me error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/medical/doctor/me/profile-image
router.get(
  '/doctor/me/profile-image',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== 'doctor') {
        return res.status(403).json({ message: 'Access denied: not a doctor' });
      }
      const doc = await Doctor.findById(req.user.id).exec();
      if (!doc) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }
      if (doc.profileImage && doc.profileImage.data) {
        res.set('Content-Type', doc.profileImage.contentType || 'image/jpeg');
        return res.send(doc.profileImage.data);
      } else {
        return res.status(404).json({ message: 'No profile image' });
      }
    } catch (err) {
      console.error('GET /api/medical/doctor/me/profile-image error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/medical/doctor/me
router.put(
  '/doctor/me',
  authMiddleware,
  upload.single('profileImage'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== 'doctor') {
        return res.status(403).json({ message: 'Access denied: not a doctor' });
      }
      const doctorId = req.user.id;
      const doc = await Doctor.findById(doctorId).exec();
      if (!doc) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }

      const {
        name,
        email,
        specialty,
        phone,
        dob,
        location,
        slotDateTime,
        maxPatients,
        experience,
        hospitalAffiliation,
        bio,
        qualifications,
        languages,
        consultationFee,
      } = req.body;

      // Update basic fields
      if (name !== undefined) doc.name = name;
      if (email !== undefined) doc.email = email;
      if (specialty !== undefined) doc.specialty = specialty;
      if (phone !== undefined) doc.phone = phone;
      if (dob) {
        const dt = new Date(dob);
        if (!isNaN(dt.getTime())) doc.dob = dt;
      }
      if (location !== undefined) {
        doc.location = location;
      }
      if (slotDateTime !== undefined) {
        doc.nextAvailable = slotDateTime;
      }
      if (maxPatients !== undefined) {
        const num = parseInt(maxPatients, 10);
        if (!isNaN(num) && num >= 0) {
          doc.availableSlots = num;
        }
      }
      // Additional fields
      if (experience !== undefined) doc.experience = experience;
      if (hospitalAffiliation !== undefined) doc.hospitalAffiliation = hospitalAffiliation;
      if (bio !== undefined) doc.bio = bio;

      if (qualifications !== undefined) {
        if (typeof qualifications === 'string') {
          try {
            const arr = JSON.parse(qualifications);
            if (Array.isArray(arr)) doc.qualifications = arr;
            else doc.qualifications = qualifications.split(',').map((s) => s.trim());
          } catch {
            doc.qualifications = qualifications.split(',').map((s) => s.trim());
          }
        } else if (Array.isArray(qualifications)) {
          doc.qualifications = qualifications;
        }
      }

      if (languages !== undefined) {
        if (typeof languages === 'string') {
          try {
            const arr = JSON.parse(languages);
            if (Array.isArray(arr)) doc.languages = arr;
            else doc.languages = languages.split(',').map((s) => s.trim());
          } catch {
            doc.languages = languages.split(',').map((s) => s.trim());
          }
        } else if (Array.isArray(languages)) {
          doc.languages = languages;
        }
      }

      if (consultationFee !== undefined) {
        const feeNum = parseFloat(consultationFee);
        if (!isNaN(feeNum) && feeNum >= 0) {
          doc.consultationFee = feeNum;
        }
      }

      // Handle profileImage upload
      if (req.file) {
        doc.profileImage = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        };
      }

      await doc.save();

      return res.json({
        id: doc._id,
        name: doc.name,
        email: doc.email,
        specialty: doc.specialty,
        phone: doc.phone || '',
        dob: doc.dob ? doc.dob.toISOString().split('T')[0] : '',
        location: doc.location || '',
        slotDateTime: doc.nextAvailable || '',
        maxPatients: doc.availableSlots,
        experience: doc.experience,
        hospitalAffiliation: doc.hospitalAffiliation,
        bio: doc.bio,
        qualifications: doc.qualifications,
        languages: doc.languages,
        consultationFee: doc.consultationFee,
      });
    } catch (err) {
      console.error('PUT /api/medical/doctor/me error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// ----------------- Appointment-related example route -----------------

// GET /api/medical/doctor/:id/appointments
router.get(
  '/doctor/:id/appointments',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      if (req.user?.role !== 'doctor' || req.user.id !== id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const appointments = await Appointment.find({ doctor: id })
        .sort({ date: 1 })
        .exec();
      return res.json({ appointments });
    } catch (err) {
      console.error('GET /api/medical/doctor/:id/appointments error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
