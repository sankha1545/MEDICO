// File: backend/src/routes/medical.ts

import { Router, Request, Response } from 'express';
import MedicalInfo, { IMedicalInfo } from '../models/MedicalInfo';
import User, { IUser } from '../models/User';
import { authenticateJWT } from './Auth';

const router = Router();

/**
 * GET /api/medical
 * Fetch the authenticated user’s medical info.
 * Returns: { medicalInfo: { bloodType, allergies, currentMedications, medicalConditions } }
 */
router.get(
  '/',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      // req.user was set by authenticateJWT
      const user = (req as any).user as IUser;
      // Find medical-info document by user._id
      const record = await MedicalInfo.findOne({ user: user._id }).lean();

      if (!record) {
        // If no record exists, return default empty values
        return res.json({
          medicalInfo: {
            bloodType: '',
            allergies: '',
            currentMedications: '',
            medicalConditions: '',
          },
        });
      }

      // Otherwise, return the found data
      return res.json({
        medicalInfo: {
          bloodType: record.bloodType,
          allergies: record.allergies,
          currentMedications: record.currentMedications,
          medicalConditions: record.medicalConditions,
        },
      });
    } catch (err) {
      console.error('Error fetching medical info:', err);
      return res.status(500).json({ message: 'Failed to fetch medical info' });
    }
  }
);

/**
 * PUT /api/medical
 * Create or update the authenticated user’s medical info.
 * Expects JSON body: { bloodType, allergies, currentMedications, medicalConditions }
 * Returns updated record: { medicalInfo: { ... } }
 */
router.put(
  '/',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as IUser;
      const {
        bloodType,
        allergies,
        currentMedications,
        medicalConditions,
      } = req.body;

      // Validate that all fields are strings (they may be empty)
      if (
        typeof bloodType !== 'string' ||
        typeof allergies !== 'string' ||
        typeof currentMedications !== 'string' ||
        typeof medicalConditions !== 'string'
      ) {
        return res.status(400).json({ message: 'Invalid medical info data' });
      }

      // Try to find an existing record
      let record = await MedicalInfo.findOne({ user: user._id });

      if (!record) {
        // Create new if none exists
        record = new MedicalInfo({
          user: user._id,
          bloodType,
          allergies,
          currentMedications,
          medicalConditions,
        });
      } else {
        // Otherwise, update existing fields
        record.bloodType = bloodType;
        record.allergies = allergies;
        record.currentMedications = currentMedications;
        record.medicalConditions = medicalConditions;
      }

      // Save the document
      const saved = await record.save();

      return res.json({
        medicalInfo: {
          bloodType: saved.bloodType,
          allergies: saved.allergies,
          currentMedications: saved.currentMedications,
          medicalConditions: saved.medicalConditions,
        },
      });
    } catch (err) {
      console.error('Error saving medical info:', err);
      return res.status(500).json({ message: 'Failed to save medical info' });
    }
  }
);

export default router;
