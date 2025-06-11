// File: frontend/src/pages/PaymentPage.tsx
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
} from 'lucide-react';

type PaymentOption = 'netbanking' | 'upi' | 'cash';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const containerVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.2 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const PaymentPage: React.FC = () => {
  const { id: appointmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [selectedOption, setSelectedOption] = useState<PaymentOption>('netbanking');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // NetBanking
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  // UPI
  const [upiId, setUpiId] = useState('');
  const [upiProcessing, setUpiProcessing] = useState(false);
  // Cash
  const [cashConfirmed, setCashConfirmed] = useState(false);
  // Razorpay order data
  const [orderData, setOrderData] = useState<{
    key: string;
    orderId: string;
    amount: number;
    currency: string;
  } | null>(null);

  const token = localStorage.getItem('authToken');
  const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/appointments`,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  // Fetch Razorpay order on mount or when retrying
  const fetchOrder = async () => {
    try {
      const res = await api.post(`/${appointmentId}/pay`);
      setOrderData(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to initialize payment.');
    }
  };
  useEffect(() => {
    fetchOrder();
  }, [appointmentId]);

  // Open Razorpay Checkout
  const openCheckout = (prefillMethod: Record<string, any>) => {
    if (!orderData) return;
    setIsSubmitting(true);
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.orderId,
      name: 'MedicoX',
      description: 'Appointment Fee',
      prefill: { name: user?.name, email: user?.email },
      method: prefillMethod,
      handler: async (rsp: any) => {
        try {
          await api.post(
            '/verify',
            {
              appointmentId,
              razorpay_payment_id: rsp.razorpay_payment_id,
              razorpay_order_id: rsp.razorpay_order_id,
              razorpay_signature: rsp.razorpay_signature,
            }
          );
          alert('Payment successful!');
          navigate('/dashboard');
        } catch (e) {
          console.error(e);
          alert('Payment verification failed.');
        }
      },
      modal: {
        ondismiss: () => setIsSubmitting(false),
      },
    };
    new window.Razorpay(options).open();
  };

  // Handlers
  const payNetBanking = () => {
    if (!selectedBank || !accountNumber || !ifscCode) {
      return alert('Please fill all bank details.');
    }
    openCheckout({ netbanking: selectedBank });
  };
  const payUpi = () => {
    if (!upiId) return alert('Enter your UPI ID.');
    setUpiProcessing(true);
    openCheckout({ upi: upiId });
  };
  const confirmCash = () => setCashConfirmed(true);
  const finalizeCash = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/verify', {
        appointmentId,
        razorpay_payment_id: 'CASH',
        razorpay_order_id: 'CASH',
        razorpay_signature: 'CASH',
      });
      alert('Cash booking confirmed!');
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      alert('Error finalizing cash booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
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

        {/* Payment Method Selection */}
        <motion.div className="mb-6" variants={itemVariants}>
          <p className="text-gray-300 mb-2">Choose Payment Method:</p>
          <div className="flex space-x-4">
            {(['netbanking', 'upi', 'cash'] as PaymentOption[]).map((opt) => (
              <label key={opt} className="flex items-center space-x-2">
                <input
                  type="radio"
                  value={opt}
                  checked={selectedOption === opt}
                  onChange={() => {
                    setSelectedOption(opt);
                    setCashConfirmed(false);
                  }}
                  className="form-radio"
                />
                <span className="text-gray-300 capitalize">{opt}</span>
              </label>
            ))}
          </div>
        </motion.div>

        <AnimatePresence initial={false} mode="wait">
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
                variants={itemVariants}
              >
                <Banknote className="mr-2" /> Net Banking
              </motion.h2>
              <motion.div variants={itemVariants}>
                <label className="block text-gray-300 mb-1">Bank</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full mb-4"
                >
                  <option value="">-- Select Bank --</option>
                  <option value="HDFC">HDFC</option>
                  <option value="ICICI">ICICI</option>
                </select>
              </motion.div>
              <motion.div variants={itemVariants}>
                <label className="block text-gray-300 mb-1">Account #</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full mb-4"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <label className="block text-gray-300 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full"
                />
              </motion.div>
              <motion.button
                onClick={payNetBanking}
                disabled={isSubmitting}
                className="mt-6 w-full py-3 bg-indigo-500 text-white rounded-lg"
              >
                {isSubmitting ? 'Processing…' : 'Pay via NetBanking'}
              </motion.button>
            </motion.div>
          )}

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
                variants={itemVariants}
              >
                <Smartphone className="mr-2" /> UPI
              </motion.h2>
              <motion.div variants={itemVariants}>
                <label className="block text-gray-300 mb-1">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full mb-4"
                />
              </motion.div>
              <motion.button
                onClick={payUpi}
                disabled={upiProcessing}
                className="mt-4 w-full py-3 bg-green-500 text-white rounded-lg"
              >
                {upiProcessing ? 'Processing…' : 'Pay via UPI'}
              </motion.button>
            </motion.div>
          )}

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
                variants={itemVariants}
              >
                <ArrowRightCircle className="mr-2" /> Cash
              </motion.h2>
              {!cashConfirmed ? (
                <motion.div variants={itemVariants} className="space-y-4">
                  <p className="text-gray-300">Pay in cash at your appointment.</p>
                  <button
                    onClick={confirmCash}
                    className="w-full py-3 bg-yellow-500 text-gray-900 rounded-lg"
                  >
                    Confirm Cash Booking
                  </button>
                </motion.div>
              ) : (
                <motion.div variants={itemVariants} className="space-y-4">
                  <p className="text-gray-300">Finalize cash booking?</p>
                  <button
                    onClick={finalizeCash}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-yellow-500 text-gray-900 rounded-lg"
                  >
                    {isSubmitting ? 'Finalizing…' : 'Finalize Booking'}
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
