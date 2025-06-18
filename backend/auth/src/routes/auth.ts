// File: backend/src/routes/auth.ts

import express, { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import dotenv from 'dotenv';

import Patient, { IPatient } from '../models/Patient';
import Doctor, { IDoctor } from '../models/Doctor';
import Otp from '../models/Otp';
import sendMail from '../utils/email';
import MedicalInfo from '../models/MedicalInfo';
import Appointment from '../models/Appointment';

dotenv.config();
const router: Router = express.Router();

// Constants
const OTP_EXPIRY_MIN = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'yoursecret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Multer setup for profile images (2MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Ensure Google OAuth vars
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.error('❌ Missing Google OAuth environment variables');
  process.exit(1);
}

// Utility: generate and email OTP
async function generateAndSendOtp(email: string, subject: string, textPrefix: string) {
  const code = crypto.randomInt(100000, 999999).toString().padStart(6, '0');
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60000);
  await Otp.findOneAndDelete({ email });
  await new Otp({ email, code, expiresAt }).save();
  await sendMail({
    to: email,
    subject,
    text: `${textPrefix} ${code}. Expires in ${OTP_EXPIRY_MIN} minutes.`,
  });
}

// Passport Google OAuth strategy (patient)
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
      callbackURL: GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) throw new Error('No profile email');
        let user = await Patient.findOne({ email });
        if (!user) {
          user = await new Patient({
            name: profile.displayName,
            email,
            provider: 'google',
            role: 'patient',
            isVerified: true,
          }).save();
        }
        done(null, user);
      } catch (err) {
        done(err as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    let u = (await Doctor.findById(id)) as any;
    if (!u) u = (await Patient.findById(id)) as any;
    done(null, u);
  } catch (err) {
    done(err as Error, undefined);
  }
});

// JWT auth middleware
interface JwtPayload {
  id: string;
  role: 'patient' | 'doctor';
  iat: number;
  exp: number;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const Model = payload.role === 'doctor' ? Doctor : Patient;
  Model.findById(payload.id)
    .then(user => {
      if (!user) return res.status(401).json({ message: 'User not found' });
      if (!('isActive' in user) || !(user as any).isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }
      ;(req as any).user = user;
      (req as any).role = payload.role;
      next();
    })
    .catch(err => {
      console.error('JWT auth error:', err);
      return res.status(500).json({ message: 'Server error' });
    });
};

// ─── Routes ─────────────────────────────────────────────────────────────────

// Send email OTP for verification
router.post('/send-email-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    await generateAndSendOtp(email, 'Your MedBook Verification Code', 'Your code:');
    return res.sendStatus(200);
  } catch (err) {
    console.error('Error sending OTP:', err);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Verify email OTP
router.post('/verify-email-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });
  try {
    const record = await Otp.findOne({ email, code: otp });
    if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });
    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: 'OTP expired' });
    }
    await Otp.deleteOne({ _id: record._id });
    return res.sendStatus(200);
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ message: 'OTP verification failed' });
  }
});

// Signup
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role: 'patient' | 'doctor';
  };
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields required' });
  }
  try {
    const Model = role === 'doctor' ? Doctor : Patient;
    if (await Model.findOne({ email })) {
      return res.status(400).json({ message: 'Email in use' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    if (role === 'doctor') {
      await new Doctor({
        name,
        email,
        passwordHash,
        role,
        provider: 'local',
        isVerified: true,
      }).save();
    } else {
      await new Patient({
        name,
        email,
        passwordHash,
        role,
        provider: 'local',
        isVerified: true,
      }).save();
    }
    return res.sendStatus(201);
  } catch (err: any) {
    console.error('Signup error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    return res.status(500).json({ message: 'Signup failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    let user = await Patient.findOne({ email });
    let role: 'patient' | 'doctor' = 'patient';
    if (!user) {
      const doc = await Doctor.findOne({ email });
      if (doc) {
        user = doc as any;
        role = 'doctor';
      }
    }
    if (!user || !user.passwordHash) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (!(user as any).isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Email not verified' });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id.toString(), role }, JWT_SECRET, { expiresIn: '1d' });
    const safeUser = (user.toJSON && user.toJSON()) || user;
    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateJWT, (req, res) => {
  const user = (req as any).user;
  return res.json(user);
});

// Update profile (including uploading profileImage)
// For patient or doctor minimal fields. Doctor full profile updates happen in /api/medical/doctor/me.
router.put('/me', authenticateJWT, upload.single('profileImage'), async (req, res) => {
  const user = (req as any).user as IPatient | IDoctor;
  const { name, email, phone, dob, specialty } = req.body;
  try {
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (dob) user.dob = new Date(dob);
    if ('specialty' in user && specialty) (user as IDoctor).specialty = specialty;
    if (req.file && 'profileImage' in user) {
      (user as any).profileImage = { data: req.file.buffer, contentType: req.file.mimetype };
    }
    const updated = await user.save();
    return res.json(updated);
  } catch (err: any) {
    console.error('Update profile error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    return res.status(500).json({ message: 'Update failed' });
  }
});

// Google OAuth endpoints (patient)
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => {
    const user = req.user as IPatient;
    const token = jwt.sign({ id: user._id.toString(), role: 'patient' }, JWT_SECRET, { expiresIn: '1d' });
    return res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}`);
  }
);

// Password-reset: send OTP
router.post('/send-reset-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  const existsPatient = await Patient.exists({ email });
  const existsDoctor = await Doctor.exists({ email });
  if (!existsPatient && !existsDoctor) {
    return res.status(404).json({ message: 'Account not found' });
  }
  try {
    await generateAndSendOtp(email, 'Password Reset Code', 'Your reset code:');
    return res.sendStatus(200);
  } catch (err) {
    console.error('Reset OTP error:', err);
    return res.status(500).json({ message: 'Failed to send reset OTP' });
  }
});

// Verify reset OTP
router.post('/verify-reset-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });
  try {
    const record = await Otp.findOne({ email, code: otp });
    if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });
    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: 'OTP expired' });
    }
    return res.sendStatus(200);
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    return res.status(500).json({ message: 'OTP verification failed' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP, and newPassword required' });
  }
  try {
    const record = await Otp.findOne({ email, code: otp });
    if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });
    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: 'OTP expired' });
    }
    let user = (await Patient.findOne({ email })) as any;
    if (!user) {
      user = (await Doctor.findOne({ email })) as any;
    }
    if (!user) return res.status(404).json({ message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();
    await Otp.deleteOne({ _id: record._id });
    return res.sendStatus(200);
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Password reset failed' });
  }
});

// Deactivate account
router.put('/user/deactivate', authenticateJWT, async (req, res) => {
  const user = (req as any).user as IPatient | IDoctor;
  try {
    (user as any).isActive = false;
    await user.save();
    return res.json({ message: 'Account has been deactivated.' });
  } catch (err) {
    console.error('Error deactivating account:', err);
    return res.status(500).json({ message: 'Failed to deactivate account' });
  }
});

// Delete account
router.delete('/user', authenticateJWT, async (req, res) => {
  const user = (req as any).user as IPatient | IDoctor;
  const role = (req as any).role as 'patient' | 'doctor';
  const { password } = req.body as { password?: string };
  if (!password) {
    return res.status(400).json({ message: 'Password required for deletion' });
  }
  try {
    const now = new Date();
    if ((user as any).deleteLockedUntil && (user as any).deleteLockedUntil > now) {
      const diffMs = (user as any).deleteLockedUntil.getTime() - now.getTime();
      const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
      return res.status(403).json({
        message: `Delete disabled due to multiple failed attempts. Try again in ${hoursLeft} hour(s).`,
      });
    }
    if (!(user as any).passwordHash) {
      return res.status(400).json({ message: 'No local password set. Cannot confirm deletion.' });
    }
    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      (user as any).deleteAttempts = ((user as any).deleteAttempts || 0) + 1;
      if ((user as any).deleteAttempts >= 3) {
        const lockUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        (user as any).deleteLockedUntil = lockUntil;
        (user as any).deleteAttempts = 0;
        await user.save();
        return res.status(403).json({
          message: 'Too many failed attempts. Delete disabled for 24 hours.',
        });
      } else {
        await user.save();
        const attemptsLeft = 3 - (user as any).deleteAttempts;
        return res.status(400).json({
          message: `Incorrect password. ${attemptsLeft} attempt(s) remaining.`,
        });
      }
    }
    // Correct password: proceed to delete related data and user
    if (role === 'patient') {
      await MedicalInfo.deleteMany({ user: user._id });
      await Appointment.deleteMany({ patient: user._id });
      await Patient.deleteOne({ _id: user._id });
    } else if (role === 'doctor') {
      await Appointment.deleteMany({ doctor: user._id });
      await Doctor.deleteOne({ _id: user._id });
    }
    return res.json({ message: 'Account has been deleted successfully.' });
  } catch (err) {
    console.error('Error deleting account:', err);
    return res.status(500).json({ message: 'Failed to delete account' });
  }
});

export default router;
