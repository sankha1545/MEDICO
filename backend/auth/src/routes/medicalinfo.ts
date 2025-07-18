// File: backend/src/routes/medicalinfo.ts

import express, { Request, Response, NextFunction } from 'express';
import MedicalInfo, { IMedicalInfo } from '../models/MedicalInfo';
import { authenticateJWT } from './auth';

const router = express.Router();

/**
 * GET /api/medicalinfo/me
 * — Return the patient's medical info, or 404 if none exists yet.
 */
router.get(
  '/me',
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id as string;
      const info = await MedicalInfo.findOne({ user: userId }).lean();
      if (!info) {
        return res.status(404).json({ message: 'No medical info found' });
      }
      return res.json(info);
    } catch (err) {
      console.error('Error fetching medical info:', err);
      return next(err);
    }
  }
);

/**
 * PUT /api/medicalinfo/me
 * — Upsert the patient’s medical info.
 */
router.put(
  '/me',
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id as string;
      const { bloodType, allergies, currentMedications, medicalConditions } =
        req.body as Partial<IMedicalInfo>;

      const info = await MedicalInfo.findOneAndUpdate(
        { user: userId },
        { bloodType, allergies, currentMedications, medicalConditions },
        {
          new: true,               // return the updated doc
          upsert: true,            // create if not found
          setDefaultsOnInsert: true
        }
      ).lean();

      return res.json(info);
    } catch (err) {
      console.error('Error updating medical info:', err);
      return next(err);
    }
  }
);

export default router;
