"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const razorpayClient_1 = __importDefault(require("../utils/razorpayClient"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const auth_1 = require("./auth");
const router = express_1.default.Router();
/**
 * POST /api/payout/setup
 * Doctor provides bank details to create and validate Razorpay Contact & Fund Account.
 */
router.post('/setup', auth_1.authenticateJWT, async (req, res) => {
    try {
        const user = req.user;
        const role = req.role;
        if (role !== 'doctor') {
            return res.status(403).json({ message: 'Only doctors can setup payout accounts' });
        }
        const { accountHolderName, accountNumber, ifsc, upiId } = req.body;
        // Validate presence
        if (!accountHolderName || !accountNumber || !ifsc) {
            return res.status(400).json({ message: 'Missing required bank details' });
        }
        // Validate IFSC format
        const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
        if (!ifscPattern.test(ifsc)) {
            return res.status(400).json({ message: 'Invalid IFSC format' });
        }
        // Validate IFSC via Razorpay IFSC API
        try {
            await axios_1.default.get(`https://ifsc.razorpay.com/${ifsc.toUpperCase()}`);
        }
        catch {
            return res.status(400).json({ message: 'Invalid or unknown IFSC code' });
        }
        // Validate UPI if present
        if (upiId && !/^[\w.\-]+@[a-zA-Z]+$/.test(upiId)) {
            return res.status(400).json({ message: 'Invalid UPI ID format' });
        }
        // 1. Create Razorpay Contact
        const contact = await razorpayClient_1.default.contacts.create({
            name: accountHolderName,
            type: 'vendor',
            reference_id: user._id.toString(),
        });
        // 2. Create and validate Razorpay Fund Account
        let fundAccount;
        try {
            fundAccount = await razorpayClient_1.default.fund_accounts.create({
                contact_id: contact.id,
                account_type: 'bank_account',
                bank_account: {
                    name: accountHolderName,
                    ifsc,
                    account_number: accountNumber,
                },
                validate: true, // enable real-time verification
            });
        }
        catch (fundErr) {
            console.error('❌ Fund account validation failed:', fundErr);
            const msg = fundErr?.error?.description ||
                fundErr?.message ||
                'Bank account validation failed. Please ensure correct details.';
            return res.status(400).json({ message: msg });
        }
        // 3. Persist contact & fund account ID to doctor profile
        await Doctor_1.default.findByIdAndUpdate(user._id, {
            razorpayContactId: contact.id,
            razorpayFundAccountId: fundAccount.id,
        });
        return res.status(200).json({
            message: 'Payout account verified and saved successfully.',
            contactId: contact.id,
            fundAccountId: fundAccount.id,
        });
    }
    catch (err) {
        console.error('🚨 Payout setup failed:', err);
        return res.status(500).json({ message: 'Failed to setup payout account' });
    }
});
/**
 * POST /api/payout/execute
 * Trigger a payout to doctor after appointment is confirmed and paid.
 */
router.post('/execute', async (req, res) => {
    try {
        const { doctorId, amountInPaise, appointmentId } = req.body;
        if (!doctorId || !amountInPaise || !appointmentId) {
            return res.status(400).json({ message: 'Missing payout fields' });
        }
        const doctor = await Doctor_1.default.findById(doctorId);
        if (!doctor || !doctor.razorpayFundAccountId) {
            return res.status(400).json({ message: 'Doctor payout account not configured' });
        }
        const payout = await razorpayClient_1.default.payouts.create({
            account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
            fund_account_id: doctor.razorpayFundAccountId,
            amount: amountInPaise,
            currency: 'INR',
            mode: 'IMPS',
            purpose: 'consultation_fees',
            queue_if_low_balance: true,
            reference_id: appointmentId,
            narration: 'MedicoX Consultation Payout',
        });
        return res.json({
            message: 'Payout initiated',
            payoutId: payout.id,
            status: payout.status,
        });
    }
    catch (err) {
        console.error('❌ Payout execution failed:', err);
        return res.status(500).json({
            message: err?.error?.description || 'Failed to initiate payout',
        });
    }
});
exports.default = router;
