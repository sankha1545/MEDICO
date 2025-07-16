// File: backend/src/routes/medicalinfo.ts

import express, { Request, Response } from 'express';
import MedicalInfo from '../models/MedicalInfo';
import { authenticateJWT } from './auth';

const router = express.Router();

/**
 * GET /api/medicalinfo/me
 * — Return the patient's medical info, or 404 if none exists yet.
 */
router.get('/me', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const info = await MedicalInfo.findOne({ user: userId }).lean();
    if (!info) {
      return res.status(404).json({ message: 'No medical info found' });
    }
    return res.json(info);
  } catch (err) {
    console.error('Error fetching medical info:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

/**
 * PUT /api/medicalinfo/me
 * — Upsert the patient’s medical info.
 */
router.put('/me', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { bloodType, allergies, currentMedications, medicalConditions } = req.body;
    const info = await MedicalInfo.findOneAndUpdate(
      { user: userId },
      { bloodType, allergies, currentMedications, medicalConditions },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    return res.json(info);   // returns the raw document
  } catch (err) {
    console.error('Error updating medical info:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

export default router;
