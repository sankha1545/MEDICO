// File: frontend/src/pages/ResetPasswordPage.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as any;
  const email = state?.email as string;
  const otp = state?.otp as string;
  if (!email || !otp) { navigate('/forgot-password'); return null; }

  const { resetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords must match'); return; }
    if (password.length < 6) { setError('Min 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      await resetPassword(email, otp, password);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <form onSubmit={handleReset} className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Set New Password</h2>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <Input
          type="password"
          label="New Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          fullWidth
        />
        <Input
          type="password"
          label="Confirm Password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          fullWidth
          className="mt-4"
        />
        <Button type="submit" variant="primary" isLoading={loading} className="mt-6" fullWidth>
          Reset Password
        </Button>
        <p className="mt-4 text-sm text-center">
          Remembered? <Link to="/login" className="text-primary-500">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
