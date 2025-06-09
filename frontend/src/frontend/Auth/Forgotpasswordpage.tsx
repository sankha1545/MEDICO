// File: frontend/src/pages/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { sendPasswordResetOtp } = useAuth();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetOtp(email);
      navigate('/reset-otp', { state: { email } });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <form onSubmit={handleSendOtp} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <Input
          type="email"
          label="Email Address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          fullWidth
        />
        <Button type="submit" variant="primary" isLoading={isLoading} className="mt-4" fullWidth>
          Send OTP
        </Button>
        <p className="mt-4 text-sm">
          Remembered? <Link to="/login" className="text-primary-500">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
