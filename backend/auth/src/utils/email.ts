import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export default async function sendMail({ to, subject, text, html }: MailOptions) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailData = {
    from: `MedBook <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  };

  try {
    const info = await transporter.sendMail(mailData);
    console.log('✉️ Mail sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('🚨 Error sending mail:', err);
    throw err;
  }
}
