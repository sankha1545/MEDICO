// File: backend/auth/src/utils/sendMail.ts

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface MailOptions {
  to: string;
  subject: string;
  text: string;
}

export const sendMail = async ({ to, subject, text }: MailOptions) => {
  await transporter.sendMail({
    from: `"MedicoX Alerts" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
};
