// File: frontend/src/components/PayoutSetupForm.tsx

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { User, CreditCard, Banknote, IndianRupee } from 'lucide-react';

export interface PayoutFormValues {
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.4 } },
};

const fieldVariants = {
  blur: { scale: 1, boxShadow: 'none' },
  focus: { scale: 1.02, boxShadow: '0 0 8px rgba(59,130,246,0.5)' },
};

export const PayoutSetupForm: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { setupPayout } = useAuth();
  const [form, setForm] = useState<PayoutFormValues>({
    accountHolderName: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateInputs = () => {
    const { accountHolderName, accountNumber, ifsc, upiId } = form;

    if (!accountHolderName || !accountNumber || !ifsc) {
      setError('All fields except UPI are required');
      return false;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase())) {
      setError('Invalid IFSC format. Ex: SBIN0001234');
      return false;
    }

    if (upiId && !/^[\w.\-]+@[a-zA-Z]+$/.test(upiId)) {
      setError('Invalid UPI ID format. Ex: name@bank');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateInputs()) return;

    setLoading(true);
    try {
      await setupPayout(form); // server-side IFSC + bank validation
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Verification failed. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-700 to-pink-500 bg-opacity-90 backdrop-blur-md"
    >
      <Card className="w-full max-w-lg overflow-hidden border border-purple-100 shadow-xl rounded-2xl">
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { delay: 0.3, duration: 0.6 } }}
          className="p-8 bg-white"
        >
          <h2 className="mb-6 text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-red-400">
            🚀 Setup Payout Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {([
              {
                name: 'accountHolderName',
                icon: User,
                placeholder: 'Account Holder Name',
              },
              {
                name: 'accountNumber',
                icon: CreditCard,
                placeholder: 'Bank Account Number',
              },
              {
                name: 'ifsc',
                icon: Banknote,
                placeholder: 'IFSC Code (e.g. SBIN0001234)',
              },
              {
                name: 'upiId',
                icon: IndianRupee,
                placeholder: 'UPI ID (e.g. name@bank) - optional',
              },
            ] as const).map(({ name, icon: Icon, placeholder }, idx) => (
              <motion.div
                key={name}
                variants={fieldVariants}
                initial="blur"
                whileFocus="focus"
              >
                <label className="relative block">
                  <Icon className="absolute w-5 h-5 text-gray-400 top-3 left-3" />
                  <input
                    ref={idx === 0 ? firstInputRef : undefined}
                    name={name}
                    type="text"
                    placeholder={placeholder}
                    required={name !== 'upiId'}
                    value={(form as any)[name]}
                    onChange={handleChange}
                    className="w-full py-3 pl-10 pr-4 transition-all duration-200 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </label>
              </motion.div>
            ))}

            {error && (
              <div
                className="px-3 py-2 text-sm text-center text-red-600 bg-red-100 rounded-lg"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div className="px-3 py-2 text-sm text-center text-green-700 bg-green-100 rounded-lg">
                ✅ Bank account verified and saved!
              </div>
            )}

            <div className="flex items-center justify-between pt-2 space-x-4">
              <Button
                variant="ghost"
                size="lg"
                className="flex-1"
                type="button"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="flex-1 text-white bg-purple-600 hover:bg-purple-700"
              >
                <motion.span
                  animate={loading ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ repeat: loading ? Infinity : 0, duration: 1 }}
                >
                  {loading ? 'Verifying...' : 'Save & Continue'}
                </motion.span>
              </Button>
            </div>
          </form>
        </motion.div>
      </Card>
    </motion.div>
  );
};
