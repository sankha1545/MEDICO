import express, { Request, Response } from 'express';
import axios from 'axios';
import razorpayInstance from '../utils/razorpayClient';
import Doctor from '../models/Doctor';
import { authenticateJWT } from './auth';

const router = express.Router();

/**
 * POST /api/payout/setup
 * Doctor provides bank details to create and validate Razorpay Contact & Fund Account.
 */
router.post('/setup', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = (req as any).role;
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
      await axios.get(`https://ifsc.razorpay.com/${ifsc.toUpperCase()}`);
    } catch {
      return res.status(400).json({ message: 'Invalid or unknown IFSC code' });
    }

    // Validate UPI if present
    if (upiId && !/^[\w.\-]+@[a-zA-Z]+$/.test(upiId)) {
      return res.status(400).json({ message: 'Invalid UPI ID format' });
    }

    // 1. Create Razorpay Contact
    const contact = await razorpayInstance.contacts.create({
      name: accountHolderName,
      type: 'vendor',
      reference_id: user._id.toString(),
    });

    // 2. Create and validate Razorpay Fund Account
    let fundAccount;
    try {
      fundAccount = await razorpayInstance.fund_accounts.create({
        contact_id: contact.id,
        account_type: 'bank_account',
        bank_account: {
          name: accountHolderName,
          ifsc,
          account_number: accountNumber,
        },
        validate: true, // enable real-time verification
      });
    } catch (fundErr: any) {
      console.error('❌ Fund account validation failed:', fundErr);
      const msg =
        fundErr?.error?.description ||
        fundErr?.message ||
        'Bank account validation failed. Please ensure correct details.';
      return res.status(400).json({ message: msg });
    }

    // 3. Persist contact & fund account ID to doctor profile
    await Doctor.findByIdAndUpdate(user._id, {
      razorpayContactId: contact.id,
      razorpayFundAccountId: fundAccount.id,
    });

    return res.status(200).json({
      message: 'Payout account verified and saved successfully.',
      contactId: contact.id,
      fundAccountId: fundAccount.id,
    });
  } catch (err) {
    console.error('🚨 Payout setup failed:', err);
    return res.status(500).json({ message: 'Failed to setup payout account' });
  }
});

/**
 * POST /api/payout/execute
 * Trigger a payout to doctor after appointment is confirmed and paid.
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { doctorId, amountInPaise, appointmentId } = req.body;

    if (!doctorId || !amountInPaise || !appointmentId) {
      return res.status(400).json({ message: 'Missing payout fields' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.razorpayFundAccountId) {
      return res.status(400).json({ message: 'Doctor payout account not configured' });
    }

    const payout = await razorpayInstance.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER!, // Must be set in .env
      fund_account_id: doctor.razorpayFundAccountId,
      amount: amountInPaise,
      currency: 'INR',
      mode: 'IMPS', // or 'UPI' optionally
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
  } catch (err: any) {
    console.error('❌ Payout execution failed:', err);
    return res.status(500).json({
      message: err?.error?.description || 'Failed to initiate payout',
    });
  }
});

export default router;
