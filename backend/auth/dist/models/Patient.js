"use strict";
// File: backend/src/models/Patient.ts
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
const PatientSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
    },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['patient'], default: 'patient' },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    isVerified: { type: Boolean, default: false },
    phone: { type: String, default: '' },
    dob: { type: Date },
    profileImage: {
        data: Buffer,
        contentType: String,
    },
    isActive: { type: Boolean, default: true },
    deleteAttempts: { type: Number, default: 0 },
    deleteLockedUntil: { type: Date, default: null },
    notificationSettings: {
        emailAppointments: { type: Boolean, default: true },
        emailDoctorMessages: { type: Boolean, default: true },
        emailPromotions: { type: Boolean, default: false },
        smsAlerts: { type: Boolean, default: false },
        smsPhone: { type: String, default: '' },
        smsCarrierDomain: { type: String, default: '' },
        inAppNotifications: { type: Boolean, default: true },
    },
}, {
    collection: 'patients',
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// 🔑 Virtual password field (not saved)
PatientSchema.virtual('password')
    .set(function (password) {
    this._password = password;
})
    .get(function () {
    return this._password;
});
// 🔒 Pre-save hash logic — only hash `password` (not passwordHash)
PatientSchema.pre('save', async function (next) {
    try {
        if (this.isModified('password') && this.password) {
            const salt = await bcryptjs_1.default.genSalt(10);
            this.passwordHash = await bcryptjs_1.default.hash(this.password, salt);
        }
        next();
    }
    catch (err) {
        next(err);
    }
});
// 🧠 Add method to compare password input to stored hash
PatientSchema.methods.comparePassword = function (password) {
    if (!this.passwordHash)
        return Promise.resolve(false);
    return bcryptjs_1.default.compare(password, this.passwordHash);
};
// 📷 Avatar URL virtual
PatientSchema.virtual('profileImageUrl').get(function () {
    if (this.profileImage && this._id) {
        return `/api/patients/${this._id}/avatar`;
    }
    return undefined;
});
// 🧼 Strip sensitive fields
PatientSchema.set('toJSON', {
    transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        if (ret.profileImage)
            delete ret.profileImage.data;
        return ret;
    },
    virtuals: true,
});
// Indexes
PatientSchema.index({ email: 1 }, { unique: true });
PatientSchema.index({ googleId: 1 }, { unique: true, sparse: true });
exports.default = mongoose_1.default.model('Patient', PatientSchema);
