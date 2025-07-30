"use strict";
// File: backend/src/utils/email.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationEmail = exports.sendPromotionalEmail = exports.sendDoctorMessageEmail = exports.sendPrescriptionEmail = exports.sendAppointmentReminderEmail = exports.sendOtpEmail = exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, OTP_EXPIRY_MINUTES = '10', SERVER_TIMEZONE = 'UTC', } = process.env;
if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️ Missing SMTP configuration. Emails will likely fail.');
}
const transporter = nodemailer_1.default.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true',
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
});
/**
 * Generic email sender with attachment support.
 */
async function sendMail({ to, subject, text, html, attachments }) {
    const mailData = {
        from: `MedicoX <${SMTP_USER}>`,
        to,
        subject,
        text,
        html,
        attachments,
    };
    try {
        const info = await transporter.sendMail(mailData);
        console.log(`📧 Email sent to ${to} (ID: ${info.messageId})`);
        return info;
    }
    catch (err) {
        console.error(`❌ Failed to send email to ${to}:`, err);
        throw new Error(`Email to ${to} failed: ${err.message || err}`);
    }
}
exports.sendMail = sendMail;
// ------------------------ OTP EMAILS ------------------------
async function sendOtpEmail(email, code, purpose) {
    const subjectMap = {
        signup: 'Your MedicoX Signup Verification Code',
        reset: 'Your MedicoX Password Reset Code',
        emailChange: 'Your MedicoX Email Change Verification Code',
    };
    const subject = subjectMap[purpose] || 'MedicoX Verification Code';
    const text = `Your code is ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;
    return sendMail({ to: email, subject, text });
}
exports.sendOtpEmail = sendOtpEmail;
// ------------------------ APPOINTMENT REMINDER ------------------------
async function sendAppointmentReminderEmail(patientEmail, doctorName, appointmentDateTime, appointmentLink) {
    const dt = typeof appointmentDateTime === 'string' ? new Date(appointmentDateTime) : appointmentDateTime;
    const formatted = dt.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: SERVER_TIMEZONE,
    });
    const subject = `⏰ Reminder: Appointment with Dr. ${doctorName}`;
    let html = `<p>Your appointment with <strong>Dr. ${doctorName}</strong> is on <strong>${formatted}</strong>.</p>`;
    if (appointmentLink)
        html += `<p><a href="${appointmentLink}">View Appointment</a></p>`;
    html += `<p>Thanks for using MedicoX.</p>`;
    const text = `Appointment with Dr. ${doctorName} on ${formatted}.${appointmentLink ? ' View: ' + appointmentLink : ''}`;
    return sendMail({ to: patientEmail, subject, text, html });
}
exports.sendAppointmentReminderEmail = sendAppointmentReminderEmail;
// ------------------------ PRESCRIPTION EMAIL ------------------------
async function sendPrescriptionEmail(patientEmail, doctorName, pdfBuffer) {
    const subject = `📋 Your Prescription from Dr. ${doctorName}`;
    const text = `Please find attached your digital prescription from Dr. ${doctorName}.`;
    const html = `<p>Please find attached your prescription from <strong>Dr. ${doctorName}</strong>.</p><p>Thank you for using MedicoX!</p>`;
    if (!Buffer.isBuffer(pdfBuffer)) {
        console.warn('⚠️ PDF buffer passed is not valid. Skipping email.');
        throw new Error('Invalid PDF buffer for prescription.');
    }
    return sendMail({
        to: patientEmail,
        subject,
        text,
        html,
        attachments: [
            {
                filename: 'prescription.pdf',
                content: pdfBuffer,
            },
        ],
    });
}
exports.sendPrescriptionEmail = sendPrescriptionEmail;
// ------------------------ MESSAGE EMAIL ------------------------
async function sendDoctorMessageEmail(patientEmail, doctorName, messagePreview, messageLink) {
    const subject = `💬 New Message from Dr. ${doctorName}`;
    const html = `
    <p><strong>Dr. ${doctorName}</strong> sent you a message:</p>
    <blockquote>${messagePreview}</blockquote>
    <p><a href="${messageLink}">View Full Message</a></p>
    <p>— MedicoX</p>
  `;
    const text = `Dr. ${doctorName} sent: "${messagePreview}". Link: ${messageLink}`;
    return sendMail({ to: patientEmail, subject, text, html });
}
exports.sendDoctorMessageEmail = sendDoctorMessageEmail;
// ------------------------ PROMOTIONAL EMAIL ------------------------
async function sendPromotionalEmail(to, promoSubject, promoHtml) {
    const text = promoHtml.replace(/<[^>]+>/g, '');
    return sendMail({ to, subject: promoSubject, text, html: promoHtml });
}
exports.sendPromotionalEmail = sendPromotionalEmail;
// ------------------------ NOTIFICATION EMAIL ------------------------
async function sendNotificationEmail(to, title, body, htmlBody) {
    return sendMail({ to, subject: title, text: body, html: htmlBody });
}
exports.sendNotificationEmail = sendNotificationEmail;
