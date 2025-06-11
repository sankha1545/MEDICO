// File: backend/src/utils/razorpay.ts
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RP_KEY_ID!,
  key_secret: process.env.RP_KEY_SECRET!,
});

export default razorpay;
