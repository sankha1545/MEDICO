// File: backend/src/routes/patient.ts

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticateJWT } from './auth';
import Patient from '../models/Patient';
import { AuthRequest } from '../types/AuthRequest';

const router = express.Router();

// --- Multer setup for profile image uploads ---
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files are allowed'));
    }
    cb(null, true);
  },
});

// -----------------------------------------------------------------------------
// GET /api/patients/me
// Fetch authenticated patient's profile, excluding passwordHash + __v
// -----------------------------------------------------------------------------
router.get(
  '/patients/me',
  authenticateJWT,
  async (req: AuthRequest, res: Response) => {
    try {
      const patient = await Patient.findById(req.user._id).select('-passwordHash -__v');
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const result = patient.toJSON();
      result.profileImageUrl = `/api/patients/${patient._id}/avatar`;
      res.json(result);
    } catch (err) {
      console.error('GET /patients/me error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// -----------------------------------------------------------------------------
// PUT /api/patients/me/avatar
// Upload or replace profile image (max 2MB)
// -----------------------------------------------------------------------------
router.put(
  '/patients/me/avatar',
  authenticateJWT,
  upload.single('profileImage'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const patient = await Patient.findById(req.user._id);
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      patient.profileImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
      await patient.save();

      res.json({
        message: 'Avatar uploaded successfully',
        profileImageUrl: `/api/patients/${patient._id}/avatar`,
      });
    } catch (err: any) {
      if (err instanceof multer.MulterError) {
        // Handle file upload errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Max 2MB allowed.' });
        }
        return res.status(400).json({ message: err.message });
      }
      console.error('PUT /patients/me/avatar error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// -----------------------------------------------------------------------------
// GET /api/patients/:id/avatar
// Stream profile image buffer stored in MongoDB
// -----------------------------------------------------------------------------
router.get(
  '/patients/:id/avatar',
  async (req: Request, res: Response) => {
    try {
      const patient = await Patient.findById(req.params.id).select('profileImage');
      if (
        !patient ||
        !patient.profileImage ||
        !patient.profileImage.data
      ) {
        return res.status(404).json({ message: 'Avatar not found' });
      }

      res
        .status(200)
        .set('Content-Type', patient.profileImage.contentType || 'image/png')
        .send(patient.profileImage.data);
    } catch (err) {
      console.error('GET /patients/:id/avatar error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
