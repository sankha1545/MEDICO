// File: frontend/src/pages/ResetOtpPage.tsx
import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const OTP_LENGTH = 6;

const ResetOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as any;
  const email = state?.email as string;
  if (!email) { navigate('/forgot-password'); return null; }

  const { verifyPasswordResetOtp } = useAuth();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<HTMLInputElement[]>([]);

  const combined = otp.join('');
  const handleChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp]; next[i] = v; setOtp(next);
    if (v && i < OTP_LENGTH - 1) inputsRef.current[i+1]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (combined.length !== OTP_LENGTH) { setError('Complete the 6‐digit code'); return; }
    setError(''); setLoading(true);
    try {
      await verifyPasswordResetOtp(email, combined);
      navigate('/reset-password', { state: { email, otp: combined } });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full max-w-xs">
        <h2 className="text-xl font-bold mb-4 text-center">Verify OTP</h2>
        <p className="text-gray-600 mb-4 text-center">Code sent to <strong>{email}</strong></p>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <div className="flex justify-between mb-4 space-x-2">
          {otp.map((d, i) => (
            <input
              key={i} type="text" maxLength={1} inputMode="numeric"
              value={d} onChange={e => handleChange(i, e.target.value)}
              ref={el => el && (inputsRef.current[i]=el)}
              className="w-12 h-12 text-center border rounded"
              autoFocus={i===0}
            />
          ))}
        </div>
        <Button type="submit" variant="primary" isLoading={loading} fullWidth>
          Next
        </Button>
        <p className="mt-4 text-sm text-center">
          Didn’t get it? <Link to="/forgot-password" className="text-primary-500">Resend</Link>
        </p>
      </form>
    </div>
  );
};

export default ResetOtpPage;
