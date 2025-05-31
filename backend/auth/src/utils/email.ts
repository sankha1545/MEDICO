// utils/mail.ts
import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail({ to, subject, text, html }: MailOptions) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,         // e.g. "localhost"
    port: Number(process.env.SMTP_PORT), // 25 or 587
    secure: false,                       // allow STARTTLS if hMailServer offers it
    auth: {
      user: process.env.SMTP_USER!,      // e.g. "mailer@localhost.localdomain"
      pass: process.env.SMTP_PASS!,      // the password you set in step 1
    },
    tls: {
      rejectUnauthorized: false,         // in case hMailServer advertises a self-signed cert
    },
  });

  const mailData = {
    from: `"MedBook OTP" <no-reply@localhost.localdomain>`,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  };

  try {
    const info = await transporter.sendMail(mailData);
    console.log('✉️  Mail sent to hMailServer (authenticated). Message ID:', info.messageId);
    return info;
  } catch (err) {
    console.error('🚨  Error sending to hMailServer:', err);
    throw err;
  }
}
