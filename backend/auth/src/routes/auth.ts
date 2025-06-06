// File: backend/src/routes/auth.ts

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import Otp from '../models/Otp';
import sendMail from '../utils/email';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
const router = Router();
const OTP_EXPIRY_MIN = 10;

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  JWT_SECRET = 'yoursecret',
  FRONTEND_URL = 'http://localhost:5173',
  MONGO_URI,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.error(
    '❌ Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_CALLBACK_URL in .env'
  );
  process.exit(1);
}

// ─── Google OAuth Strategy ───────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value!;
        let user = await User.findOne({ email });
        if (!user) {
          user = await new User({
            name: profile.displayName,
            email,
            provider: 'google',
            role: 'patient',
          }).save();
        }
        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const u = await User.findById(id);
    done(null, u!);
  } catch (err) {
    done(err as Error, undefined);
  }
});

// ─── Middleware to Verify JWT ─────────────────────────────────────────
interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ─── Send OTP ─────────────────────────────────────────────────────────
router.post('/send-email-otp', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  try {
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);

    await Otp.findOneAndDelete({ email });
    await new Otp({ email, code, expiresAt }).save();

    await sendMail({
      to: email,
      subject: 'Your MedBook Verification Code',
      text: `Your verification code is ${code}. It expires in ${OTP_EXPIRY_MIN} minutes.`,
    });

    return res.sendStatus(200);
  } catch (err) {
    console.error('Error sending OTP email:', err);
    return res.status(500).json({ message: 'Failed to send OTP email' });
  }
});

// ─── Verify OTP ───────────────────────────────────────────────────────
router.post('/verify-email-otp', async (req: Request, res: Response) => {
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

// ─── Signup ───────────────────────────────────────────────────────────
router.post('/signup', async (req: Request, res: Response) => {
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

// ─── Login ────────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '1d' });

    return res.status(200).json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Error in /login:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// ─── Get Authenticated User ───────────────────────────────────────────
router.get('/me', authenticateJWT, async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;

  return res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    provider: user.provider,
    isVerified: user.isVerified,
  });
});

// ─── Google OAuth Flow ────────────────────────────────────────────────
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.get('/auth/google/callback',
  (req, res, next) => {
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${FRONTEND_URL}/login`,
    }, async (err, user, info) => {
      if (err || !user) {
        console.error('❌ Google OAuth error:', err || info);
        return res.redirect(`${FRONTEND_URL}/login`);
      }

      const token = jwt.sign({ id: (user as any)._id.toString() }, JWT_SECRET, { expiresIn: '1d' });
      return res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}`);
    })(req, res, next);
  }
);

export default router;
