// File: frontend/src/pages/LoginPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { FadeIn, SlideIn } from '../components/animations/Transitions';
import logo from '../assets/Logo.png';

const OTP_LENGTH = 6;

declare global {
  interface Window { google: any; }
}

const LoginPage: React.FC = () => {
  const {
    login,
    loginWithToken,
    loginWithGoogle,
    user,
    isAuthenticated,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPassword,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // — Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // — Google login state
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [gsiInitialized, setGsiInitialized] = useState(false);

  // — Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [stage, setStage] = useState<'email' | 'otp' | 'reset'>('email');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // — Login via token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setIsLoading(true);
      loginWithToken(token)
        .catch(() => setError('Google login failed'))
        .finally(() => setIsLoading(false));
    }
  }, [searchParams, loginWithToken]);

  // — Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'doctor' ? '/doc-dashboard' : '/home');
    }
  }, [isAuthenticated, user, navigate]);

  // — Load Google Identity script
  useEffect(() => {
    if (!gsiLoaded) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setGsiLoaded(true);
      document.body.appendChild(script);
    }
  }, [gsiLoaded]);

  // — Initialize & render Google button
  useEffect(() => {
    if (gsiLoaded && !gsiInitialized && googleBtnRef.current) {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        callback: async ({ credential }: { credential: string }) => {
          if (!credential) {
            setError('No credential returned');
            return;
          }
          setGoogleLoading(true);
          try {
            await loginWithGoogle(credential);
          } catch (e: any) {
            setError(e.message || 'Google login failed');
          } finally {
            setGoogleLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 250,
        text: 'signin_with',
      });
      setGsiInitialized(true);
    }
  }, [gsiLoaded, gsiInitialized, loginWithGoogle]);

  // — Handle standard email/password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email.trim(), password.trim());
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // — Send OTP for password reset
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await sendPasswordResetOtp(email.trim());
      setStage('otp');
      setOtp(Array(OTP_LENGTH).fill(''));
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // — Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter the full code');
      setIsLoading(false);
      return;
    }
    try {
      await verifyPasswordResetOtp(email.trim(), code);
      setStage('reset');
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // — Reset password
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPass !== confirmPass) {
      setError('Passwords do not match');
      return;
    }
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Invalid OTP');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(email.trim(), code, newPass);
      setShowForgot(false);
      setStage('email');
      setError('Password updated. Please log in.');
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  // — Handle OTP digit input
  const handleOtpChange = (idx: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gray-100">
      {/* — Left: Login Form */}
      <FadeIn>
        <div className="flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center mb-5 text-2xl font-bold">
                <img src={logo} alt="Logo" className="h-8 w-auto" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-800">Welcome back</h1>
              <p className="text-gray-600 mt-2">Sign in to your account to continue</p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-100 text-red-700 p-3 rounded-md mb-4"
              >
                {error}
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <input
                    id="login-email"
                    type="email"
                    required
                    className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder=" you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{height:"35px"}}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <UserIcon size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder=" ••••••••"
                    value={password}
                    style={{height:"35px"}}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <label className="flex items-center text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-primary-500 hover:text-primary-600"
                  onClick={() => {
                    setShowForgot(true);
                    setStage('email');
                    setError('');
                    setOtp(Array(OTP_LENGTH).fill(''));
                    setNewPass('');
                    setConfirmPass('');
                    setShowNewPass(false);
                    setShowConfirmPass(false);
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" variant="primary" isLoading={isLoading} fullWidth>
                Sign In
              </Button>
            </form>

            {/* Google Login */}
            <div className="mt-4 flex justify-center">
              <div ref={googleBtnRef} />
            </div>
            {googleLoading && (
              <p className="text-center text-sm text-gray-600 mt-2">
                Processing Google login...
              </p>
            )}

            {/* Sign up link */}
            <p className="mt-6 text-center text-sm text-gray-600">
              Don’t have an account?{' '}
              <Link to="/signup" className="text-primary-500 hover:text-primary-600 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </FadeIn>

      {/* — Right: Promo Image */}
      <SlideIn direction="right">
        <div className="hidden md:block relative">
          <img
            src="https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=1260"
            alt="Healthcare professionals"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center max-w-sm p-8">
              <h2 className="text-2xl font-bold mb-4">Your health is our priority</h2>
              <p>Book appointments with top doctors, manage your records, and stay on top of your health—all from one place.</p>
            </div>
          </div>
        </div>
      </SlideIn>

      {/* — Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl p-6 w-11/12 max-w-md"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h3 className="text-xl font-semibold mb-4">Forgot Password</h3>

              {stage === 'email' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="fp-email"
                        type="email"
                        required
                        className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                         style={{height:"35px"}}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Mail size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <Button type="submit" variant="primary" isLoading={isLoading} fullWidth>
                    Send OTP
                  </Button>
                </form>
              )}

              {stage === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="flex justify-between">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength={1}
                        inputMode="numeric"
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        ref={el => el && (inputRefs.current[i] = el)}
                        className="w-12 h-12 text-center border rounded"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                  <Button type="submit" variant="primary" isLoading={isLoading} fullWidth>
                    Verify OTP
                  </Button>
                </form>
              )}

              {stage === 'reset' && (
                <form onSubmit={handleReset} className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label htmlFor="fp-new-pass" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="fp-new-pass"
                        type={showNewPass ? 'text' : 'password'}
                        required
                        className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(v => !v)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 focus:outline-none"
                      >
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="fp-confirm-pass" className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="fp-confirm-pass"
                        type={showConfirmPass ? 'text' : 'password'}
                        required
                        className="block w-full	pr-10 sm:text-sm border-gray-300 rounded-md"
                        value={confirmPass}
                        onChange={e => setConfirmPass(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(v => !v)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 focus:outline-none"
                      >
                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" variant="primary" isLoading={isLoading} fullWidth>
                    Reset Password
                  </Button>
                </form>
              )}

              <div className="mt-4 text-center">
                <button
                  className="text-sm text-gray-600 mr-4"
                  onClick={() => {
                    setShowForgot(false);
                    setError('');
                  }}
                >
                  Cancel
                </button>
                {stage !== 'email' && (
                  <button
                    className="text-sm text-primary-500"
                    onClick={() => {
                      setStage('email');
                      setError('');
                      setOtp(Array(OTP_LENGTH).fill(''));
                    }}
                  >
                    Back
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
