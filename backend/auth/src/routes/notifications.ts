// File: backend/src/routes/notifications.ts

import express, { Router, Request, Response } from 'express';
import { authenticateJWT } from './auth';
import Patient, { IPatient } from '../models/Patient';

const router: Router = express.Router();

/**
 * GET /api/notifications/preferences
 * Returns the logged-in patient’s notification settings.
 */
router.get('/preferences', authenticateJWT, async (req: Request, res: Response) => {
  const user = (req as any).user as IPatient;
  try {
    const prefs = user.notificationSettings || {};
    return res.json({ notificationSettings: prefs });
  } catch (err) {
    console.error('Error fetching notification preferences:', err);
    return res.status(500).json({ message: 'Failed to fetch preferences' });
  }
});

/**
 * PUT /api/notifications/preferences
 * Body: {
 *   emailAppointments?: boolean;
 *   emailDoctorMessages?: boolean;
 *   emailPromotions?: boolean;
 *   smsAlerts?: boolean;
 *   smsPhone?: string;
 *   smsCarrierDomain?: string;
 *   inAppNotifications?: boolean;
 * }
 * Updates the logged-in patient’s notification settings.
 */
router.put('/preferences', authenticateJWT, async (req: Request, res: Response) => {
  const user = (req as any).user as IPatient;
  const {
    emailAppointments,
    emailDoctorMessages,
    emailPromotions,
    smsAlerts,
    smsPhone,
    smsCarrierDomain,
    inAppNotifications,
  } = req.body as {
    emailAppointments?: boolean;
    emailDoctorMessages?: boolean;
    emailPromotions?: boolean;
    smsAlerts?: boolean;
    smsPhone?: string;
    smsCarrierDomain?: string;
    inAppNotifications?: boolean;
  };

  try {
    const settings = user.notificationSettings || {};
    if (typeof emailAppointments === 'boolean') {
      settings.emailAppointments = emailAppointments;
    }
    if (typeof emailDoctorMessages === 'boolean') {
      settings.emailDoctorMessages = emailDoctorMessages;
    }
    if (typeof emailPromotions === 'boolean') {
      settings.emailPromotions = emailPromotions;
    }
    if (typeof smsAlerts === 'boolean') {
      settings.smsAlerts = smsAlerts;
    }
    if (typeof smsPhone === 'string') {
      settings.smsPhone = smsPhone.trim();
    }
    if (typeof smsCarrierDomain === 'string') {
      settings.smsCarrierDomain = smsCarrierDomain.trim();
    }
    if (typeof inAppNotifications === 'boolean') {
      settings.inAppNotifications = inAppNotifications;
    }
    user.notificationSettings = settings;
    await user.save();
    return res.json({ notificationSettings: settings });
  } catch (err) {
    console.error('Error updating notification preferences:', err);
    return res.status(500).json({ message: 'Failed to update preferences' });
  }
});

export default router;
