import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface LocationState {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor';
}

const OTPVerificationPage: React.FC = () => {
  const { userEmail, completeSignup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Grab name, email, password, role from router state
  const state = (location.state || {}) as LocationState;

  const [otp, setOtp] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // If no prior email, redirect back to signup
  useEffect(() => {
    if (!userEmail || !state.email) {
      navigate('/signup', { replace: true });
    }
  }, [userEmail, state.email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    setIsLoading(true);
    try {
      await completeSignup({
        name: state.name,
        email: state.email,
        password: state.password,
        role: state.role,
        otp,
      });
      // On success, redirect to dashboard (or login)
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Verify Your Email</h2>
      <p className="mb-6">
        We’ve sent an OTP to <strong>{state.email}</strong>. Enter it below to
        complete your account setup.
      </p>

      {error && (
        <div className="mb-4 text-red-600 bg-red-100 p-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium">
            One-Time Password
          </label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="Enter OTP"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Verifying…' : 'Verify OTP'}
        </button>
      </form>
    </div>
  );
};

export default OTPVerificationPage;
