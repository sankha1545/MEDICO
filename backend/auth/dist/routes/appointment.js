"use strict";
// File: backend/src/routes/appointment.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const Notification_1 = __importDefault(require("../models/Notification"));
const razorpayClient_1 = __importDefault(require("../utils/razorpayClient"));
const auth_1 = require("./auth");
const generatePrescriptionPdf_1 = require("../utils/generatePrescriptionPdf");
const email_1 = require("../utils/email");
const router = express_1.default.Router();
/**
 * GET /api/appointments/slots/:doctorId
 * — Return each future availability slot plus how many seats remain. **/
router.put('/:id/status', auth_1.authenticateJWT, async (req, res) => {
    try {
        const apptId = req.params.id;
        const { status } = req.body;
        const validStatuses = ['pending', 'scheduled', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        // Find the appointment
        const appointment = await Appointment_1.default.findById(apptId);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        // Optional: enforce that only the patient or the doctor can update it
        // if (String(appointment.patient) !== String(req.user._id) &&
        //     String(appointment.doctor)  !== String(req.user._id)) {
        //   return res.status(403).json({ message: 'Not authorized' });
        // }
        // Update and save
        appointment.status = status;
        await appointment.save();
        res.json({ success: true, appointment });
    }
    catch (err) {
        console.error('Error updating appointment status:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/slots/:doctorId', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { doctorId } = req.params;
        const doctor = await Doctor_1.default.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        const now = new Date();
        // Normalize slots: support both Date strings or objects with { datetime, quantity }
        const normalized = doctor.availabilitySlots.map((slot) => {
            if (slot && typeof slot === 'object' && slot.datetime) {
                return {
                    datetime: slot.datetime,
                    quantity: slot.quantity,
                };
            }
            else {
                return {
                    datetime: slot,
                    quantity: undefined,
                };
            }
        });
        const slotsData = await Promise.all(normalized
            .filter((s) => new Date(s.datetime) > now) // only future slots
            .map(async (s) => {
            const slotDate = new Date(s.datetime);
            const bookedCount = await Appointment_1.default.countDocuments({
                doctor: doctorId,
                datetime: slotDate,
                status: { $ne: 'cancelled' },
            });
            // capacity from quantity override or doctor's maxPatients
            const capacity = s.quantity ?? doctor.maxPatients ?? 1;
            const remaining = Math.max(0, capacity - bookedCount);
            return {
                slot: slotDate.toISOString(),
                remaining,
                total: capacity,
            };
        }));
        // Debug logging
        console.log('Doctor availabilitySlots:', doctor.availabilitySlots);
        console.log('Computed slotsData:', slotsData);
        // Filter out fully booked slots
        const filteredSlots = slotsData.filter((s) => s.remaining > 0);
        console.log('Slots to return:', filteredSlots);
        return res.json(filteredSlots);
    }
    catch (error) {
        console.error('Error fetching slots:', error);
        return res.status(500).json({ message: 'Failed to fetch slots' });
    }
});
/**
 * POST /api/appointments/confirm-after-payment
 * — Verify Razorpay signature, re‐check capacity atomically, and mark appointment as scheduled.
 */
router.post('/confirm-after-payment', auth_1.authenticateJWT, async (req, res, next) => {
    try {
        const user = req.user;
        const role = req.role;
        if (role !== 'patient') {
            return res.status(403).json({ message: 'Only patients can confirm appointment' });
        }
        const { appointmentId, razorpay_payment_id, razorpay_order_id, razorpay_signature, } = req.body;
        if (!appointmentId ||
            !razorpay_payment_id ||
            !razorpay_order_id ||
            !razorpay_signature) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        // Verify webhook signature
        const expected = crypto_1.default
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');
        if (expected !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid signature' });
        }
        // Load the appointment record
        const appt = await Appointment_1.default.findById(appointmentId);
        if (!appt) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        if (appt.patient.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized for this appointment' });
        }
        // Load doctor's slot definitions
        const doc = await Doctor_1.default.findById(appt.doctor, 'availabilitySlots maxPatients').lean();
        if (!doc) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        // Find the matching slot definition
        const slotDef = doc.availabilitySlots.find((s) => new Date(s.datetime).getTime() === appt.datetime.getTime());
        const capacity = slotDef?.quantity ?? doc.maxPatients;
        // Count current bookings
        const existing = await Appointment_1.default.countDocuments({
            doctor: appt.doctor,
            datetime: appt.datetime,
            status: { $ne: 'cancelled' },
        });
        if (existing >= capacity) {
            return res.status(409).json({ message: 'Sorry, this slot has just filled up.' });
        }
        // All good: mark scheduled & paid
        appt.status = 'scheduled';
        appt.paymentStatus = 'paid';
        appt.razorpayOrderId = razorpay_order_id;
        appt.razorpayPaymentId = razorpay_payment_id;
        await appt.save();
        // Notify patient
        try {
            const slotStr = appt.datetime.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short',
            });
            await Notification_1.default.create({
                userId: appt.patient,
                type: 'payment_confirmed',
                message: `Your appointment on ${slotStr} has been confirmed.`,
                read: false,
                createdAt: new Date(),
            });
        }
        catch (notifErr) {
            console.error('Notification error:', notifErr);
        }
        return res.json({ appointmentId: appt._id });
    }
    catch (err) {
        console.error('Error in confirm-after-payment:', err);
        return res.status(500).json({ message: 'Failed to confirm appointment' });
    }
});
/**
 * GET /api/appointments
 * — Patient’s own appointments
 */
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const user = req.user;
        if (req.role !== 'patient') {
            return res.status(403).json({ message: 'Only patients can view their appointments' });
        }
        const appts = await Appointment_1.default.find({ patient: user._id })
            .populate('doctor', 'name specialty profileImageUrl')
            .sort({ datetime: -1 })
            .lean();
        const result = appts.map((a) => ({
            _id: a._id.toString(),
            doctor: {
                _id: a.doctor._id.toString(),
                name: a.doctor.name,
                specialty: a.doctor.specialty,
                profileImageUrl: a.doctor.profileImageUrl,
            },
            datetime: a.datetime.toISOString(),
            status: a.status,
        }));
        return res.json(result);
    }
    catch (err) {
        console.error('Error fetching patient appointments:', err);
        return res.status(500).json({ message: 'Failed to fetch appointments' });
    }
});
/**
 * GET /api/appointments/doctor
 * — Doctor’s upcoming appointments
 */
router.get('/doctor', auth_1.authenticateJWT, async (req, res) => {
    try {
        const user = req.user;
        if (req.role !== 'doctor') {
            return res.status(403).json({ message: 'Only doctors can view their appointments' });
        }
        const appts = await Appointment_1.default.find({
            doctor: user._id,
            status: { $ne: 'cancelled' },
        })
            .populate('patient', 'name')
            .sort({ datetime: -1 })
            .lean();
        const result = appts.map((a) => ({
            id: a._id.toString(),
            patientName: a.patient.name,
            date: a.datetime.toISOString(),
            status: a.status === 'scheduled' ? 'upcoming' : a.status,
            amount: a.amount, // ← include the stored snapshot amount here
        }));
        return res.json(result);
    }
    catch (err) {
        console.error('Error fetching doctor appointments:', err);
        return res.status(500).json({ message: 'Failed to fetch appointments' });
    }
});
/**
 * GET /api/appointments/:id
 * — Doctor views single appointment detail
 */
router.get('/:id', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const role = req.role;
        if (role !== 'doctor') {
            return res.status(403).json({ message: 'Only doctors can access this route' });
        }
        const appointment = await Appointment_1.default.findById(id)
            .populate('patient', 'name email phone message')
            .lean();
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        const p = appointment.patient;
        return res.json({
            _id: appointment._id.toString(),
            datetime: appointment.datetime,
            status: appointment.status,
            message: appointment.message,
            patient: {
                name: p.name,
                email: p.email,
                phone: p.phone,
                message: p.message,
            },
        });
    }
    catch (err) {
        console.error('Error fetching appointment by ID:', err);
        return res.status(500).json({ message: 'Failed to fetch appointment details' });
    }
});
/**
 * POST /api/appointments/cancel-slot
 * — Doctor cancels all appointments in a given slot (hour window)
 */
router.post('/cancel-slot', auth_1.authenticateJWT, async (req, res) => {
    try {
        const user = req.user;
        const role = req.role;
        const { slotLabel } = req.body;
        if (role !== 'doctor') {
            return res.status(403).json({ message: 'Only doctors can cancel slots' });
        }
        if (!slotLabel || typeof slotLabel !== 'string') {
            return res
                .status(400)
                .json({ message: 'slotLabel is required and must be a string' });
        }
        const slotDate = new Date(slotLabel);
        if (isNaN(slotDate.getTime())) {
            return res
                .status(400)
                .json({ message: 'Invalid slotLabel format. Must be ISO 8601 string.' });
        }
        const start = new Date(slotDate);
        const end = new Date(slotDate);
        end.setMinutes(end.getMinutes() + 59);
        const appts = await Appointment_1.default.find({
            doctor: user._id,
            datetime: { $gte: start, $lte: end },
            status: { $ne: 'cancelled' },
        }).populate('patient', 'email');
        let cancelledCount = 0;
        let refundedCount = 0;
        const errors = [];
        for (const appt of appts) {
            try {
                appt.status = 'cancelled';
                if (appt.razorpayPaymentId) {
                    appt.paymentStatus = 'refunded';
                }
                await appt.save();
                cancelledCount++;
                if (appt.razorpayPaymentId) {
                    try {
                        await razorpayClient_1.default.payments.refund(appt.razorpayPaymentId, {
                            amount: Math.round((appt.amount || 0) * 100),
                        });
                        refundedCount++;
                    }
                    catch (refundErr) {
                        console.error(`Refund failed for ${appt._id}:`, refundErr);
                        errors.push(`Refund failed for ${appt._id}: ${refundErr.message}`);
                    }
                }
                const slotStr = slotDate.toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                });
                const notifMsg = appt.razorpayPaymentId
                    ? `Your appointment on ${slotStr} has been cancelled and refunded.`
                    : `Your appointment on ${slotStr} has been cancelled.`;
                await Notification_1.default.create({
                    userId: appt.patient,
                    type: 'appointment_cancelled',
                    message: notifMsg,
                    read: false,
                    createdAt: new Date(),
                });
                const email = appt.patient?.email;
                if (email) {
                    try {
                        await (0, email_1.sendNotificationEmail)(email, 'Appointment Cancelled', notifMsg);
                    }
                    catch (emailErr) {
                        console.error(`Email failed for ${appt._id}:`, emailErr);
                        errors.push(`Email failed for ${appt._id}: ${emailErr.message}`);
                    }
                }
                else {
                    errors.push(`No email found for patient ${appt.patient}`);
                }
            }
            catch (err) {
                console.error(`Error processing appointment ${appt._id}:`, err);
                errors.push(`${appt._id}: ${err.message}`);
            }
        }
        return res.status(200).json({
            message: `Cancelled ${cancelledCount} appointments, ${refundedCount} refunded.`,
            cancelledCount,
            refundedCount,
            errors,
        });
    }
    catch (err) {
        console.error('Error in /cancel-slot:', err);
        return res
            .status(500)
            .json({ message: 'Internal server error while cancelling slot' });
    }
});
/**
 * POST /api/appointments/:id/cancel
 * — Doctor cancels a single appointment
 */
router.post('/:id/cancel', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const role = req.role;
        if (role !== 'doctor') {
            return res.status(403).json({ message: 'Only doctors can cancel appointments' });
        }
        const appt = await Appointment_1.default.findById(id);
        if (!appt) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        if (appt.doctor.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
        }
        if (appt.status !== 'cancelled') {
            appt.status = 'cancelled';
            if (appt.razorpayPaymentId) {
                appt.paymentStatus = 'refunded';
            }
            await appt.save();
            let refundId = null;
            if (appt.razorpayPaymentId) {
                try {
                    const refund = await razorpayClient_1.default.payments.refund(appt.razorpayPaymentId, { amount: Math.round((appt.amount || 0) * 100) });
                    refundId = refund.id;
                }
                catch (refundErr) {
                    console.error('Razorpay refund failed:', refundErr);
                }
            }
            const slotStr = appt.datetime.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short',
            });
            const msg = refundId
                ? `Your appointment on ${slotStr} has been cancelled and refunded.`
                : `Your appointment on ${slotStr} has been cancelled. Refund pending.`;
            await Notification_1.default.create({
                userId: appt.patient,
                type: 'appointment_cancelled',
                message: msg,
                read: false,
                createdAt: new Date(),
            });
            return res.json({ message: 'Appointment cancelled', refundId });
        }
        else {
            const slotStr = appt.datetime.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short',
            });
            await Notification_1.default.create({
                userId: appt.patient,
                type: 'appointment_already_cancelled',
                message: `Your appointment on ${slotStr} was already cancelled.`,
                read: false,
                createdAt: new Date(),
            });
            return res.json({ message: 'Appointment was already cancelled' });
        }
    }
    catch (err) {
        console.error('Error cancelling appointment:', err);
        return res.status(500).json({ message: 'Failed to cancel appointment' });
    }
});
/**
 * POST /api/appointments/:id/prescription
 * — Doctor issues a prescription PDF, emails it, and notifies patient.
 */
router.post('/:id/prescription', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const role = req.role;
        if (role !== 'doctor') {
            return res.status(403).json({ message: 'Only doctors can issue prescriptions' });
        }
        const appt = await Appointment_1.default.findById(id).populate('patient', 'name email');
        if (!appt) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        if (appt.doctor.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized for this appointment' });
        }
        const prescriptionItems = req.body.prescriptionItems;
        if (!Array.isArray(prescriptionItems) || prescriptionItems.length === 0) {
            return res
                .status(400)
                .json({ message: 'prescriptionItems must be a non‑empty array' });
        }
        const pdfBuffer = await (0, generatePrescriptionPdf_1.generatePrescriptionPdf)({
            clinicName: 'MedicoX Clinic',
            clinicLogoPath: path_1.default.join(__dirname, '../../public/assets/medicox-logo.png'),
            clinicAddress: '123 Main Street, Kolkata, WB, 700001',
            clinicEmail: 'contact@medicox.com',
            clinicPhone: '+91-9876543210',
            doctorName: user.name,
            doctorSpecialty: user.specialty || '',
            patientName: appt.patient.name,
            patientEmail: appt.patient.email || 'unknown@example.com',
            patientPhone: appt.patient.phone || 'N/A',
            appointmentDate: appt.datetime.toISOString().split('T')[0],
            issueDate: new Date(),
            prescriptionItems, // assuming it's already of correct structure
        });
        if (!Buffer.isBuffer(pdfBuffer)) {
            throw new Error('Failed to generate valid PDF buffer');
        }
        const dir = path_1.default.join(__dirname, '../../public/prescriptions');
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        const filename = `prescription_${id}_${Date.now()}.pdf`;
        const filePath = path_1.default.join(dir, filename);
        fs_1.default.writeFileSync(filePath, pdfBuffer);
        const fileUrl = `/prescriptions/${filename}`;
        // Email PDF to patient
        try {
            await (0, email_1.sendPrescriptionEmail)(appt.patient.email, user.name, pdfBuffer);
        }
        catch (emailErr) {
            console.error('Error sending prescription email:', emailErr);
        }
        // Create notification
        await Notification_1.default.create({
            userId: appt.patient,
            type: 'prescription',
            message: `Dr. ${user.name} issued your prescription.`,
            fileUrl,
            read: false,
            createdAt: new Date(),
        });
        return res.json({ message: 'Prescription issued', fileUrl });
    }
    catch (err) {
        console.error('Error issuing prescription:', err);
        return res.status(500).json({ message: 'Failed to issue prescription' });
    }
});
/**
 * PUT /api/appointments/clean-slots/:doctorId
 * — Mark past slots inactive by toggling `isSlotActive` flag.
 */
router.put('/clean-slots/:doctorId', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { doctorId } = req.params;
        const now = new Date();
        const result = await Appointment_1.default.updateMany({
            doctor: doctorId,
            datetime: { $lt: now },
            isSlotActive: true,
        }, { $set: { isSlotActive: false } });
        return res
            .status(200)
            .json({ message: `${result.modifiedCount} expired slots cleaned.` });
    }
    catch (err) {
        console.error('Error cleaning slots:', err);
        return res.status(500).json({ message: 'Failed to clean expired slots' });
    }
});
exports.default = router;
