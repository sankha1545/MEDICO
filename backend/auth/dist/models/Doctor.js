"use strict";
// File: backend/src/models/Doctor.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const LocationSchema = new mongoose_1.Schema({
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
}, { _id: false });
const DoctorSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please fill a valid email address'],
    },
    passwordHash: { type: String, required: true },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['doctor'], default: 'doctor' },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    isVerified: { type: Boolean, default: false },
    specialty: { type: String, default: '' },
    phone: { type: String, default: '' },
    dob: { type: Date },
    profileImage: {
        data: { type: Buffer, required: false },
        contentType: { type: String, required: false },
    },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    experience: { type: String, default: '' },
    hospitalAffiliation: { type: String, default: '' },
    location: { type: String, default: '' },
    locationObj: { type: LocationSchema, required: false },
    slotDateTime: { type: Date },
    availabilitySlots: [
        {
            datetime: { type: Date, required: true },
            quantity: { type: Number, default: 1 }, // or optional
        }
    ],
    maxPatients: { type: Number, default: 1, min: 1 },
    bio: { type: String, default: '' },
    qualifications: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    razorpayContactId: { type: String, default: null },
    razorpayFundAccountId: { type: String, default: null },
    consultationFee: { type: Number, default: 500, min: 0 },
    isActive: { type: Boolean, default: true },
    deleteAttempts: { type: Number, default: 0 },
    deleteLockedUntil: { type: Date, default: null },
}, {
    collection: 'doctors',
    timestamps: true,
});
// Indexes to prevent duplicate emails (triggers 11000 error code on insert/update)
DoctorSchema.index({ email: 1 }, { unique: true });
DoctorSchema.index({ googleId: 1 }, { unique: true, sparse: true });
// Remove sensitive fields from JSON output
DoctorSchema.set('toJSON', {
    transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        if (ret.profileImage) {
            delete ret.profileImage.data;
        }
        return ret;
    },
});
// Pre-save hook: hash raw password exactly once
DoctorSchema.pre('save', async function (next) {
    next();
});
// Instance method to compare a candidate password against the stored hash
DoctorSchema.methods.comparePassword = function (candidate) {
    if (!this.passwordHash)
        return Promise.resolve(false);
    return bcryptjs_1.default.compare(candidate, this.passwordHash);
};
exports.default = mongoose_1.default.model('Doctor', DoctorSchema);
