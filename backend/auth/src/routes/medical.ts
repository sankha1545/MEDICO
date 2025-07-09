// File: backend/src/routes/medical.ts

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import Doctor, { IDoctor } from '../models/Doctor';
import Appointment from '../models/Appointment';
import Patient from '../models/Patient';

dotenv.config();
const router = express.Router();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// --- Auth middleware -------------------------------------------------------
interface AuthRequest extends Request {
  user?: { id: string; role: 'doctor' | 'patient' };
}

async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
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
      if (!doc)   return res.status(401).json({ message: 'Doctor not found' });
      if (!doc.isActive) return res.status(403).json({ message: 'Account deactivated' });
      req.user = { id: doc._id.toString(), role: 'doctor' };
    }
    else if (role === 'patient') {
      const pat = await Patient.findById(id);
      if (!pat)   return res.status(401).json({ message: 'Patient not found' });
      if (!pat.isActive) return res.status(403).json({ message: 'Account deactivated' });
      req.user = { id: pat._id.toString(), role: 'patient' };
    }
    else {
      return res.status(403).json({ message: 'Unknown role' });
    }
    next();
  } catch (err) {
    console.error('authMiddleware DB error:', err);
    res.status(500).json({ message: 'Authentication failed' });
  }
}

// --- Multer for photo uploads (field name = "photo") ----------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

// --- Helper to shape doctor for public listing ---------------------------
function sanitizeDoctor(doc: IDoctor) {
  const now = new Date();
  const slotsIso = Array.isArray(doc.availabilitySlots)
    ? doc.availabilitySlots.map(d => (d instanceof Date ? d.toISOString() : String(d)))
    : [];
  const future = slotsIso
    .map(s => new Date(s))
    .filter(d => d > now)
    .sort((a, b) => a.getTime() - b.getTime());
  return {
    id: doc._id,
    name: doc.name,
    specialty: doc.specialty || '',
    experience: doc.experience || '',
    hospitalAffiliation: doc.hospitalAffiliation || '',
    location: typeof doc.location === 'string'
      ? doc.location
      : doc.locationObj?.address || '',
    availabilitySlots: slotsIso,
    consultationFee: doc.consultationFee ?? 0,
    rating: doc.rating ?? 0,
    reviewCount: doc.reviewCount ?? 0,
    availableSlotsCount: future.length,
    nextAvailable: future[0]?.toISOString() || null,
    nextSlots: future.slice(0, 3).map(d => d.toISOString()),
    profileImageUrl: `/api/medical/doctor/${doc._id}/profile-image`,
  };
}

// --------- Public Routes --------------------------------------------------

// GET specialties
router.get('/specialties', (_req, res) => {
  res.json({ specialties: [
    'Cardiology','Dermatology','Neurology','Oncology',
    'Pediatrics','Psychiatry','Radiology','Urology',
    'Orthopedics','Gastroenterology',
  ] });
});

// GET doctors (with filter/pagination)
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
    const docs  = await Doctor.find(filter)
      .sort({ rating: -1, reviewCount: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      page: pageNum,
      limit: limitNum,
      total,
      doctors: docs.map(sanitizeDoctor),
    });
  } catch (err) {
    console.error('GET /doctors error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single doctor by id
router.get('/doctors/:id', async (req, res) => {
  try {
    const doc = await Doctor.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Doctor not found' });

    const now = new Date();
    const slotsIso = Array.isArray(doc.availabilitySlots)
      ? doc.availabilitySlots.map(d => (d instanceof Date ? d.toISOString() : String(d)))
      : [];
    const future = slotsIso
      .map(s => new Date(s))
      .filter(d => d > now)
      .sort((a, b) => a.getTime() - b.getTime());
    const nextSlots = future.slice(0, 5).map(d => d.toISOString());

    res.json({
      id: doc._id,
      name: doc.name,
      email: doc.email || '',
      specialty: doc.specialty || '',
      experience: doc.experience || '',
      hospitalAffiliation: doc.hospitalAffiliation || '',
      location: typeof doc.location === 'string'
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
    res.status(500).json({ message: 'Server error' });
  }
});

// GET profile image
router.get('/doctor/:id/profile-image', async (req, res) => {
  try {
    const doc = await Doctor.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Doctor not found' });
    const img = (doc as any).profileImage;
    if (img?.data) {
      res.type(img.contentType || 'image/jpeg');
      return res.send(img.data);
    }
    res.status(404).json({ message: 'No profile image' });
  } catch (err) {
    console.error('GET /doctor/:id/profile-image error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --------- Authenticated Doctor Routes ------------------------------------

// GET my profile
router.get('/doctor/me', authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Access denied: not a doctor' });
  }

  try {
    const doc = await Doctor.findById(req.user.id);
    if (!doc) return res.status(404).json({ message: 'Doctor profile not found' });

    const now = new Date();
    const slotsIso = Array.isArray(doc.availabilitySlots)
      ? doc.availabilitySlots.map(d => (d instanceof Date ? d.toISOString() : String(d)))
      : [];
    const future = slotsIso
      .map(s => new Date(s))
      .filter(d => d > now)
      .sort((a, b) => a.getTime() - b.getTime());
    const nextSlots = future.slice(0, 5).map(d => d.toISOString());

    return res.json({
      id: doc._id,
      name: doc.name,
      email: doc.email,
      specialty: doc.specialty || '',
      phone: doc.phone || '',
      dob: doc.dob ? doc.dob.toISOString().split('T')[0] : '',
      location: typeof doc.location === 'string'
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
router.get('/doctor/me/profile-image', authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const doc = await Doctor.findById(req.user.id);
    if (!doc) return res.status(404).json({ message: 'Doctor profile not found' });
    const img = (doc as any).profileImage;
    if (img?.data) {
      res.type(img.contentType || 'image/jpeg');
      return res.send(img.data);
    }
    res.status(404).json({ message: 'No profile image' });
  } catch (err) {
    console.error('GET /doctor/me/profile-image error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT (upsert) my profile
router.put(
  '/doctor/me',
  authMiddleware,
  upload.single('photo'),
  async (req: AuthRequest, res) => {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }
    try {
      const doc = await Doctor.findById(req.user.id);
      if (!doc) return res.status(404).json({ message: 'Doctor profile not found' });

      // Destructure and assign all incoming fields...
      const {
        name, email, specialty, phone, dob,
        locationObj, availabilitySlots,
        maxPatients, experience, hospitalAffiliation,
        bio, qualifications, languages, consultationFee,
      } = req.body;

      if (name               !== undefined) doc.name               = name;
      if (email              !== undefined) doc.email              = email;
      if (specialty          !== undefined) doc.specialty          = specialty;
      if (phone              !== undefined) doc.phone              = phone;
      if (dob) {
        const d = new Date(dob);
        if (!isNaN(d.getTime())) doc.dob = d;
      }

      // locationObj JSON → object
      if (locationObj) {
        try {
          const loc = typeof locationObj === 'string'
            ? JSON.parse(locationObj)
            : locationObj;
          if (loc.address && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
            doc.locationObj  = loc;
            doc.location     = loc.address;
          }
        } catch {}
      }

      // availabilitySlots JSON → Date[]
      if (availabilitySlots) {
        try {
          const arr = typeof availabilitySlots === 'string'
            ? JSON.parse(availabilitySlots)
            : availabilitySlots;
          if (Array.isArray(arr)) {
            doc.availabilitySlots = arr
              .map((s: string) => new Date(s))
              .filter((d: Date) => !isNaN(d.getTime()));
          }
        } catch {}
      }

      if (maxPatients        !== undefined) {
        const mp = parseInt(String(maxPatients), 10);
        if (!isNaN(mp) && mp >= 1) doc.maxPatients = mp;
      }
      if (experience         !== undefined) doc.experience         = experience;
      if (hospitalAffiliation!== undefined) doc.hospitalAffiliation= hospitalAffiliation;
      if (bio                !== undefined) doc.bio                = bio;

      // qualifications
      if (qualifications) {
        try {
          const arr = typeof qualifications === 'string'
            ? JSON.parse(qualifications)
            : qualifications;
          doc.qualifications = Array.isArray(arr)
            ? arr.map(String)
            : String(qualifications).split(',').map(s => s.trim());
        } catch {
          doc.qualifications = String(qualifications).split(',').map(s => s.trim());
        }
      }

      // languages
      if (languages) {
        try {
          const arr = typeof languages === 'string'
            ? JSON.parse(languages)
            : languages;
          doc.languages = Array.isArray(arr)
            ? arr.map(String)
            : String(languages).split(',').map(s => s.trim());
        } catch {
          doc.languages = String(languages).split(',').map(s => s.trim());
        }
      }

      if (consultationFee !== undefined) {
        const cf = parseFloat(String(consultationFee));
        if (!isNaN(cf) && cf >= 0) doc.consultationFee = cf;
      }

      // save uploaded photo
      if (req.file) {
        (doc as any).profileImage = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        };
      }

      await doc.save();

      // Build response
      const now2 = new Date();
      const slotsIso2 = Array.isArray(doc.availabilitySlots)
        ? doc.availabilitySlots.map(d => d.toISOString())
        : [];

      return res.json({
        id: doc._id,
        name: doc.name,
        email: doc.email,
        specialty: doc.specialty || '',
        phone: doc.phone || '',
        dob: doc.dob ? doc.dob.toISOString().split('T')[0] : '',
        location: typeof doc.location === 'string'
          ? doc.location
          : doc.locationObj?.address || '',
        locationObj: doc.locationObj || null,
        availabilitySlots: slotsIso2,
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
router.delete('/doctor/me', authMiddleware, async (req: AuthRequest, res) => {
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
});

// GET my appointments
router.get('/doctor/:id/appointments', authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user || req.user.role !== 'doctor' || req.user.id !== req.params.id) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const appointments = await Appointment.find({ doctor: req.params.id }).sort({ date: 1 });
    return res.json({ appointments });
  } catch (err) {
    console.error('GET /doctor/:id/appointments error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
