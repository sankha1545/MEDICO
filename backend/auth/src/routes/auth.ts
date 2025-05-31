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
  console.log("Sending OTP to: ", email);
  if (!email) return res.status(400).json({ message: 'Email required' });

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);

  await Otp.findOneAndDelete({ email });
  await new Otp({ email, code, expiresAt }).save();

  await sendMail({
    to: email,
    subject: 'Your MedBook Verification Code',
    text: `Your verification code is ${code}. It expires in ${OTP_EXPIRY_MIN} minutes.`
  });

  res.sendStatus(200);
});

// Verify OTP
router.post('/verify-email-otp', async (req, res) => {
  const { email, otp } = req.body;
  const record = await Otp.findOne({ email, code: otp });
  if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });

  await Otp.deleteOne({ _id: record._id });
  res.sendStatus(200);
});

// Signup
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already in use' });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  await new User({ name, email, passwordHash, role }).save();

  res.sendStatus(201);
  
});

export default router;