// File: backend/src/utils/email.ts

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

interface Attachment {
  filename: string;
  content: Buffer | string;
  path?: string;
}

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Attachment[];
}

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  OTP_EXPIRY_MINUTES = '10',
  SERVER_TIMEZONE = 'UTC',
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn('⚠️ Missing SMTP configuration. Emails will likely fail.');
}

const transporter = nodemailer.createTransport({
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
export async function sendMail({ to, subject, text, html, attachments }: MailOptions) {
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
  } catch (err: any) {
    console.error(`❌ Failed to send email to ${to}:`, err);
    throw new Error(`Email to ${to} failed: ${err.message || err}`);
  }
}

// ------------------------ OTP EMAILS ------------------------

export async function sendOtpEmail(
  email: string,
  code: string,
  purpose: 'signup' | 'reset' | 'emailChange'
) {
  const subjectMap = {
    signup: 'Your MedicoX Signup Verification Code',
    reset: 'Your MedicoX Password Reset Code',
    emailChange: 'Your MedicoX Email Change Verification Code',
  };

  const subject = subjectMap[purpose] || 'MedicoX Verification Code';
  const text = `Your code is ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;

  return sendMail({ to: email, subject, text });
}

// ------------------------ APPOINTMENT REMINDER ------------------------

export async function sendAppointmentReminderEmail(
  patientEmail: string,
  doctorName: string,
  appointmentDateTime: string | Date,
  appointmentLink?: string
) {
  const dt = typeof appointmentDateTime === 'string' ? new Date(appointmentDateTime) : appointmentDateTime;

  const formatted = dt.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: SERVER_TIMEZONE,
  });

  const subject = `⏰ Reminder: Appointment with Dr. ${doctorName}`;
  let html = `<p>Your appointment with <strong>Dr. ${doctorName}</strong> is on <strong>${formatted}</strong>.</p>`;
  if (appointmentLink) html += `<p><a href="${appointmentLink}">View Appointment</a></p>`;
  html += `<p>Thanks for using MedicoX.</p>`;

  const text = `Appointment with Dr. ${doctorName} on ${formatted}.${appointmentLink ? ' View: ' + appointmentLink : ''}`;

  return sendMail({ to: patientEmail, subject, text, html });
}

// ------------------------ PRESCRIPTION EMAIL ------------------------

export async function sendPrescriptionEmail(
  patientEmail: string,
  doctorName: string,
  pdfBuffer: Buffer
) {
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

// ------------------------ MESSAGE EMAIL ------------------------

export async function sendDoctorMessageEmail(
  patientEmail: string,
  doctorName: string,
  messagePreview: string,
  messageLink: string
) {
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

// ------------------------ PROMOTIONAL EMAIL ------------------------

export async function sendPromotionalEmail(to: string, promoSubject: string, promoHtml: string) {
  const text = promoHtml.replace(/<[^>]+>/g, '');
  return sendMail({ to, subject: promoSubject, text, html: promoHtml });
}

// ------------------------ NOTIFICATION EMAIL ------------------------

export async function sendNotificationEmail(
  to: string,
  title: string,
  body: string,
  htmlBody?: string
) {
  return sendMail({ to, subject: title, text: body, html: htmlBody });
}
