"use strict";
// File: backend/auth/src/utils/notificationScheduler.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startNotificationScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Patient_1 = __importDefault(require("../models/Patient"));
const sendMail_1 = require("./sendMail");
const sendSMSViaEmail_1 = require("./sendSMSViaEmail");
const startNotificationScheduler = () => {
    // Runs every day at 9:00 AM
    node_cron_1.default.schedule('0 9 * * *', async () => {
        console.log('[Scheduler] Sending daily notifications...');
        try {
            const patients = await Patient_1.default.find({});
            for (const patient of patients) {
                const { email, phone, notificationPreferences, carrierDomain } = patient;
                // Email Alerts
                if (notificationPreferences?.email) {
                    await (0, sendMail_1.sendMail)({
                        to: email,
                        subject: 'Daily Health Reminder',
                        text: `Hello ${patient.name}, remember to check your MedicoX dashboard for updates.`,
                    });
                }
                // SMS Alerts via Email
                if (notificationPreferences?.sms && phone && carrierDomain) {
                    await (0, sendSMSViaEmail_1.sendSmsViaEmail)({
                        toPhoneNumber: phone,
                        carrierDomain,
                        message: `Hi ${patient.name}, check your MedicoX portal today.`,
                    });
                }
            }
            console.log('[Scheduler] Notifications sent successfully.');
        }
        catch (err) {
            console.error('[Scheduler Error]', err);
        }
    });
};
exports.startNotificationScheduler = startNotificationScheduler;
