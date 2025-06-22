// File: backend/src/utils/razorpayClient.ts
import Razorpay from 'razorpay';

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;
if (!key_id || !key_secret) {
  console.error('Razorpay keys missing in environment');
  process.exit(1);
}

export const razorpayInstance = new Razorpay({
  key_id,
  key_secret,
});

export default razorpayInstance;
