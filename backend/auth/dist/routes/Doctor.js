"use strict";
// File: backend/src/routes/doctor.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const auth_1 = require("./auth");
const razorpayClient_1 = __importDefault(require("../utils/razorpayClient"));
const router = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage }); // in‐memory storage so req.file.buffer is available
// Rate limiter for Razorpay onboarding
const onboardingLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many onboarding attempts. Try again later.',
});
// Middleware: ensure the user is a doctor
const authorizeDoctor = (req, res, next) => {
    if (req.role !== 'doctor') {
        return res.status(403).json({ message: 'Only doctors are allowed' });
    }
    next();
};
/**
 * GET /api/doctor/profile
 * — Return the authenticated doctor’s profile (excluding __v).
 */
router.get('/profile', auth_1.authenticateJWT, authorizeDoctor, async (req, res) => {
    try {
        const doctorId = req.user._id;
        const doctor = await Doctor_1.default.findById(doctorId)
            .select('-__v')
            .lean();
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        // Ensure _id is stringified for frontend consumption
        return res.json({ ...doctor, _id: doctor._id.toString() });
    }
    catch (err) {
        console.error('Error fetching doctor profile:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});
router.get('/me/profile-image', auth_1.authenticateJWT, authorizeDoctor, async (req, res) => {
    try {
        const doctorId = req.user._id;
        const doctor = await Doctor_1.default.findById(doctorId).select('profileImage');
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        if (!doctor.profileImage || !doctor.profileImage.data) {
            return res.status(404).json({ error: 'Profile image not found' });
        }
        res.set('Content-Type', doctor.profileImage.contentType || 'image/jpeg');
        return res.send(doctor.profileImage.data);
    }
    catch (err) {
        console.error('Error fetching own profile image:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});
/**
 * GET /api/doctor/:id/profile-image
 * — Serve the stored profile image binary for any doctor.
 */
router.get('/:id/profile-image', async (req, res) => {
    try {
        const doctor = await Doctor_1.default.findById(req.params.id).select('profileImage');
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        if (!doctor.profileImage || !doctor.profileImage.data) {
            return res.status(404).json({ error: 'Profile image not found' });
        }
        res.set('Content-Type', doctor.profileImage.contentType || 'image/jpeg');
        return res.send(doctor.profileImage.data);
    }
    catch (err) {
        console.error('Error fetching profile image:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});
/**
 * PUT /api/doctor/me
 * — Update own profile: specialty, experience, fee, bio, slots, photo, etc.
 */
router.put('/me', auth_1.authenticateJWT, authorizeDoctor, upload.single('profileImage'), async (req, res) => {
    try {
        const doctorId = req.user._id;
        const { specialty, experience, consultationFee, maxPatients, hospitalAffiliation, bio, availabilitySlots // JSON‑stringified array of ISO datetimes
         } = req.body;
        const doctor = await Doctor_1.default.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        // — Update simple fields if provided
        if (specialty !== undefined)
            doctor.specialty = specialty;
        if (experience !== undefined)
            doctor.experience = experience;
        if (consultationFee !== undefined)
            doctor.consultationFee = Number(consultationFee);
        if (maxPatients !== undefined)
            doctor.maxPatients = Number(maxPatients);
        if (hospitalAffiliation !== undefined)
            doctor.hospitalAffiliation = hospitalAffiliation;
        if (bio !== undefined)
            doctor.bio = bio;
        // — Handle profile image upload
        if (req.file) {
            doctor.profileImage = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            };
        }
        // — Parse and update availabilitySlots
        if (availabilitySlots !== undefined) {
            let slotsParsed;
            try {
                slotsParsed = JSON.parse(availabilitySlots);
            }
            catch {
                return res.status(400).json({ message: 'Invalid JSON for availabilitySlots' });
            }
            if (!Array.isArray(slotsParsed)) {
                return res.status(400).json({ message: 'availabilitySlots must be an array' });
            }
            // Map ISO strings to your schema shape
            doctor.availabilitySlots = slotsParsed.map((iso) => {
                const dt = new Date(iso);
                if (isNaN(dt.getTime()))
                    throw new Error(`Invalid date: ${iso}`);
                return {
                    datetime: dt,
                    quantity: doctor.maxPatients,
                };
            });
        }
        await doctor.save();
        return res.status(200).json({ message: 'Profile updated successfully' });
    }
    catch (err) {
        console.error('Error updating doctor profile:', err);
        if (err.message?.startsWith('Invalid date:')) {
            return res.status(400).json({ message: err.message });
        }
        return res.status(500).json({ message: 'Failed to update profile' });
    }
});
/**
 * POST /api/doctor/onboard-razorpay
 * — Onboard doctor for payouts via Razorpay (contact + fund account).
 */
router.post('/onboard-razorpay', auth_1.authenticateJWT, authorizeDoctor, onboardingLimiter, express_1.default.json(), async (req, res) => {
    try {
        const doctorId = req.user._id;
        const { name, email, contact, bankAccountNumber, ifsc } = req.body;
        if (!name || !email || !contact || !bankAccountNumber || !ifsc) {
            return res.status(400).json({
                message: 'All fields required: name, email, contact, bankAccountNumber, ifsc'
            });
        }
        const doc = await Doctor_1.default.findById(doctorId);
        if (!doc) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        // If already onboarded, return existing IDs
        if (doc.razorpayContactId && doc.razorpayFundAccountId) {
            return res.json({
                message: 'Already onboarded',
                razorpayContactId: doc.razorpayContactId,
                razorpayFundAccountId: doc.razorpayFundAccountId,
            });
        }
        // 1. Create Razorpay Contact
        const contactResp = await razorpayClient_1.default.contacts.create({
            name,
            email,
            contact,
            type: 'vendor',
        });
        // 2. Create Fund Account
        const fundResp = await razorpayClient_1.default.fundAccounts.create({
            contact_id: contactResp.id,
            account_type: 'bank_account',
            bank_account: {
                name,
                ifsc,
                account_number: bankAccountNumber,
            },
        });
        doc.razorpayContactId = contactResp.id;
        doc.razorpayFundAccountId = fundResp.id;
        await doc.save();
        return res.json({
            message: 'Onboarding successful',
            razorpayContactId: contactResp.id,
            razorpayFundAccountId: fundResp.id,
        });
    }
    catch (error) {
        console.error('Razorpay onboarding error:', error);
        return res.status(500).json({ message: 'Failed to onboard for payouts' });
    }
});
exports.default = router;
