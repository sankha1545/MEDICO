// utils/razorpayClient.ts
import Razorpay from 'razorpay';

interface RazorpayContactCreateParams {
  name: string;
  email?: string;
  contact: string;
  type: 'vendor' | 'customer' | 'employee' | string;
}

interface RazorpayFundAccountCreateParams {
  contact_id: string;
  account_type: 'bank_account';
  bank_account: {
    name: string;
    ifsc: string;
    account_number: string;
  };
}

interface ExtendedRazorpay extends Razorpay {
  contacts: {
    create(data: RazorpayContactCreateParams): Promise<any>;
  };
  fundAccounts: {
    create(data: RazorpayFundAccountCreateParams): Promise<any>;
  };
}

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
}) as ExtendedRazorpay;

export default razorpayInstance;
