import express, { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import Patient, { IPatient } from '../models/Patient';
import Doctor, { IDoctor } from '../models/Doctor';
import Otp from '../models/Otp';
import { sendOtpEmail } from '../utils/email'; // assume this sends OTP email based on purpose
import MedicalInfo from '../models/MedicalInfo';
import Appointment from '../models/Appointment';

dotenv.config();
const router: Router = express.Router();

// ─── Constants & Env ───────────────────────────────────────────────────────────
const OTP_EXPIRY_MIN = Number(process.env.OTP_EXPIRY_MINUTES || '10');
const JWT_SECRET = process.env.JWT_SECRET || 'yoursecret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  console.error('❌ Missing GOOGLE_CLIENT_ID');
  process.exit(1);
}
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Multer for profile images (2MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

// JWT helper
interface JwtPayload {
  id?: string;
  role?: 'patient' | 'doctor';
  email?: string;
  fullName?: string;
  googleId?: string;
  source?: string;
  iat: number;
  exp: number;
}
function signJwt(payload: object, expiresIn = '1d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// JWT auth middleware
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
  if (!payload.id || !payload.role) {
    return res.status(401).json({ message: 'Invalid token payload' });
  }
  const Model = payload.role === 'doctor' ? Doctor : Patient;
  Model.findById(payload.id)
    .then(user => {
      if (!user) return res.status(401).json({ message: 'User not found' });
      if (!('isActive' in user) || !(user as any).isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }
      (req as any).user = user;
      (req as any).role = payload.role;
      next();
    })
    .catch(err => {
      console.error('JWT auth error:', err);
      return res.status(500).json({ message: 'Server error' });
    });
};

// OTP utility
async function generateAndSendOtp(email: string, purpose: 'signup' | 'reset' | 'emailChange') {
  const code = crypto.randomInt(100000, 999999).toString().padStart(6, '0');
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60000);
  await Otp.deleteMany({ email, purpose });
  await new Otp({ email, code, expiresAt, purpose }).save();
  await sendOtpEmail(email, code, purpose);
}

// ─── Google OAuth Setup (Passport.js) ──────────────────────────────────────────

// Setup passport strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value;
      const googleId = profile.id;
      const name = profile.displayName;

      let user = await Patient.findOne({ googleId }) || await Doctor.findOne({ googleId });

      if (!user && email) {
        // Create new user here if needed
        user = new Patient({
          name,
          email,
          googleId,
          role: 'patient',
          provider: 'google',
          isVerified: true,
          isActive: true,
        });
        await user.save();
      }

      return done(null, user);
    }
  )
);

// Serialize user (simplified)
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await Patient.findById(id) || await Doctor.findById(id);
  done(null, user);
});

// ─── Routes ─────────────────────────────────────────────────────────────────────

// 1. Send signup OTP
router.post('/send-email-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    const existsPatient = await Patient.findOne({ email });
    const existsDoctor = await Doctor.findOne({ email });
    if (existsPatient || existsDoctor) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }
    await generateAndSendOtp(email, 'signup');
    return res.sendStatus(200);
  } catch (err: any) {
    console.error('❌ Failed to send signup OTP:', err);
    return res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
});

// 2. Verify signup OTP
router.post('/verify-email-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });
  try {
    const record = await Otp.findOne({ email, code: otp, purpose: 'signup' });
    if (!record || record.expiresAt < new Date()) {
      if (record) await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    await Otp.deleteOne({ _id: record._id });
    return res.sendStatus(200);
  } catch (err) {
    console.error('Error verifying signup OTP:', err);
    return res.status(500).json({ message: 'OTP verification failed' });
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
    if (await Patient.findOne({ email }) || await Doctor.findOne({ email })) {
      return res.status(400).json({ message: 'Email already in use' });
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
        isActive: true,
      }).save();
    } else {
      await new Patient({
        name,
        email,
        passwordHash,
        role,
        provider: 'local',
        isVerified: true,
        isActive: true,
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

// Google OAuth Routes

// 4. Google OAuth - Sign up via Google
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
    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).json({ message: 'Invalid ID token payload' });
    }
    const email = payload.email;
    const fullName = payload.name || '';
    const googleId = payload.sub;
    // Check if already registered
    const existsPatient = await Patient.findOne({ email });
    const existsDoctor = await Doctor.findOne({ email });
    if (existsPatient || existsDoctor) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }
    // Issue temp JWT for frontend to complete signup (role selection)
    const tempToken = signJwt(
      { email, fullName, googleId, source: 'google-signup' },
      '15m'
    );
    return res.json({ tempToken });
  } catch (err) {
    console.error('Google signup error:', err);
    return res.status(400).json({ message: 'Invalid or expired ID token' });
  }
});


// 5. Get current user
router.get('/me', authenticateJWT, (req, res) => {
  const user = (req as any).user;
  return res.json(user);
});

// 6. Update profile (including profileImage)
router.put('/me', authenticateJWT, upload.single('profileImage'), async (req, res) => {
  const user = (req as any).user as IPatient | IDoctor;
  const { name, email, phone, dob, specialty } = req.body;
  try {
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) (user as any).phone = phone;
    if (dob) (user as any).dob = new Date(dob);
    if ('specialty' in user && specialty) (user as IDoctor).specialty = specialty;
    if (req.file && 'profileImage' in user) {
      (user as any).profileImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        updatedAt: new Date(),
      };
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

// 7. Send password-reset OTP
router.post('/send-reset-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  const existsPatient = await Patient.exists({ email });
  const existsDoctor = await Doctor.exists({ email });
  if (!existsPatient && !existsDoctor) {
    return res.status(404).json({ message: 'Account not found' });
  }
  try {
    await generateAndSendOtp(email, 'reset');
    return res.sendStatus(200);
  } catch (err) {
    console.error('Reset OTP error:', err);
    return res.status(500).json({ message: 'Failed to send reset OTP' });
  }
});

// 8. Verify reset OTP
router.post('/verify-reset-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });
  try {
    const record = await Otp.findOne({ email, code: otp, purpose: 'reset' });
    if (!record || record.expiresAt < new Date()) {
      if (record) await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    return res.sendStatus(200);
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    return res.status(500).json({ message: 'OTP verification failed' });
  }
});

// 9. Reset password
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP, and newPassword required' });
  }
  try {
    const record = await Otp.findOne({ email, code: otp, purpose: 'reset' });
    if (!record || record.expiresAt < new Date()) {
      if (record) await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    let user = await Patient.findOne({ email }) as any;
    let role: 'patient' | 'doctor' = 'patient';
    if (!user) {
      user = await Doctor.findOne({ email }) as any;
      role = 'doctor';
    }
    if (!user) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(404).json({ message: 'User not found' });
    }
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

// 10. Deactivate account
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

// 11. Delete account
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
    const isMatch = await bcrypt.compare(password, (user as any).passwordHash);
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
    // Correct password: delete related data
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

// ─── Google OAuth via ID Token (GSI) ────────────────────────────────────────────

/**
 * POST /auth/google/signup
 * Body: { token: string }  // Google ID token from frontend GSI
 * Verifies token, if email not registered, returns a tempToken for completing signup.
 */
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
    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).json({ message: 'Invalid ID token payload' });
    }
    const email = payload.email;
    const fullName = payload.name || '';
    const googleId = payload.sub;
    // Check if already registered
    const existsPatient = await Patient.findOne({ email });
    const existsDoctor = await Doctor.findOne({ email });
    if (existsPatient || existsDoctor) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }
    // Issue temp JWT for frontend to complete signup (role selection)
    const tempToken = signJwt(
      { email, fullName, googleId, source: 'google-signup' },
      '15m'
    );
    return res.json({ tempToken });
  } catch (err) {
    console.error('Google signup error:', err);
    return res.status(400).json({ message: 'Invalid or expired ID token' });
  }
});

/**
 * POST /auth/google/complete-signup
 * Body: { token: string, role: 'patient'|'doctor' }
 * Verifies tempToken, creates user with Google info and chosen role.
 */
router.post('/google/complete-signup', async (req, res) => {
  const { token: tempToken, role } = req.body as { token?: string; role?: 'patient' | 'doctor' };
  if (!tempToken || !role) {
    return res.status(400).json({ message: 'Missing token or role' });
  }
  if (!['patient', 'doctor'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  try {
    const payload = jwt.verify(tempToken, JWT_SECRET) as JwtPayload;
    if (payload.source !== 'google-signup' || !payload.email || !payload.googleId) {
      return res.status(400).json({ message: 'Invalid token' });
    }
    const { email, fullName, googleId } = payload;
    // Check again if registered
    if (await Patient.findOne({ email }) || await Doctor.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    if (role === 'patient') {
      const exists = await Patient.findOne({ googleId });
      if (exists) return res.status(400).json({ message: 'Google account already used' });
      await new Patient({
        name: fullName,
        email,
        googleId,
        role: 'patient',
        provider: 'google',
        isVerified: true,
        isActive: true,
      }).save();
    } else {
      const exists = await Doctor.findOne({ googleId });
      if (exists) return res.status(400).json({ message: 'Google account already used' });
      await new Doctor({
        name: fullName,
        email,
        googleId,
        role: 'doctor',
        provider: 'google',
        isVerified: true,
        isActive: true,
      }).save();
    }
    return res.json({ message: 'Account created' });
  } catch (err) {
    console.error('Complete Google signup error:', err);
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
});

/**
 * POST /auth/google/login
 * Body: { token: string }  // Google ID token from frontend GSI
 * Verifies token, if user exists, returns app JWT and role.
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  try {
    // Try Patient first, then Doctor
    let user = (await Patient.findOne({ email })) as IPatient | null;
    let role: 'patient' | 'doctor' = 'patient';
    if (!user) {
      user = (await Doctor.findOne({ email })) as IDoctor | null;
      role = 'doctor';
    }
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id.toString(), role }, JWT_SECRET, {
      expiresIn: '1d',
    });
    return res.json({ token, role });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

export default router;
