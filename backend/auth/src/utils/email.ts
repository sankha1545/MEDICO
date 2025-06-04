// utils/email.ts
import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export default async function sendMail({ to, subject, text, html }: MailOptions) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,         // e.g. "smtp.gmail.com"
    port: Number(process.env.SMTP_PORT), // 587
    secure: (process.env.SMTP_SECURE === 'true'),
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
    tls: {
      rejectUnauthorized: false, // for self-signed certs
    },
  });

  const mailData = {
    from: `"MedBook OTP" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  };

  try {
    const info = await transporter.sendMail(mailData);
    console.log('✉️  Mail sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('🚨  Error sending mail:', err);
    throw err;
  }
}
