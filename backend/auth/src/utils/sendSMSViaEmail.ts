// File: backend/auth/src/utils/sendSmsViaEmail.ts

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

interface SmsOptions {
  toPhoneNumber: string;
  carrierDomain: string;
  message: string;
}

export const sendSmsViaEmail = async ({ toPhoneNumber, carrierDomain, message }: SmsOptions) => {
  const smsEmail = `${toPhoneNumber}@${carrierDomain}`;

  await transporter.sendMail({
    from: `"MedicoX SMS" <${process.env.SMTP_USER}>`,
    to: smsEmail,
    subject: '',
    text: message,
  });
};
