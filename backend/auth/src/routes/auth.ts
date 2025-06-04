// File: backend/src/routes/auth.ts

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';

import User from '../models/User';
import Otp from '../models/Otp';
import sendMail from '../utils/email';

import dotenv from 'dotenv';
dotenv.config();

const router = Router();
const OTP_EXPIRY_MIN = 10;

// ──────────────────────────────────────────────────────────────────────────────
// 1) Load environment variables
// ──────────────────────────────────────────────────────────────────────────────
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  JWT_SECRET = 'yoursecret',
  FRONTEND_URL = 'http://localhost:5173',
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.error(
    '❌ Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_CALLBACK_URL in .env'
  );
  process.exit(1);
}

// ──────────────────────────────────────────────────────────────────────────────
// 2) Configure Passport GoogleStrategy
// ──────────────────────────────────────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID:     GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL:  GOOGLE_CALLBACK_URL,  // ← must exactly match what’s in Google Cloud
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value!;
        let user = await User.findOne({ email });

        if (!user) {
          user = await new User({
            name:     profile.displayName,
            email,
            provider: 'google',
            role:     'patient', // default role
          }).save();
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

// (Optional) Session serialize/deserialize
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const u = await User.findById(id);
    done(null, u!);
  } catch (err) {
    done(err as Error, undefined);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 3) POST /api/send-email-otp
// ──────────────────────────────────────────────────────────────────────────────
router.post('/send-email-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  try {
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);

    await Otp.findOneAndDelete({ email });
    await new Otp({ email, code, expiresAt }).save();

    await sendMail({
      to:      email,
      subject: 'Your MedBook Verification Code',
      text:    `Your verification code is ${code}. It expires in ${OTP_EXPIRY_MIN} minutes.`,
    });

    return res.sendStatus(200);
  } catch (err) {
    console.error('Error sending OTP email:', err);
    return res.status(500).json({ message: 'Failed to send OTP email' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 4) POST /api/verify-email-otp
// ──────────────────────────────────────────────────────────────────────────────
router.post('/verify-email-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const record = await Otp.findOne({ email, code: otp });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    await Otp.deleteOne({ _id: record._id });
    return res.sendStatus(200);
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ message: 'OTP verification failed' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 5) POST /api/signup
// ──────────────────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All signup fields are required' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await new User({ name, email, passwordHash, role }).save();
    return res.sendStatus(201);
  } catch (err) {
    console.error('Error in /signup:', err);
    return res.status(500).json({ message: 'Signup failed' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 6) POST /api/login
// ──────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash!);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
    return res.status(200).json({ user, token });
  } catch (err) {
    console.error('Error in /login:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 7) Google OAuth routes
// ──────────────────────────────────────────────────────────────────────────────

// (a) Kick off Google OAuth flow
router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// (b) Google callback with debug wrapper
router.get(
  '/auth/google/callback',
  (req, res, next) => {
    passport.authenticate(
      'google',
      { session: false, failureRedirect: `${FRONTEND_URL}/login` },
      (err, user, info) => {
        if (err) {
          console.error('❌ Google OAuth error:', err);
          if ((err as any).data) {
            console.error('Google error response body:', (err as any).data);
          }
          return res.redirect(`${FRONTEND_URL}/login`);
        }
        if (!user) {
          console.warn('⚠️ Google OAuth did not return a user:', info);
          return res.redirect(`${FRONTEND_URL}/login`);
        }
        // Successful: issue JWT and redirect
        const token = jwt.sign({ id: (user as any)._id }, JWT_SECRET, { expiresIn: '1d' });
        return res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}`);
      }
    )(req, res, next);
  }
);

export default router;
