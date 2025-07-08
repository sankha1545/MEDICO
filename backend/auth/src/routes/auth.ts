// File: backend/src/routes/auth.ts

import express, { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';

import Patient, { IPatient } from '../models/Patient';
import Doctor, { IDoctor } from '../models/Doctor';
import Otp from '../models/Otp';
import { sendOtpEmail } from '../utils/email';

dotenv.config();
const router: Router = express.Router();

// ─── CONFIG & HELPERS ─────────────────────────────────────────────────────────

const OTP_EXPIRY_MIN = Number(process.env.OTP_EXPIRY_MINUTES || '10');
const JWT_SECRET = process.env.JWT_SECRET || 'yoursecret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

interface JwtPayload {
  id: string;
  role: 'patient' | 'doctor';
  email?: string;
  fullName?: string;
  googleId?: string;
  source?: string;
  iat: number;
  exp: number;
}

function signJwt(payload: object, expiresIn: string = '1d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

// JWT authentication middleware
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
  if (!payload.id || !payload.role) {
    return res.status(401).json({ message: 'Invalid token payload' });
  }
  const Model = payload.role === 'doctor' ? Doctor : Patient;
  Model.findById(payload.id)
    .then((user) => {
      if (!user) return res.status(401).json({ message: 'User not found' });
      if (!(user as any).isActive) {
        return res.status(403).json({ message: 'Account deactivated' });
      }
      (req as any).user = user;
      (req as any).role = payload.role;
      next();
    })
    .catch((err) => {
      console.error('JWT auth error:', err);
      res.status(500).json({ message: 'Server error' });
    });
};

// Generate and send OTP
async function generateAndSendOtp(
  email: string,
  purpose: 'signup' | 'reset' | 'emailChange'
) {
  const code = crypto.randomInt(100000, 999999).toString().padStart(6, '0');
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60_000);
  await Otp.deleteMany({ email, purpose });
  await new Otp({ email, code, expiresAt, purpose }).save();
  await sendOtpEmail(email, code, purpose);
}

// ─── AUTH ROUTES ────────────────────────────────────────────────────────────────

// 1. Send signup OTP
router.post('/send-email-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    const exists =
      (await Patient.findOne({ email })) || (await Doctor.findOne({ email }));
    if (exists) {
      return res
        .status(409)
        .json({ message: 'An account already exists with this email.' });
    }
    await generateAndSendOtp(email, 'signup');
    res.sendStatus(200);
  } catch (err) {
    console.error('Send signup OTP error:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// 2. Verify signup OTP
router.post('/verify-email-otp', async (req, res) => {
  const { email, otp: code } = req.body;
  if (!email || !code)
    return res.status(400).json({ message: 'Email and OTP required' });
  try {
    const record = await Otp.findOne({ email, code, purpose: 'signup' });
    if (!record || record.expiresAt < new Date()) {
      if (record) await record.deleteOne();
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    await record.deleteOne();
    res.sendStatus(200);
  } catch (err) {
    console.error('Verify signup OTP error:', err);
    res.status(500).json({ message: 'OTP verification failed' });
  }
});

// 3. Signup (email/password)
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
    if (
      (await Patient.findOne({ email })) ||
      (await Doctor.findOne({ email }))
    ) {
      return res
        .status(409)
        .json({ message: 'An account already exists with this email.' });
    }
    if (role === 'doctor') {
      await new Doctor({
        name,
        email,
        passwordHash: password,
        role,
        provider: 'local',
        isVerified: true,
        isActive: true,
      }).save();
    } else {
      await new Patient({
        name,
        email,
        passwordHash: password,
        role,
        provider: 'local',
        isVerified: true,
        isActive: true,
      }).save();
    }
    res.sendStatus(201);
  } catch (err: any) {
    console.error('Signup error:', err);
    if (err.code === 11000) {
      res
        .status(409)
        .json({ message: 'An account already exists with this email.' });
    } else {
      res.status(500).json({ message: 'Signup failed' });
    }
  }
});

// 4. Login (email/password)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    let user = await Patient.findOne({ email });
    let role: 'patient' | 'doctor' = 'patient';
    if (!user) {
      user = await Doctor.findOne({ email });
      role = 'doctor';
    }
    if (!user || !(user as any).isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await (user as IPatient | IDoctor).comparePassword(
      password
    );
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = signJwt({ id: user._id.toString(), role });
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// 5. Get current user
router.get('/me', authenticateJWT, (req, res) => {
  res.json((req as any).user);
});

// 6. Update profile
router.put(
  '/me',
  authenticateJWT,
  upload.single('profileImage'),
  async (req, res) => {
    const user = (req as any).user as IPatient | IDoctor;
    try {
      const { name, email, phone, dob, specialty } = req.body;
      if (name) user.name = name;
      if (email) user.email = email;
      if (phone) (user as any).phone = phone;
      if (dob) (user as any).dob = new Date(dob);
      if ('specialty' in user && specialty) {
        (user as IDoctor).specialty = specialty;
      }
      if (req.file && 'profileImage' in user) {
        (user as any).profileImage = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        };
      }
      const updated = await user.save();
      res.json(updated);
    } catch (err: any) {
      console.error('Update profile error:', err);
      if (err.code === 11000) {
        res
          .status(409)
          .json({ message: 'An account already exists with this email.' });
      } else {
        res.status(500).json({ message: 'Update failed' });
      }
    }
  }
);

// 7. Send password-reset OTP
router.post('/send-reset-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  const exists =
    (await Patient.exists({ email })) || (await Doctor.exists({ email }));
  if (!exists) {
    return res.status(404).json({ message: 'Account not found' });
  }
  try {
    await generateAndSendOtp(email, 'reset');
    res.sendStatus(200);
  } catch (err) {
    console.error('Reset OTP error:', err);
    res.status(500).json({ message: 'Failed to send reset OTP' });
  }
});

// 8. Verify reset OTP
router.post('/verify-reset-otp', async (req, res) => {
  const { email, otp: code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: 'Email and OTP required' });
  }
  try {
    const record = await Otp.findOne({ email, code, purpose: 'reset' });
    if (!record || record.expiresAt < new Date()) {
      if (record) await record.deleteOne();
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    await record.deleteOne();
    res.sendStatus(200);
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    res.status(500).json({ message: 'OTP verification failed' });
  }
});

// 9. Reset password
router.post('/reset-password', async (req, res) => {
  const { email, otp: code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res
      .status(400)
      .json({ message: 'Email, OTP, and newPassword required' });
  }
  try {
    const record = await Otp.findOne({ email, code, purpose: 'reset' });
    if (!record || record.expiresAt < new Date()) {
      if (record) await record.deleteOne();
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    let user = (await Patient.findOne({ email })) as any;
    let role: 'patient' | 'doctor' = 'patient';
    if (!user) {
      user = (await Doctor.findOne({ email })) as any;
      role = 'doctor';
    }
    if (!user) {
      await record.deleteOne();
      return res.status(404).json({ message: 'User not found' });
    }
    user.passwordHash = newPassword;
    await user.save();
    await record.deleteOne();
    res.sendStatus(200);
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Password reset failed' });
  }
});

// 10. Deactivate account
router.put('/user/deactivate', authenticateJWT, async (req, res) => {
  const user = (req as any).user as IPatient | IDoctor;
  try {
    user.isActive = false;
    await user.save();
    res.json({ message: 'Account has been deactivated.' });
  } catch (err) {
    console.error('Deactivate account error:', err);
    res.status(500).json({ message: 'Failed to deactivate account' });
  }
});

// 11. Delete account
router.delete('/user', authenticateJWT, async (req, res) => {
  const user = (req as any).user as IPatient | IDoctor;
  const role = (req as any).role as 'patient' | 'doctor';
  const { password } = req.body as { password?: string };

  if (!password) {
    return res.status(400).json({ message: 'Password required for deletion' });
  }

  try {
    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password.' });
    }

    if (role === 'patient') {
      await MedicalInfo.deleteMany({ user: user._id });
      await Appointment.deleteMany({ patient: user._id });
      await Patient.deleteOne({ _id: user._id });
    } else {
      await Appointment.deleteMany({ doctor: user._id });
      await Doctor.deleteOne({ _id: user._id });
    }

    res.json({ message: 'Account has been deleted successfully.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

// ─── GOOGLE OAUTH ROUTES ───────────────────────────────────────────────────────

// Google signup (get temp token)
router.post('/google/signup', async (req, res) => {
  const { token: idToken } = req.body as { token?: string };
  if (!idToken) {
    return res.status(400).json({ message: 'ID token required' });
  }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      return res.status(400).json({ message: 'Invalid ID token payload' });
    }
    const { email, name: fullName, sub: googleId } = payload;
    const exists =
      (await Patient.findOne({ email })) || (await Doctor.findOne({ email }));
    if (exists) {
      return res
        .status(409)
        .json({ message: 'An account already exists with this email.' });
    }
    const tempToken = signJwt(
      { email, fullName, googleId, source: 'google-signup' },
      '15m'
    );
    res.json({ tempToken, frontendUrl: FRONTEND_URL });
  } catch (err) {
    console.error('Google signup error:', err);
    res.status(400).json({ message: 'Invalid or expired ID token' });
  }
});

// Google complete signup
router.post('/google/complete-signup', async (req, res) => {
  const { token: tempToken, role } = req.body as {
    token?: string;
    role?: 'patient' | 'doctor';
  };
  if (!tempToken || !role) {
    return res.status(400).json({ message: 'Missing token or role' });
  }
  try {
    const payload = jwt.verify(tempToken, JWT_SECRET) as JwtPayload;
    if (
      payload.source !== 'google-signup' ||
      !payload.email ||
      !payload.googleId
    ) {
      return res.status(400).json({ message: 'Invalid token' });
    }
    const { email, fullName, googleId } = payload;
    const already =
      (await Patient.findOne({ email })) || (await Doctor.findOne({ email }));
    if (already) {
      return res
        .status(409)
        .json({ message: 'An account already exists with this email.' });
    }
    if (role === 'patient') {
      await new Patient({
        name: fullName,
        email,
        passwordHash: '',
        googleId,
        role,
        provider: 'google',
        isVerified: true,
        isActive: true,
      }).save();
    } else {
      await newDoctor({
        name: fullName,
        email,
        passwordHash: '',
        googleId,
        role,
        provider: 'google',
        isVerified: true,
        isActive: true,
      }).save();
    }
    res.json({ message: 'Account created' });
  } catch (err) {
    console.error('Complete Google signup error:', err);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

// Google login
router.post('/google/login', async (req, res) => {
  const { token: idToken } = req.body as { token?: string };
  if (!idToken) {
    return res.status(400).json({ message: 'ID token required' });
  }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      return res.status(400).json({ message: 'Invalid ID token payload' });
    }
    const { email, sub: googleId } = payload;
    let user = await Patient.findOne({ googleId });
    let role: 'patient' | 'doctor' = 'patient';
    if (!user) {
      user = await Patient.findOne({ email });
    }
    if (!user) {
      const doc =
        (await Doctor.findOne({ googleId })) || (await Doctor.findOne({ email }));
      if (doc) {
        user = doc;
        role = 'doctor';
      }
    }
    if (!user) {
      return res
        .status(404)
        .json({ message: 'No account found. Please sign up.' });
    }
    if (!user.isActive || !user.isVerified) {
      return res
        .status(403)
        .json({ message: 'Account inactive or not verified' });
    }
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
    const appJwt = signJwt({ id: user._id.toString(), role }, '1d');
    res.json({ token: appJwt, role });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(400).json({ message: 'Invalid or expired ID token' });
  }
});

export default router;
