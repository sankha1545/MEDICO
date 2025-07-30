"use strict";
// File: backend/src/routes/payment.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const razorpayClient_1 = __importDefault(require("../utils/razorpayClient"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Payment_1 = require("../models/Payment");
const Notification_1 = __importDefault(require("../models/Notification"));
const auth_1 = require("./auth");
const router = express_1.default.Router();
/**
 * POST /api/payments/create-order
 * Body: { doctorId: string, datetime: string (ISO), message?: string }
 * Creates:
 *  - Appointment (status 'pending')
 *  - Razorpay order
 *  - Payment record
 *  - Notifications:
 *      * For doctor: “New appointment request from <patientName> on <date>”
 *      * For patient: “Appointment request created for Dr. <doctorName> on <date>. Please complete payment.”
 */
router.post('/create-order', auth_1.authenticateJWT, async (req, res) => {
    console.log('==> [create-order] body:', req.body);
    try {
        const user = req.user; // patient
        const role = req.role;
        if (role !== 'patient') {
            return res.status(403).json({ message: 'Only patients can pay' });
        }
        const { doctorId, datetime, message } = req.body;
        if (!doctorId || !datetime) {
            return res.status(400).json({ message: 'doctorId and datetime are required' });
        }
        // Fetch doctor
        const doctor = await Doctor_1.default.findById(doctorId).exec();
        if (!doctor || !doctor.isActive) {
            return res.status(404).json({ message: 'Doctor not found or inactive' });
        }
        // Validate datetime
        const dt = new Date(datetime);
        if (isNaN(dt.getTime()) || dt <= new Date()) {
            return res.status(400).json({ message: 'Invalid or past datetime' });
        }
        // Determine fee
        const fee = typeof doctor.consultationFee === 'number'
            ? doctor.consultationFee
            : 0;
        const amountPaise = Math.round(fee * 100);
        // Create pending Appointment: ensure schema fields match (datetime, amount required)
        const appt = new Appointment_1.default({
            doctor: doctorId,
            patient: user._id,
            datetime: dt,
            amount: fee,
            currency: 'INR',
            status: 'pending',
            message: message || '',
            // ...any other required fields
        });
        await appt.save();
        const appointmentId = appt._id.toString();
        console.log('    Created pending appointment:', appointmentId);
        // Create notifications about the new appointment request
        // 1. Patient notification
        const patientName = user.name || 'You';
        const doctorName = doctor.name || 'Doctor';
        const formattedDate = dt.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short',
        });
        const notifPatientMsg = `Appointment request created for Dr. ${doctorName} on ${formattedDate}. Please complete payment.`;
        await new Notification_1.default({
            userId: user._id,
            type: 'appointment_requested',
            message: notifPatientMsg,
            read: false,
            createdAt: new Date(),
        }).save();
        // 2. Doctor notification
        const notifDoctorMsg = `New appointment request from ${patientName} on ${formattedDate}.`;
        await new Notification_1.default({
            userId: doctor._id,
            type: 'appointment_requested',
            message: notifDoctorMsg,
            read: false,
            createdAt: new Date(),
        }).save();
        // Prepare Razorpay order
        const receiptId = `receipt_${crypto_1.default.randomBytes(8).toString('hex')}`;
        const orderOptions = {
            amount: amountPaise,
            currency: 'INR',
            receipt: receiptId,
            payment_capture: 1,
            notes: {
                appointmentId,
                patientId: user._id.toString(),
                doctorId,
            },
        };
        console.log('    Razorpay orderOptions:', orderOptions);
        const order = await razorpayClient_1.default.orders.create(orderOptions);
        console.log('    Razorpay order created:', order.id);
        // Persist Payment record
        const paymentDoc = new Payment_1.Payment({
            orderId: order.id,
            appointmentId,
            patientId: user._id,
            doctorId,
            amount: fee,
            currency: order.currency || 'INR',
            status: 'created',
            receipt: receiptId,
            rawPayload: order,
        });
        await paymentDoc.save();
        console.log('    Payment record saved:', paymentDoc._id);
        // Respond with details for frontend
        return res.json({
            appointmentId,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency || 'INR',
            keyId: process.env.RAZORPAY_KEY_ID, // frontend uses this
        });
    }
    catch (err) {
        console.error('Error in create-order:', err);
        return res.status(500).json({ message: 'Failed to create payment order' });
    }
});
exports.default = router;
