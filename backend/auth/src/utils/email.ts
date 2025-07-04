// File: backend/src/utils/email.ts

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  NODE_ENV,
  OTP_EXPIRY_MINUTES = '10',
  SERVER_TIMEZONE = 'UTC',
} = process.env;

// Validate required env vars at startup
if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn('⚠️ Missing SMTP configuration. Email functionality may fail.');
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE === 'true',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Generic sendMail function.
 * Usage: await sendMail({ to, subject, text, html });
 */
export async function sendMail({ to, subject, text, html }: MailOptions) {
  const mailData: any = {
    from: `MedBook <${SMTP_USER}>`,
    to,
    subject,
    text,
  };
  if (html) mailData.html = html;

  try {
    const info = await transporter.sendMail(mailData);
    console.log(`📤 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err: any) {
    console.error(`🚨 Email send error to ${to}:`, err.message || err);
    throw new Error('Failed to send email. Please check SMTP settings.');
  }
}

/**
 * Send OTP email for signup, reset, or email change.
 */
export async function sendOtpEmail(
  email: string,
  code: string,
  purpose: 'signup' | 'reset' | 'emailChange'
) {
  let subject: string;
  let text: string;

  switch (purpose) {
    case 'signup':
      subject = 'Your MedBook Signup Verification Code';
      text = `Welcome to MedBook! Your code is ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;
      break;
    case 'reset':
      subject = 'Your MedBook Password Reset Code';
      text = `You requested a password reset. Your code is ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;
      break;
    case 'emailChange':
      subject = 'Your MedBook Email Change Verification Code';
      text = `You requested to change your email. Code: ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;
      break;
    default:
      subject = 'Your MedBook Verification Code';
      text = `Your verification code is ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;
  }

  return sendMail({ to: email, subject, text });
}

/**
 * Appointment Reminder Email
 */
export async function sendAppointmentReminderEmail(
  patientEmail: string,
  doctorName: string,
  appointmentDateTime: string | Date,
  appointmentLink?: string
) {
  const dt = typeof appointmentDateTime === 'string'
    ? new Date(appointmentDateTime)
    : appointmentDateTime;

  const formatted = dt.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: SERVER_TIMEZONE,
  });

  const subject = `Reminder: Appointment with Dr. ${doctorName}`;
  let text = `You have an appointment with Dr. ${doctorName} on ${formatted}.`;
  let html = `<p>Your appointment with <strong>Dr. ${doctorName}</strong> is scheduled for <strong>${formatted}</strong>.</p>`;

  if (appointmentLink) {
    text += ` View details: ${appointmentLink}`;
    html += `<p><a href="${appointmentLink}">View appointment</a></p>`;
  }

  html += `<p>Thank you for using MedBook!</p>`;

  return sendMail({ to: patientEmail, subject, text, html });
}

/**
 * Doctor Message Email
 */
export async function sendDoctorMessageEmail(
  patientEmail: string,
  doctorName: string,
  messagePreview: string,
  messageLink: string
) {
  const subject = `New Message from Dr. ${doctorName}`;
  const text = `Dr. ${doctorName} sent: "${messagePreview}". View: ${messageLink}`;
  const html = `
    <p><strong>Dr. ${doctorName}</strong> sent you a message:</p>
    <blockquote>${messagePreview}</blockquote>
    <p><a href="${messageLink}">View full message</a></p>
    <p>Thank you for using MedBook!</p>
  `;

  return sendMail({ to: patientEmail, subject, text, html });
}

/**
 * Promotional Email
 */
export async function sendPromotionalEmail(
  to: string,
  promoSubject: string,
  promoHtml: string
) {
  const text = promoHtml.replace(/<[^>]+>/g, '');
  return sendMail({ to, subject: promoSubject, text, html: promoHtml });
}

/**
 * Generic Notification Email
 */
export async function sendNotificationEmail(
  to: string,
  title: string,
  body: string,
  htmlBody?: string
) {
  return sendMail({ to, subject: title, text: body, html: htmlBody });
}
