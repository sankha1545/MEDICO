// File: backend/auth/src/utils/notificationScheduler.ts

import cron from 'node-cron';
import Patient from '../models/Patient';
import { sendMail } from './sendMail';
import { sendSmsViaEmail } from './sendSmsViaEmail';

export const startNotificationScheduler = () => {
  // Runs every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] Sending daily notifications...');

    try {
      const patients = await Patient.find({});

      for (const patient of patients) {
        const { email, phone, notificationPreferences, carrierDomain } = patient as any;

        // Email Alerts
        if (notificationPreferences?.email) {
          await sendMail({
            to: email,
            subject: 'Daily Health Reminder',
            text: `Hello ${patient.name}, remember to check your MedicoX dashboard for updates.`,
          });
        }

        // SMS Alerts via Email
        if (notificationPreferences?.sms && phone && carrierDomain) {
          await sendSmsViaEmail({
            toPhoneNumber: phone,
            carrierDomain,
            message: `Hi ${patient.name}, check your MedicoX portal today.`,
          });
        }
      }

      console.log('[Scheduler] Notifications sent successfully.');
    } catch (err) {
      console.error('[Scheduler Error]', err);
    }
  });
};
