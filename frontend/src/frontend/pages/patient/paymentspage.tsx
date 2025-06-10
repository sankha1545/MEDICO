import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Smartphone,
  Banknote,
  ArrowRightCircle,
  CheckCircle2,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type PaymentOption = 'netbanking' | 'upi' | 'cash';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentPage: React.FC = () => {
  const { id: appointmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [selectedOption, setSelectedOption] = useState<PaymentOption>('netbanking');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Net Banking
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // UPI
  const [upiId, setUpiId] = useState('');
  const [upiProcessing, setUpiProcessing] = useState(false);

  // Cash
  const [cashConfirmed, setCashConfirmed] = useState(false);

  const token = localStorage.getItem('authToken');
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL + '/appointments',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(e.target.value as PaymentOption);
    // Reset fields when switching
    setSelectedBank('');
    setAccountNumber('');
    setIfscCode('');
    setUpiId('');
    setUpiProcessing(false);
    setCashConfirmed(false);
  };

  /**
   * Helper: fetch Razorpay order details from backend.
   * Returns { keyId, orderId, amount, currency }
   */
  const fetchRazorpayOrder = async () => {
    try {
      const resp = await api.post(`/${appointmentId}/pay`);
      return resp.data as {
        keyId: string;
        orderId: string;
        amount: number;
        currency: string;
      };
    } catch (err) {
      console.error('Error fetching Razorpay order:', err);
      alert('Could not initiate payment. Please try again.');
      throw err;
    }
  };

  /**
   * Open Razorpay checkout with given method restrictions.
   * methodConfig can be:
   *  { netbanking: 'HDFC' }  OR
   *  { upi: upiId }
   */
  const openRazorpayCheckout = async (methodConfig: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const { keyId, orderId, amount, currency } = await fetchRazorpayOrder();
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'MedBook',
        description: 'Appointment Booking',
        order_id: orderId,
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        handler: async (response: any) => {
          // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
          try {
            await api.post(`/${appointmentId}/verify`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            alert('Payment successful! Your appointment is confirmed.');
            navigate('/dashboard');
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            alert('Payment verification failed. Please contact support.');
          }
        },
        theme: { color: '#3b82f6' }, // Tailwind’s blue-500
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },
        // Restrict to the chosen method
        method: methodConfig,
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      // Already alerted
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNetBankingPayment = () => {
    if (!selectedBank || !accountNumber.trim() || !ifscCode.trim()) {
      alert('Please fill in all net banking fields.');
      return;
    }
    // Pass Razorpay method restriction:
    openRazorpayCheckout({ netbanking: selectedBank });
  };

  const handleUpiPayment = () => {
    if (!upiId.trim()) {
      alert('Please enter your UPI ID.');
      return;
    }
    setUpiProcessing(true);
    openRazorpayCheckout({ upi: upiId });
  };

  const handleCashOption = () => {
    setCashConfirmed(true);
  };

  const confirmCashPayment = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/${appointmentId}/verify`, {
        razorpay_payment_id: 'CASH_PAYMENT',
        razorpay_order_id: 'CASH_ORDER',
        razorpay_signature: 'CASH_SIGNATURE',
      });
      alert('Cash payment confirmed! Your appointment is now booked.');
      navigate('/dashboard');
    } catch (err) {
      console.error('Cash confirmation error:', err);
      alert('Could not confirm cash booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-6">
      <motion.div
        className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.h1
          className="text-3xl font-bold text-white mb-6 flex items-center"
          variants={itemVariants}
        >
          <CreditCard className="mr-3 text-indigo-400" /> Payment Details
        </motion.h1>

        <motion.div className="mb-6" variants={itemVariants}>
          <p className="text-gray-300 mb-2">Choose Payment Method:</p>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="payment"
                value="netbanking"
                checked={selectedOption === 'netbanking'}
                onChange={handleOptionChange}
                className="form-radio text-indigo-500"
              />
              <span className="text-gray-300">Net Banking</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="payment"
                value="upi"
                checked={selectedOption === 'upi'}
                onChange={handleOptionChange}
                className="form-radio text-green-500"
              />
              <span className="text-gray-300">UPI Payment</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={selectedOption === 'cash'}
                onChange={handleOptionChange}
                className="form-radio text-yellow-500"
              />
              <span className="text-gray-300">Cash in Hand</span>
            </label>
          </div>
        </motion.div>

        <AnimatePresence exitBeforeEnter>
          {/* ─── Net Banking Section ─── */}
          {selectedOption === 'netbanking' && (
            <motion.div
              key="netbanking"
              className="bg-gray-700 rounded-xl p-6 mb-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h2
                className="text-xl font-semibold text-indigo-400 mb-4 flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Banknote className="mr-2" /> Net Banking Info
              </motion.h2>
              <motion.div variants={itemVariants}>
                <label className="block text-gray-300 mb-1">Select Bank</label>
                <select
                  value={selectedBank}
                  onChange={e => setSelectedBank(e.target.value)}
                  className="w-full bg-gray-600 text-gray-100 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Bank --</option>
                  <option value="HDFC">HDFC Bank</option>
                  <option value="ICICI">ICICI Bank</option>
                  <option value="SBI">State Bank of India</option>
                  <option value="AXIS">Axis Bank</option>
                </select>
              </motion.div>
              <motion.div variants={itemVariants}>
                <label className="block text-gray-300 mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="1234 5678 9012"
                  className="w-full bg-gray-600 text-gray-100 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <label className="block text-gray-300 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={e => setIfscCode(e.target.value)}
                  placeholder="HDFC0001234"
                  className="w-full bg-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </motion.div>
              <motion.button
                onClick={handleNetBankingPayment}
                disabled={isSubmitting}
                className={`mt-6 w-full flex items-center justify-center space-x-2 py-3 rounded-lg text-white ${
                  isSubmitting ? 'bg-gray-500' : 'bg-indigo-500 hover:bg-indigo-600'
                } transition`}
                variants={itemVariants}
              >
                <ArrowRightCircle /> {isSubmitting ? 'Processing...' : 'Pay via Net Banking'}
              </motion.button>
            </motion.div>
          )}

          {/* ─── UPI Section ─── */}
          {selectedOption === 'upi' && (
            <motion.div
              key="upi"
              className="bg-gray-700 rounded-xl p-6 mb-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h2
                className="text-xl font-semibold text-green-400 mb-4 flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Smartphone className="mr-2" /> UPI Payment
              </motion.h2>
              <motion.div variants={itemVariants}>
                <label className="block text-gray-300 mb-1">Enter your UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="example@upi"
                  className="w-full bg-gray-600 text-gray-100 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <p className="text-gray-400 mb-4">
                  You can scan this QR or complete payment in your UPI app. Once done, you will be redirected.
                </p>
                <div className="w-40 h-40 bg-gray-800 rounded-lg mx-auto flex items-center justify-center mb-4">
                  <span className="text-gray-500">QR CODE</span>
                </div>
              </motion.div>
              <motion.button
                onClick={handleUpiPayment}
                disabled={upiProcessing}
                className={`mt-4 w-full flex items-center justify-center space-x-2 py-3 rounded-lg text-white ${
                  upiProcessing ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'
                } transition`}
                variants={itemVariants}
              >
                <CheckCircle2 /> {upiProcessing ? 'Processing UPI...' : 'Pay with UPI'}
              </motion.button>
            </motion.div>
          )}

          {/* ─── Cash in Hand Section ─── */}
          {selectedOption === 'cash' && (
            <motion.div
              key="cash"
              className="bg-gray-700 rounded-xl p-6 mb-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h2
                className="text-xl font-semibold text-yellow-400 mb-4 flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <ArrowRightCircle className="mr-2" /> Cash in Hand
              </motion.h2>
              {!cashConfirmed ? (
                <motion.div variants={itemVariants} className="space-y-4">
                  <p className="text-gray-300">
                    You will pay in cash directly to the doctor at the time of your appointment.
                    Confirm below to finalize your booking.
                  </p>
                  <button
                    onClick={handleCashOption}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg transition"
                  >
                    <CheckCircle2 /> Confirm Cash Booking
                  </button>
                </motion.div>
              ) : (
                <motion.div variants={itemVariants} className="space-y-4">
                  <p className="text-gray-300 mb-4">
                    Are you sure you want to proceed with Cash in Hand? This will finalize your booking.
                  </p>
                  <button
                    onClick={confirmCashPayment}
                    disabled={isSubmitting}
                    className={`w-full flex items-center justify-center space-x-2 py-3 ${
                      isSubmitting ? 'bg-gray-500' : 'bg-yellow-500 hover:bg-yellow-600'
                    } text-gray-900 rounded-lg transition`}
                  >
                    <CheckCircle2 /> {isSubmitting ? 'Finalizing...' : 'Finalize Cash Booking'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PaymentPage;
