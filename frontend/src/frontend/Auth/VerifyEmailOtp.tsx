import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';           // ← updated import path
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

interface LocationState {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor';
}

const OTPVerificationPage: React.FC = () => {
  const { verifyEmailOtp, signup } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Attempt to extract the state passed from SignUp.tsx
  const state = location.state as LocationState | undefined;

  // If someone navigates here without state, send them back to /signup
  useEffect(() => {
    if (!state || !state.email || !state.name || !state.password || !state.role) {
      navigate('/signup');
    }
  }, [state, navigate]);

  // At this point, state is guaranteed to exist (checked above)
  const { name, email, password, role } = state!;

  const [otp, setOtp] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1) Verify the OTP
      await verifyEmailOtp(email, otp);

      // 2) If OTP is correct, create the user record
      await signup({ name, email, password, role });

      // 3) Notify success and redirect to login
      alert('Your account has been created successfully.');
      navigate('/login');
    } catch (err: any) {
      // If backend returned a JSON error with `message`, show that. Otherwise, use a generic message.
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Verify Your Email</h2>
        <p className="mb-6 text-gray-600 text-center">
          {/* Show the email being verified */}
          We've sent a code to <strong>{email}</strong>. Enter it below to create your account.
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-error-50 text-error-700 p-3 rounded-md mb-4"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            type="text"
            id="otp"
            label="OTP Code"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            fullWidth
          />

          <Button type="submit" variant="primary" isLoading={isLoading} fullWidth>
            Verify & Create Account
          </Button>
        </form>

        <p className="mt-4 text-sm text-center">
          Didn’t get a code?{' '}
          <Link to="/signup" className="text-primary-500 hover:underline">
            Go back and resend
          </Link>
        </p>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
