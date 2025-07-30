"use strict";
// File: backend/auth/src/utils/sendMail.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendMail = async ({ to, subject, text }) => {
    await transporter.sendMail({
        from: `"MedicoX Alerts" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
    });
};
exports.sendMail = sendMail;
