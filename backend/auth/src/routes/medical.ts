// File: src/routes/medical.ts

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

// --------- Auth middleware (JWT) ---------
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'doctor' | 'patient';
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

    if (role === 'doctor') {
      const doc = await Doctor.findById(userId).exec();
      if (!doc) {
        return res.status(401).json({ message: 'Doctor not found' });
      }
      if (!doc.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }
      req.user = { id: doc._id.toString(), role: 'doctor' };
    } else if (role === 'patient') {
      const pat = await Patient.findById(userId).exec();
      if (!pat) {
        return res.status(401).json({ message: 'Patient not found' });
      }
      if (!pat.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }
      req.user = { id: pat._id.toString(), role: 'patient' };
    } else {
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// --------- Helper: sanitize doctor for public listing ---------
// Returns: id, name, specialty, experience, hospitalAffiliation, location,
// availabilitySlots ISO[], consultationFee, rating, reviewCount,
// availableSlotsCount, nextAvailable, nextSlots, profileImageUrl.
function sanitizeDoctor(doc: IDoctor): any {
  const now = new Date();
  const slotsIso: string[] = Array.isArray(doc.availabilitySlots)
    ? doc.availabilitySlots
        .map(d => {
          if (d instanceof Date && !isNaN(d.getTime())) {
            return d.toISOString();
          }
          if (typeof d === 'string') {
            const dt = new Date(d);
            if (!isNaN(dt.getTime())) {
              return dt.toISOString();
            }
            return d;
          }
          return '';
        })
        .filter(s => !!s)
    : [];

  const futureDates: Date[] = slotsIso
    .map(s => new Date(s))
    .filter(d => !isNaN(d.getTime()) && d > now)
    .sort((a, b) => a.getTime() - b.getTime());

  const availableSlotsCount = futureDates.length;
  const nextAvailable = futureDates.length > 0 ? futureDates[0].toISOString() : null;
  const nextSlots = futureDates.slice(0, 3).map(d => d.toISOString());

  const locationStr =
    typeof doc.location === 'string' && doc.location
      ? doc.location
      : doc.locationObj?.address || '';

  const profileImageUrl = `/api/medical/doctor/${doc._id}/profile-image`;

  return {
    id: doc._id,
    name: doc.name,
    specialty: doc.specialty || '',
    experience: doc.experience || '',
    hospitalAffiliation: doc.hospitalAffiliation || '',
    location: locationStr,
    availabilitySlots: slotsIso,
    consultationFee: doc.consultationFee ?? 0,
    rating: doc.rating ?? 0,
    reviewCount: doc.reviewCount ?? 0,
    availableSlotsCount,
    nextAvailable,
    nextSlots,
    profileImageUrl,
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
router.get('/doctors', async (req: Request, res: Response) => {
  try {
    const { specialty, search, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const filter: any = { isActive: true };
    if (specialty && typeof specialty === 'string' && specialty.trim() !== '') {
      filter.specialty = specialty;
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      filter.name = { $regex: search, $options: 'i' };
    }
    const skip = (pageNum - 1) * limitNum;
    const total = await Doctor.countDocuments(filter).exec();
    const docs = await Doctor.find(filter)
      .sort({ rating: -1, reviewCount: -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();
    const sanitized = docs.map(d => sanitizeDoctor(d));
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
    // availabilitySlots ISO[]
    const slotsIso: string[] = Array.isArray(doc.availabilitySlots)
      ? doc.availabilitySlots
          .map(d => {
            if (d instanceof Date && !isNaN(d.getTime())) {
              return d.toISOString();
            }
            if (typeof d === 'string') {
              const dt = new Date(d);
              if (!isNaN(dt.getTime())) {
                return dt.toISOString();
              }
              return d;
            }
            return '';
          })
          .filter(s => !!s)
      : [];
    // nextSlots up to 5
    const now = new Date();
    const futureDates: Date[] = slotsIso
      .map(s => new Date(s))
      .filter(d => !isNaN(d.getTime()) && d > now)
      .sort((a, b) => a.getTime() - b.getTime());
    const nextSlots = futureDates.slice(0, 5).map(d => d.toISOString());

    const locationStr =
      typeof doc.location === 'string' && doc.location
        ? doc.location
        : doc.locationObj?.address || '';
    const profileImageUrl = `/api/medical/doctor/${doc._id}/profile-image`;

    return res.json({
      id: doc._id,
      name: doc.name,
      email: doc.email || '',
      specialty: doc.specialty || '',
      experience: doc.experience || '',
      hospitalAffiliation: doc.hospitalAffiliation || '',
      location: locationStr,
      availabilitySlots: slotsIso,
      nextSlots,
      consultationFee: doc.consultationFee ?? 0,
      bio: doc.bio || '',
      qualifications: doc.qualifications || [],
      languages: doc.languages || [],
      rating: doc.rating ?? 0,
      reviewCount: doc.reviewCount ?? 0,
      profileImageUrl,
    });
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
    if ((doc as any).profileImage && (doc as any).profileImage.data) {
      res.set('Content-Type', (doc as any).profileImage.contentType || 'image/jpeg');
      return res.send((doc as any).profileImage.data);
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
    const slotsIso: string[] = Array.isArray(doc.availabilitySlots)
      ? doc.availabilitySlots
          .map(d => {
            if (d instanceof Date && !isNaN(d.getTime())) {
              return d.toISOString();
            }
            if (typeof d === 'string') {
              const dt = new Date(d);
              if (!isNaN(dt.getTime())) {
                return dt.toISOString();
              }
              return d;
            }
            return '';
          })
          .filter(s => !!s)
      : [];
    const now = new Date();
    const futureDates: Date[] = slotsIso
      .map(s => new Date(s))
      .filter(d => !isNaN(d.getTime()) && d > now)
      .sort((a, b) => a.getTime() - b.getTime());
    const nextSlots = futureDates.slice(0, 5).map(d => d.toISOString());

    const locationStr =
      typeof doc.location === 'string' && doc.location
        ? doc.location
        : doc.locationObj?.address || '';
    const profileImageUrl = `/api/medical/doctor/${doc._id}/profile-image`;

    return res.json({
      id: doc._id,
      name: doc.name,
      email: doc.email,
      specialty: doc.specialty || '',
      phone: doc.phone || '',
      dob: doc.dob ? doc.dob.toISOString().split('T')[0] : '',
      location: locationStr,
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
      profileImageUrl,
    });
  } catch (err) {
    console.error('GET /api/medical/doctor/me error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/medical/doctor/me/profile-image
router.get('/doctor/me/profile-image', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied: not a doctor' });
    }
    const doc = await Doctor.findById(req.user.id).exec();
    if (!doc) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    if ((doc as any).profileImage && (doc as any).profileImage.data) {
      res.set('Content-Type', (doc as any).profileImage.contentType || 'image/jpeg');
      return res.send((doc as any).profileImage.data);
    } else {
      return res.status(404).json({ message: 'No profile image' });
    }
  } catch (err) {
    console.error('GET /api/medical/doctor/me/profile-image error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

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

      if (name !== undefined) doc.name = name;
      if (email !== undefined) doc.email = email;
      if (specialty !== undefined) doc.specialty = specialty;
      if (phone !== undefined) doc.phone = phone;
      if (dob) {
        const dt = new Date(dob);
        if (!isNaN(dt.getTime())) {
          doc.dob = dt;
        }
      }

      if (locationObj) {
        try {
          const locParsed =
            typeof locationObj === 'string' ? JSON.parse(locationObj) : locationObj;
          if (
            locParsed &&
            typeof locParsed.lat === 'number' &&
            typeof locParsed.lng === 'number' &&
            typeof locParsed.address === 'string'
          ) {
            doc.locationObj = {
              lat: locParsed.lat,
              lng: locParsed.lng,
              address: locParsed.address,
            };
            doc.location = locParsed.address;
          }
        } catch (e) {
          console.warn('Invalid locationObj format in PUT /doctor/me:', e);
        }
      }

      if (availabilitySlots) {
        try {
          const slotsParsed =
            typeof availabilitySlots === 'string'
              ? JSON.parse(availabilitySlots)
              : availabilitySlots;
          if (Array.isArray(slotsParsed)) {
            const dateArr: Date[] = [];
            for (const s of slotsParsed) {
              const d = new Date(s);
              if (!isNaN(d.getTime())) {
                dateArr.push(d);
              }
            }
            doc.availabilitySlots = dateArr;
          }
        } catch (e) {
          console.warn('Invalid availabilitySlots format in PUT /doctor/me:', e);
        }
      }

      if (maxPatients !== undefined) {
        const mpNum = parseInt(maxPatients as string, 10);
        if (!isNaN(mpNum) && mpNum >= 1) {
          doc.maxPatients = mpNum;
        }
      }

      if (experience !== undefined) doc.experience = experience;
      if (hospitalAffiliation !== undefined) doc.hospitalAffiliation = hospitalAffiliation;
      if (bio !== undefined) doc.bio = bio;

      if (qualifications !== undefined) {
        if (typeof qualifications === 'string') {
          try {
            const arr = JSON.parse(qualifications);
            if (Array.isArray(arr)) {
              doc.qualifications = arr;
            } else {
              doc.qualifications = (qualifications as string)
                .split(',')
                .map((s: string) => s.trim())
                .filter(s => !!s);
            }
          } catch {
            doc.qualifications = (qualifications as string)
              .split(',')
              .map((s: string) => s.trim())
              .filter(s => !!s);
          }
        } else if (Array.isArray(qualifications)) {
          doc.qualifications = qualifications;
        }
      }

      if (languages !== undefined) {
        if (typeof languages === 'string') {
          try {
            const arr = JSON.parse(languages);
            if (Array.isArray(arr)) {
              doc.languages = arr;
            } else {
              doc.languages = (languages as string)
                .split(',')
                .map((s: string) => s.trim())
                .filter(s => !!s);
            }
          } catch {
            doc.languages = (languages as string)
              .split(',')
              .map((s: string) => s.trim())
              .filter(s => !!s);
          }
        } else if (Array.isArray(languages)) {
          doc.languages = languages;
        }
      }

      // Debug log incoming consultationFee
      console.log('PUT /doctor/me - incoming consultationFee:', consultationFee);

      if (consultationFee !== undefined) {
        const feeNum = parseFloat(consultationFee as string);
        if (!isNaN(feeNum) && feeNum >= 0) {
          doc.consultationFee = feeNum;
        } else {
          console.warn('Invalid consultationFee value:', consultationFee);
        }
      }

      if (req.file) {
        (doc as any).profileImage = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        };
      }

      await doc.save();

      // Return updated profile including profileImageUrl
      const slotsIso: string[] = Array.isArray(doc.availabilitySlots)
        ? doc.availabilitySlots
            .map(d => {
              if (d instanceof Date && !isNaN(d.getTime())) {
                return d.toISOString();
              }
              if (typeof d === 'string') {
                const dt = new Date(d);
                if (!isNaN(dt.getTime())) {
                  return dt.toISOString();
                }
                return d;
              }
              return '';
            })
            .filter(s => !!s)
        : [];
      const locationStr =
        typeof doc.location === 'string' && doc.location
          ? doc.location
          : doc.locationObj?.address || '';
      const profileImageUrl = `/api/medical/doctor/${doc._id}/profile-image`;

      return res.json({
        id: doc._id,
        name: doc.name,
        email: doc.email,
        specialty: doc.specialty || '',
        phone: doc.phone || '',
        dob: doc.dob ? doc.dob.toISOString().split('T')[0] : '',
        location: locationStr,
        locationObj: doc.locationObj || null,
        availabilitySlots: slotsIso,
        maxPatients: doc.maxPatients,
        experience: doc.experience,
        hospitalAffiliation: doc.hospitalAffiliation,
        bio: doc.bio,
        qualifications: doc.qualifications || [],
        languages: doc.languages || [],
        consultationFee: doc.consultationFee ?? 0,
        profileImageUrl,
      });
    } catch (err) {
      console.error('PUT /api/medical/doctor/me error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

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
      const appointments = await Appointment.find({ doctor: id }).sort({ date: 1 }).exec();
      return res.json({ appointments });
    } catch (err) {
      console.error('GET /api/medical/doctor/:id/appointments error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
