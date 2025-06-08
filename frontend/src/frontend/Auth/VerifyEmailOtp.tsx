// File: frontend/src/pages/OTPVerificationPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { CheckCircle } from 'lucide-react';

interface LocationState {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor';
}

const OTP_LENGTH = 6;
const INITIAL_TIME = 60; // 1 minute in seconds

const OTPVerificationPage: React.FC = () => {
  const { verifyEmailOtp, signup } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve data passed from SignUpPage
  const state = location.state as LocationState | undefined;
  useEffect(() => {
    if (!state || !state.email || !state.name || !state.password || !state.role) {
      navigate('/signup');
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  const { name, email, password, role } = state;

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_TIME);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const combinedOtp = otpDigits.join('');

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otpDigits];
    newOtp[index] = value;
    setOtpDigits(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otpDigits[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (combinedOtp.length !== OTP_LENGTH) {
      setError(`Please enter all ${OTP_LENGTH} digits of the OTP.`);
      return;
    }
    if (timeLeft <= 0) {
      setError('OTP has expired. Please go back and request a new one.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify OTP on the backend
      await verifyEmailOtp(email, combinedOtp);

      // 2. Create new user (backend will mark isVerified = true)
      await signup({ name, email, password, role });

      // Show success modal
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-2 text-center">Verify Your Email</h2>
        <p className="mb-4 text-gray-600 text-center">
          We've sent a code to <strong>{email}</strong>. Enter it below to create your account.
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 text-red-700 p-3 rounded-md mb-4"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-between space-x-2">
            {Array.from({ length: OTP_LENGTH }).map((_, idx) => (
              <input
                key={idx}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otpDigits[idx]}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                ref={(el) => {
                  if (el) inputRefs.current[idx] = el;
                }}
                disabled={timeLeft <= 0 || isLoading}
                className="w-14 h-14 text-center text-2xl font-semibold border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white disabled:opacity-50"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {/* Animated Timer Display */}
          <div className="flex justify-center mt-4">
            <motion.span
              key={timeLeft} // re-render each second for animation reset
              animate={{
                scale: timeLeft <= 10 ? [1, 1.2, 1] : 1,
                color: timeLeft <= 10
                  ? ['#F87171', '#E11D48', '#F87171']
                  : ['#374151'],
              }}
              transition={{
                duration: timeLeft <= 10 ? 0.8 : 0,
                repeat: timeLeft <= 10 ? Infinity : 0,
              }}
              className="text-center text-3xl font-bold"
            >
              {timeLeft > 0 ? formatTime(timeLeft) : '00:00'}
            </motion.span>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            fullWidth
            disabled={timeLeft <= 0}
          >
            Verify &amp; Create Account
          </Button>
        </form>

        <p className="mt-4 text-sm text-center">
          Didn’t get a code?{' '}
          <Link to="/signup" className="text-primary-500 hover:underline">
            Go back and resend
          </Link>
        </p>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl p-6 w-11/12 max-w-md text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                transition: { type: 'spring', stiffness: 300 },
              }}
              exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.2 } }}
            >
              <CheckCircle size={48} className="mx-auto text-primary-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Success!</h3>
              <p className="text-gray-700 mb-6">
                Your account has been created successfully.
              </p>
              <Button type="button" variant="primary" fullWidth onClick={closeModal}>
                Go to Login
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OTPVerificationPage;
