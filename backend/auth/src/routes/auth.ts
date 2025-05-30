import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import Otp from '../models/Otp';
import { sendOtpEmail } from '../utils/mailer';

const router = Router();

// 1) Signup → send OTP
router.post('/signup', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  // generate 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // upsert OTP record
  await Otp.findOneAndUpdate(
    { email },
    { code, expiresAt },
    { upsert: true, new: true }
  );

  await sendOtpEmail(email, code);
  res.json({ message: 'OTP sent' });
});

// 2) Complete signup with name, pass, role, otp
router.post('/complete-signup', async (req, res) => {
  const { name, email, password, role, otp } = req.body;
  if (!name || !email || !password || !role || !otp) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  // verify OTP
  const record = await Otp.findOne({ email, code: otp });
  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // hash password & create user
  const hashed = await bcrypt.hash(password, 12);
  const user = new User({ name, email, password: hashed, role, isVerified: true });
  await user.save();

  // cleanup OTP
  await Otp.deleteOne({ _id: record._id });

  // optional: issue JWT
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });

  res.json({ message: 'Signup complete', token });
});

export default router;
