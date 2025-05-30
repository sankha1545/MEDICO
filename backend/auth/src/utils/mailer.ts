import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // allow self-signed certs if your local server uses them
    rejectUnauthorized: false,
  },
});

export async function sendOtpEmail(to: string, code: string) {
  await transporter.sendMail({
    from: `"MedBook" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your MedBook OTP Code',
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
  });
}
