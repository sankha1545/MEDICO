"use strict";
// File: backend/src/routes/medicalinfo.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const MedicalInfo_1 = __importDefault(require("../models/MedicalInfo"));
const auth_1 = require("./auth");
const router = express_1.default.Router();
/**
 * GET /api/medicalinfo/me
 * — Return the patient's medical info, or 404 if none exists yet.
 */
router.get('/me', auth_1.authenticateJWT, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const info = await MedicalInfo_1.default.findOne({ user: userId }).lean();
        if (!info) {
            return res.status(404).json({ message: 'No medical info found' });
        }
        return res.json(info);
    }
    catch (err) {
        console.error('Error fetching medical info:', err);
        return next(err);
    }
});
/**
 * PUT /api/medicalinfo/me
 * — Upsert the patient’s medical info.
 */
router.put('/me', auth_1.authenticateJWT, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { bloodType, allergies, currentMedications, medicalConditions } = req.body;
        const info = await MedicalInfo_1.default.findOneAndUpdate({ user: userId }, { bloodType, allergies, currentMedications, medicalConditions }, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }).lean();
        return res.json(info);
    }
    catch (err) {
        console.error('Error updating medical info:', err);
        return next(err);
    }
});
exports.default = router;
