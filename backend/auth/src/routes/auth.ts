// File: backend/src/routes/auth.ts

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User';
import Otp from '../models/Otp';
import { sendMail } from '../utils/email';

const router = Router();
const OTP_EXPIRY_MIN = 10;

// Send OTP
router.post('/send-email-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  // Generate 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);

  // Remove any prior OTP for this email
  await Otp.findOneAndDelete({ email });

  // Save new OTP
  await new Otp({ email, code, expiresAt }).save();

  // Send OTP via email
  try {
    await sendMail({
      to: email,
      subject: 'Your MedBook Verification Code',
      text: `Your verification code is ${code}. It expires in ${OTP_EXPIRY_MIN} minutes.`,
    });
  } catch (err) {
    console.error('Error sending OTP email:', err);
    return res.status(500).json({ message: 'Failed to send OTP email' });
  }

  return res.sendStatus(200);
});

// Verify OTP
router.post('/verify-email-otp', async (req, res) => {
  const { email, otp } = req.body;
  const record = await Otp.findOne({ email, code: otp });

  if (!record) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // OTP is valid—delete it immediately
  await Otp.deleteOne({ _id: record._id });
  return res.sendStatus(200);
});

// Signup
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All signup fields are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  await new User({ name, email, passwordHash, role }).save();

  return res.sendStatus(201);
});

// New: Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  // At this point, credentials are valid. You may choose to return a JWT here.
  // For now, we simply return success.
  return res.sendStatus(200);
});

export default router;
