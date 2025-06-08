// File: backend/src/routes/Auth.ts

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

// ──────────────────────────────────────────────────────────────────────────────
// 1) Configure Passport GoogleStrategy
// ──────────────────────────────────────────────────────────────────────────────
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
        // Try to find an existing user by email
        let user = await User.findOne({ email });
        if (!user) {
          // If none, create a new Google‐linked user, mark as verified immediately
          user = await new User({
            name: profile.displayName,
            email,
            provider: 'google',
            role: 'patient',
            isVerified: true,
          }).save();
        }
        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

// (Optional) Session serialize/deserialize (not needed for JWT‐only)
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
// 2) Middleware: authenticateJWT → verifies Bearer token, sets req.user
// ──────────────────────────────────────────────────────────────────────────────
interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
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

// ──────────────────────────────────────────────────────────────────────────────
// 3) POST /api/send-email-otp
// ──────────────────────────────────────────────────────────────────────────────
router.post('/send-email-otp', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  try {
    // Generate 6‐digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);

    // Delete any existing OTP for this email, then save new one
    await Otp.findOneAndDelete({ email });
    await new Otp({ email, code, expiresAt }).save();

    // Send email containing the OTP code
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

// ──────────────────────────────────────────────────────────────────────────────
// 4) POST /api/verify-email-otp
// ──────────────────────────────────────────────────────────────────────────────
router.post('/verify-email-otp', async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  try {
    const record = await Otp.findOne({ email, code: otp });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    // Remove that OTP record so it cannot be reused
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
router.post('/signup', async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All signup fields are required' });
  }

  try {
    // Check if email is already in use
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create the user, marking isVerified = true (since we've already verified OTP on the client)
    const newUser = new User({
      name,
      email,
      passwordHash,
      role,
      isVerified: true,
      provider: 'local',
    });
    await newUser.save();

    return res.sendStatus(201);
  } catch (err) {
    console.error('Error in /signup:', err);
    return res.status(500).json({ message: 'Signup failed' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 6) POST /api/login
// ──────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Prevent login if not verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Sign a JWT
    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '1d' });

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider,
        isVerified: user.isVerified,
        phone: user.phone,
        dob: user.dob,
      },
    });
  } catch (err) {
    console.error('Error in /login:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 7) GET /api/me  ← returns logged-in user info
// ──────────────────────────────────────────────────────────────────────────────
router.get('/me', authenticateJWT, async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;
  return res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    provider: user.provider,
    isVerified: user.isVerified,
    phone: user.phone,
    dob: user.dob,
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 8) PUT /api/me  ← update name, email, phone, dob
// ──────────────────────────────────────────────────────────────────────────────
router.put('/me', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as IUser;
    const { name, email, phone, dob } = req.body;

    // Update only provided fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (dob) user.dob = new Date(dob);

    const updatedUser = await user.save();
    return res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      provider: updatedUser.provider,
      isVerified: updatedUser.isVerified,
      phone: updatedUser.phone,
      dob: updatedUser.dob,
    });
  } catch (err) {
    console.error('Error in PUT /api/me:', err);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 9) Google OAuth routes
// ──────────────────────────────────────────────────────────────────────────────
router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/auth/google/callback',
  (req, res, next) => {
    passport.authenticate(
      'google',
      { session: false, failureRedirect: `${FRONTEND_URL}/login` },
      async (err, user, info) => {
        if (err || !user) {
          console.error('❌ Google OAuth error:', err || info);
          return res.redirect(`${FRONTEND_URL}/login`);
        }
        // Sign JWT for this Google user
        const token = jwt.sign({ id: (user as any)._id.toString() }, JWT_SECRET, { expiresIn: '1d' });
        return res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}`);
      }
    )(req, res, next);
  }
);

export default router;
