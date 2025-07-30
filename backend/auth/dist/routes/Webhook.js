"use strict";
// File: backend/src/routes/Webhook.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const Notification_1 = __importDefault(require("../models/Notification"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Payment_1 = require("../models/Payment");
const wallet_1 = require("../models/wallet");
const Doctor_1 = __importDefault(require("../models/Doctor"));
const Patient_1 = __importDefault(require("../models/Patient"));
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
async function razorpayWebhookHandler(req, res) {
    try {
        const sig = req.headers['x-razorpay-signature'];
        const bodyBuffer = req.body;
        const bodyString = bodyBuffer.toString('utf8');
        const generatedSig = crypto_1.default.createHmac('sha256', webhookSecret).update(bodyString).digest('hex');
        if (generatedSig !== sig) {
            console.warn('Invalid Razorpay webhook signature');
            return res.status(400).send('Invalid signature');
        }
        const event = JSON.parse(bodyString);
        const eventType = event.event;
        const payload = event.payload;
        if (eventType === 'payment.captured') {
            const paymentEntity = payload.payment.entity;
            const razorpayPaymentId = paymentEntity.id;
            const amountPaise = paymentEntity.amount;
            const notes = paymentEntity.notes || {};
            const appointmentId = notes.appointmentId;
            const patientId = notes.patientId;
            const doctorId = notes.doctorId;
            // Update Payment record
            const amountRupees = amountPaise / 100;
            let paymentDoc = await Payment_1.Payment.findOne({ orderId: paymentEntity.order_id });
            if (!paymentDoc) {
                paymentDoc = new Payment_1.Payment({
                    orderId: paymentEntity.order_id,
                    paymentId: razorpayPaymentId,
                    appointmentId,
                    patientId,
                    doctorId,
                    amount: amountRupees,
                    currency: paymentEntity.currency,
                    status: 'captured',
                    rawPayload: event,
                });
            }
            else {
                paymentDoc.paymentId = razorpayPaymentId;
                paymentDoc.status = 'captured';
                paymentDoc.rawPayload = event;
            }
            await paymentDoc.save();
            // Update Appointment status to a valid enum, e.g., 'scheduled'
            const appt = await Appointment_1.default.findById(appointmentId);
            if (appt) {
                appt.status = 'scheduled';
                appt.razorpayOrderId = paymentEntity.order_id;
                appt.razorpayPaymentId = razorpayPaymentId;
                appt.paymentStatus = 'paid';
                await appt.save();
            }
            // Credit doctor wallet
            let wallet = await wallet_1.Wallet.findOne({ doctorId });
            if (!wallet) {
                wallet = new wallet_1.Wallet({ doctorId, balance: 0, transactions: [] });
            }
            wallet.balance += amountRupees;
            wallet.transactions.push({
                amount: amountRupees,
                type: 'credit',
                timestamp: new Date(),
                metadata: { paymentId: razorpayPaymentId, appointmentId },
            });
            await wallet.save();
            // Create notifications:
            const doctor = await Doctor_1.default.findById(doctorId);
            const patient = await Patient_1.default.findById(patientId);
            const apptDate = appt?.datetime;
            const formattedDate = apptDate
                ? new Date(apptDate).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                })
                : '';
            if (doctor) {
                const msg = `You received ₹${amountRupees} for appointment with ${patient?.name || 'patient'} on ${formattedDate}.`;
                await new Notification_1.default({
                    userId: doctor._id,
                    type: 'payment_received',
                    message: msg,
                    read: false,
                    createdAt: new Date(),
                }).save();
            }
            if (patient) {
                const msgPt = `Your payment of ₹${amountRupees} for appointment with Dr. ${doctor?.name || 'doctor'} on ${formattedDate} was successful.`;
                await new Notification_1.default({
                    userId: patient._id,
                    type: 'payment_success',
                    message: msgPt,
                    read: false,
                    createdAt: new Date(),
                }).save();
            }
        }
        else {
            console.log(`Unhandled Razorpay webhook event: ${eventType}`);
        }
        res.status(200).json({ status: 'ok' });
    }
    catch (err) {
        console.error('Error in Razorpay webhook handler:', err);
        res.status(500).send('Server error');
    }
}
exports.default = razorpayWebhookHandler;
