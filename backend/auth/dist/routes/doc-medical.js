"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("./auth");
const Doctor_1 = __importDefault(require("../models/Doctor"));
const router = express_1.default.Router();
/**
 * GET /api/medical/doctors
 * Public or protected—returns list of basic doctor info.
 */
router.get('/doctors', async (req, res) => {
    try {
        const docs = await Doctor_1.default.find().select('name specialty rating reviewCount experience hospitalAffiliation location availableSlots nextAvailable profileImage');
        // Map each to the shape your frontend expects
        const list = docs.map((d) => ({
            id: d._id,
            name: d.name,
            specialty: d.specialty,
            rating: d.rating ?? 4.5,
            reviewCount: d.reviewCount ?? 12,
            experience: d.experience ?? '10 years',
            hospitalAffiliation: d.hospitalAffiliation ?? 'General Hospital',
            location: d.location ?? 'Unknown',
            availableSlots: d.availableSlots ?? 3,
            nextAvailable: d.nextAvailable ?? 'Tomorrow 10:00 AM',
            image: d.profileImage?.data && d.profileImage.contentType
                ? `data:${d.profileImage.contentType};base64,${d.profileImage.data.toString('base64')}`
                : `${process.env.FRONTEND_URL}/default-doctor.png`,
        }));
        res.json(list);
    }
    catch (err) {
        console.error('Error fetching doctors list:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
/**
 * GET /api/medical/doctors/:id
 * Protected by JWT, returns full doctor document for profile modal.
 */
router.get('/doctors/:id', auth_1.authenticateJWT, async (req, res) => {
    try {
        const d = await Doctor_1.default.findById(req.params.id);
        if (!d)
            return res.status(404).json({ message: 'Doctor not found' });
        // Build response shape (include any extra fields)
        const profile = {
            id: d._id,
            name: d.name,
            specialty: d.specialty,
            rating: d.rating ?? 4.5,
            reviewCount: d.reviewCount ?? 12,
            experience: d.experience ?? '10 years',
            hospitalAffiliation: d.hospitalAffiliation ?? 'General Hospital',
            location: d.location ?? 'Unknown',
            availableSlots: d.availableSlots ?? 3,
            nextAvailable: d.nextAvailable ?? 'Tomorrow 10:00 AM',
            image: d.profileImage?.data && d.profileImage.contentType
                ? `data:${d.profileImage.contentType};base64,${d.profileImage.data.toString('base64')}`
                : `${process.env.FRONTEND_URL}/default-doctor.png`,
            bio: d.bio || '',
            qualifications: d.qualifications || [],
            languages: d.languages || [],
        };
        res.json(profile);
    }
    catch (err) {
        console.error('Error fetching doctor profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
