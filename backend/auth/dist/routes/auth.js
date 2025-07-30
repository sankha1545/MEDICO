"use strict";
// File: backend/src/routes/auth.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = exports.signJwt = void 0;
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
const google_auth_library_1 = require("google-auth-library");
const Patient_1 = __importDefault(require("../models/Patient"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const Otp_1 = __importDefault(require("../models/Otp"));
const email_1 = require("../utils/email");
dotenv_1.default.config();
const router = express_1.default.Router();
// ─── CONFIG & HELPERS ─────────────────────────────────────────────────────────
const OTP_EXPIRY_MIN = Number(process.env.OTP_EXPIRY_MINUTES || '10');
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const googleClient = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET in environment');
}
function signJwt(payload, expiresIn = '1d') {
    const options = { expiresIn };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
}
exports.signJwt = signJwt;
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
});
// JWT authentication middleware
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.slice(7);
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
    const { id, role } = payload;
    if (!id || !role) {
        return res.status(401).json({ message: 'Invalid token payload' });
    }
    try {
        let user;
        if (role === 'doctor') {
            user = await Doctor_1.default.findById(id);
        }
        else {
            user = await Patient_1.default.findById(id);
        }
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: 'Account deactivated' });
        }
        req.user = user;
        req.role = role;
        next();
    }
    catch (err) {
        console.error('JWT auth error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.authenticateJWT = authenticateJWT;
// Generate and send OTP
async function generateAndSendOtp(email, purpose) {
    const code = crypto_1.default.randomInt(100000, 999999).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60000);
    await Otp_1.default.deleteMany({ email, purpose });
    await new Otp_1.default({ email, code, expiresAt, purpose }).save();
    await (0, email_1.sendOtpEmail)(email, code, purpose);
}
// ─── AUTH ROUTES ────────────────────────────────────────────────────────────────
// 1. Send signup OTP
router.post('/send-email-otp', async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ message: 'Email required' });
    try {
        const exists = (await Patient_1.default.findOne({ email })) || (await Doctor_1.default.findOne({ email }));
        if (exists)
            return res
                .status(409)
                .json({ message: 'An account already exists with this email.' });
        await generateAndSendOtp(email, 'signup');
        res.sendStatus(200);
    }
    catch (err) {
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
        const record = await Otp_1.default.findOne({ email, code, purpose: 'signup' });
        if (!record || record.expiresAt < new Date()) {
            if (record)
                await record.deleteOne();
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        await record.deleteOne();
        res.sendStatus(200);
    }
    catch (err) {
        console.error('Verify signup OTP error:', err);
        res.status(500).json({ message: 'OTP verification failed' });
    }
});
// 3. Signup (email/password)
router.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
        return res.status(400).json({ message: 'All fields required' });
    try {
        if ((await Patient_1.default.findOne({ email })) ||
            (await Doctor_1.default.findOne({ email })))
            return res
                .status(409)
                .json({ message: 'An account already exists with this email.' });
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        console.log('🔐 [SIGNUP] Creating user:', { email, role });
        const Model = role === 'doctor' ? Doctor_1.default : Patient_1.default;
        const newUser = new Model({
            name,
            email,
            passwordHash,
            role,
            provider: 'local',
            isVerified: true,
            isActive: true,
        });
        console.log('📝 [SIGNUP] About to save:', { email, passwordHash });
        await newUser.save();
        console.log('✅ [SIGNUP] User created:', email);
        res.sendStatus(201);
    }
    catch (err) {
        console.error('Signup error:', err);
        if (err.code === 11000)
            return res
                .status(409)
                .json({ message: 'An account already exists with this email.' });
        res.status(500).json({ message: 'Signup failed.' });
    }
});
// 4. Login (email/password) — fixed bcrypt.compare issue
router.post('/login', async (req, res) => {
    console.log('🔍 [LOGIN] request body:', req.body);
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: 'Email and password required' });
    try {
        let user = await Patient_1.default.findOne({ email });
        let role = 'patient';
        if (!user) {
            user = await Doctor_1.default.findOne({ email });
            role = 'doctor';
        }
        if (!user || !user.isActive)
            return res.status(401).json({ message: 'Invalid credentials' });
        // Workaround: hash the candidate with stored salt, compare strings
        console.log('📋 [LOGIN] stored hash:', user.passwordHash);
        const candidateHash = bcryptjs_1.default.hashSync(password, user.passwordHash);
        console.log('🔒 [LOGIN] candidate hash:', candidateHash);
        if (candidateHash !== user.passwordHash) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = signJwt({ id: user._id.toString(), role });
        res.json({ token, user: user.toJSON() });
    }
    catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Login failed' });
    }
});
// 5. Get current user
router.get('/me', exports.authenticateJWT, (req, res) => {
    res.json(req.user);
});
// 6. Update profile
router.put('/me', exports.authenticateJWT, upload.single('profileImage'), async (req, res) => {
    const user = req.user;
    try {
        const { name, email, phone, dob, specialty } = req.body;
        if (name)
            user.name = name;
        if (email)
            user.email = email;
        if (phone)
            user.phone = phone;
        if (dob)
            user.dob = new Date(dob);
        if ('specialty' in user && specialty) {
            user.specialty = specialty;
        }
        if (req.file && 'profileImage' in user) {
            user.profileImage = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            };
        }
        const updated = await user.save();
        res.json(updated);
    }
    catch (err) {
        console.error('Update profile error:', err);
        if (err.code === 11000) {
            return res
                .status(409)
                .json({ message: 'An account already exists with this email.' });
        }
        res.status(500).json({ message: 'Update failed' });
    }
});
// 7. Send password-reset OTP
router.post('/send-reset-otp', async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ message: 'Email required' });
    const exists = (await Patient_1.default.exists({ email })) || (await Doctor_1.default.exists({ email }));
    if (!exists)
        return res.status(404).json({ message: 'Account not found' });
    try {
        await generateAndSendOtp(email, 'reset');
        res.sendStatus(200);
    }
    catch (err) {
        console.error('Reset OTP error:', err);
        res.status(500).json({ message: 'Failed to send reset OTP' });
    }
});
// 8. Verify reset OTP
router.post('/verify-reset-otp', async (req, res) => {
    const { email, otp: code } = req.body;
    if (!email || !code)
        return res.status(400).json({ message: 'Email and OTP required' });
    try {
        const record = await Otp_1.default.findOne({ email, code, purpose: 'reset' });
        if (!record || record.expiresAt < new Date()) {
            if (record)
                await record.deleteOne();
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        res.sendStatus(200);
    }
    catch (err) {
        console.error('Verify reset OTP error:', err);
        res.status(500).json({ message: 'OTP verification failed' });
    }
});
// 9. Reset password
router.post('/reset-password', async (req, res) => {
    console.log('🔍 [RESET] request body:', req.body);
    const { email, otp: code, password, newPassword } = req.body;
    const pwd = password ?? newPassword;
    if (!email || !code || !pwd)
        return res
            .status(400)
            .json({ message: 'Email, OTP, and password are required.' });
    try {
        console.log('⏺️ [RESET] called with:', { email, code, pwd });
        const record = await Otp_1.default.findOne({ email, code, purpose: 'reset' });
        if (!record || record.expiresAt < new Date()) {
            if (record)
                await record.deleteOne();
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
        let user = (await Patient_1.default.findOne({ email })) || (await Doctor_1.default.findOne({ email }));
        if (!user) {
            await record.deleteOne();
            return res.status(404).json({ message: 'User not found.' });
        }
        user.passwordHash = await bcryptjs_1.default.hash(pwd, 10);
        await user.save();
        console.log('🔐 [RESET] saved hash:', user.passwordHash);
        const fresh = await (user instanceof Patient_1.default
            ? Patient_1.default.findById(user._id)
            : Doctor_1.default.findById(user._id));
        console.log('🔐 [RESET] fresh from DB:', fresh?.passwordHash);
        await record.deleteOne();
        console.log('✅ [RESET] Password updated for:', email);
        res.sendStatus(200);
    }
    catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Password reset failed.' });
    }
});
// 10. Deactivate account
router.put('/user/deactivate', exports.authenticateJWT, async (req, res) => {
    const user = req.user;
    try {
        user.isActive = false;
        await user.save();
        res.json({ message: 'Account has been deactivated.' });
    }
    catch (err) {
        console.error('Deactivate account error:', err);
        res.status(500).json({ message: 'Failed to deactivate account' });
    }
});
// 11. Delete account
router.delete('/user', exports.authenticateJWT, async (req, res) => {
    const user = req.user;
    const role = req.role;
    const { password: delPwd } = req.body;
    if (!delPwd)
        return res.status(400).json({ message: 'Password required for deletion' });
    try {
        const isMatch = bcryptjs_1.default.hashSync(delPwd, user.passwordHash) === user.passwordHash;
        if (!isMatch)
            return res.status(400).json({ message: 'Incorrect password.' });
        if (role === 'patient') {
            await Patient_1.default.deleteOne({ _id: user._id });
        }
        else {
            await Doctor_1.default.deleteOne({ _id: user._id });
        }
        res.json({ message: 'Account has been deleted successfully.' });
    }
    catch (err) {
        console.error('Delete account error:', err);
        res.status(500).json({ message: 'Failed to delete account' });
    }
});
// ─── GOOGLE OAUTH ROUTES ───────────────────────────────────────────────────────
// Google signup (get temp token)
router.post('/google/signup', async (req, res) => {
    const { token: idToken } = req.body;
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
        const exists = (await Patient_1.default.findOne({ email })) || (await Doctor_1.default.findOne({ email }));
        if (exists) {
            return res
                .status(409)
                .json({ message: 'An account already exists with this email.' });
        }
        const tempToken = signJwt({ email, fullName, googleId, source: 'google-signup' }, '15m');
        res.json({ tempToken, frontendUrl: FRONTEND_URL });
    }
    catch (err) {
        console.error('Google signup error:', err);
        res.status(400).json({ message: 'Invalid or expired ID token' });
    }
});
// Google complete signup
router.post('/google/complete-signup', async (req, res) => {
    const { token: tempToken, role } = req.body;
    if (!tempToken || !role) {
        return res.status(400).json({ message: 'Missing token or role' });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(tempToken, JWT_SECRET);
        if (payload.source !== 'google-signup' ||
            !payload.email ||
            !payload.googleId) {
            return res.status(400).json({ message: 'Invalid token' });
        }
        const { email, fullName, googleId } = payload;
        const already = (await Patient_1.default.findOne({ email })) || (await Doctor_1.default.findOne({ email }));
        if (already) {
            return res
                .status(409)
                .json({ message: 'An account already exists with this email.' });
        }
        if (role === 'patient') {
            await new Patient_1.default({
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
        else {
            await new Doctor_1.default({
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
    }
    catch (err) {
        console.error('Complete Google signup error:', err);
        res.status(400).json({ message: 'Invalid or expired token' });
    }
});
// Google login
router.post('/google/login', async (req, res) => {
    const { token: idToken } = req.body;
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
        let user;
        let role = 'patient';
        user = await Patient_1.default.findOne({ googleId });
        if (!user) {
            user = await Patient_1.default.findOne({ email });
        }
        if (!user) {
            const doc = await Doctor_1.default.findOne({ googleId }) || await Doctor_1.default.findOne({ email });
            if (doc) {
                user = doc;
                role = 'doctor';
            }
        }
        if (!user) {
            return res.status(404).json({ message: 'No account found. Please sign up.' });
        }
        if (!user.isActive || !user.isVerified) {
            return res.status(403).json({ message: 'Account inactive or not verified' });
        }
        if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }
        const appJwt = signJwt({ id: user._id.toString(), role }, '1d');
        res.json({ token: appJwt, role });
    }
    catch (err) {
        console.error('Google login error:', err);
        res.status(400).json({ message: 'Invalid or expired ID token' });
    }
});
exports.default = router;
