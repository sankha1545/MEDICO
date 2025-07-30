// File: frontend/src/pages/LoginPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Eye,
  EyeOff,
  Lock,
  Sparkles,
  Shield,
  Zap,
  Atom,
  Cpu,
  Globe,
  Star,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

const OTP_LENGTH = 6;

declare global {
  interface Window {
    google: any;
  }
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

  // Form & auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Google login state
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [gsiInitialized, setGsiInitialized] = useState(false);

  // Forgot password
  const [showForgot, setShowForgot] = useState(false);
  const [stage, setStage] = useState<'email' | 'otp' | 'reset'>('email');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Load remembered email
  useEffect(() => {
    const saved = localStorage.getItem('savedEmail');
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  // Token login
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setIsLoading(true);
      loginWithToken(token)
        .catch(() => setError('Google login failed'))
        .finally(() => setIsLoading(false));
    }
  }, [searchParams, loginWithToken]);

  // Redirect after auth
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'doctor' ? '/doc-dashboard' : '/home');
    }
  }, [isAuthenticated, user, navigate]);

  // Load GSI script
  useEffect(() => {
    if (!gsiLoaded) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setGsiLoaded(true);
      script.onerror = () => console.error('Google script failed');
      document.body.appendChild(script);
    }
  }, [gsiLoaded]);

  // Init GSI button
  useEffect(() => {
    if (gsiLoaded && !gsiInitialized && googleBtnRef.current) {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
      if (!clientId) return console.error('VITE_GOOGLE_CLIENT_ID missing');
      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        callback: async ({ credential }: { credential: string }) => {
          if (!credential) return setError('No credential returned');
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
        width: 240,
        text: 'signin_with',
      });
      setGsiInitialized(true);
    }
  }, [gsiLoaded, gsiInitialized, loginWithGoogle]);

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email.trim(), password.trim());
      rememberMe
        ? localStorage.setItem('savedEmail', email.trim())
        : localStorage.removeItem('savedEmail');
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Enter full code');
      return setIsLoading(false);
    }
    try {
      await verifyPasswordResetOtp(email.trim(), code);
      setStage('reset');
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'OTP failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPass !== confirmPass) return setError('Passwords must match');
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return setError('Invalid OTP');
    setIsLoading(true);
    try {
      await resetPassword(email.trim(), code, newPass);
      setShowForgot(false);
      setStage('email');
      setError('Password updated! Please log in.');
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP inputs
  const handleOtpChange = (idx: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const arr = [...otp];
    arr[idx] = val;
    setOtp(arr);
    if (val && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const renderOtpInputs = () => (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {otp.map((d, i) => (
        <motion.input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleOtpChange(i, e.target.value)}
          ref={el => {
            if (el) inputRefs.current[i] = el;
          }}
          className="w-full h-12 text-xl font-bold text-center transition border sm:h-14 bg-white/20 border-white/30 rounded-xl focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* animated icons */}
        <div className="absolute inset-0 opacity-20 bg-[length:100px_100px] animate-[float_20s_ease-in-out_infinite]" />
        {Array(4)
          .fill(0)
          .map((_, i) => {
            const Icon = [Atom, Cpu, Globe, Star][i];
            return (
              <motion.div
                key={i}
                className="absolute text-white/10"
                style={{ top: `${10 + i * 15}%`, left: `${20 + i * 20}%`, fontSize: '4rem' }}
                animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Icon size={64} />
              </motion.div>
            );
          })}
      </div>

      {/* Main Card */}
      <div className="z-10 flex items-center justify-center flex-grow p-4">
        <motion.div
          className="w-full max-w-md p-8 border shadow-lg bg-white/10 backdrop-blur-lg border-white/20 rounded-3xl"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo & Title */}
          <div className="mb-6 text-center">
            <Link to="/" className="inline-flex items-center mb-4 space-x-2">
              <Sparkles className="w-8 h-8 text-gradient-to-r from-primary-400 to-pink-500" />
              <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-pink-500 to-accent-400">
                MedicoX
              </span>
            </Link>
            <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Welcome Back</h1>
            <p className="text-white/70">Sign in to continue your healthcare journey</p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="flex items-center justify-center p-3 mb-4 text-red-100 border border-red-500 bg-red-600/30 rounded-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AlertCircle className="w-5 h-5 mr-2" /> <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              icon={<Mail  className="text-black" />}
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
            />
            <div className="relative">
              <Input
             
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                icon={<Lock className="text-black"/>}
                value={password}
                onChange={e => setPassword(e.target.value)}
                fullWidth
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 flex items-center right-3 text-white/70"
              >
                {showPassword ? <EyeOff className="text-black" /> : <Eye className="text-black" />}
              </button>
            </div>
            <div className="flex justify-between text-sm">
             
              <button
                type="button"
                onClick={() => {
                  setShowForgot(true);
                  setStage('email');
                  setError('');
                }}
                className="underline text-primary-400"
              >
                Forgot?
              </button>
            </div>
            <Button fullWidth isLoading={isLoading} type="submit">
              <div className="flex items-center justify-center space-x-2">
                <Shield /> <span>Sign In</span> <ArrowRight />
              </div>
            </Button>
          </form>

          {/* OR & Google */}
          <div className="mt-6">
            <div className="flex items-center">
              <div className="flex-grow border-t border-white/30" />
              <span className="px-3 text-sm text-white/70">OR</span>
              <div className="flex-grow border-t border-white/30" />
            </div>
            <div ref={googleBtnRef} className="flex justify-center mt-4" />
            {googleLoading && (
              <div className="flex items-center justify-center mt-2 space-x-2 text-white/70">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Zap />
                </motion.div>
                <span>Processing…</span>
              </div>
            )}
          </div>

          {/* Signup Link */}
          <p className="mt-6 text-sm text-center text-white/70">
            Don’t have an account?{' '}
            <Link to="/signup" className="underline text-primary-400">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm p-6 border shadow-lg bg-white/10 backdrop-blur-lg border-white/20 rounded-2xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <div className="mb-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 animate-spin-slow">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="mb-1 text-xl font-bold text-white">Reset Password</h2>
                <p className="text-sm text-white/70">
                  {stage === 'email' && 'Enter your email'}
                  {stage === 'otp' && 'Enter the OTP sent to your email'}
                  {stage === 'reset' && 'Set your new password'}
                </p>
              </div>

              <AnimatePresence exitBeforeEnter>
                {stage === 'email' && (
                  <motion.form
                    key="email"
                    onSubmit={handleSendOtp}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-4"
                  >
                    <Input
                      type="email"
                      label="Email"
                      placeholder="you@example.com"
                      icon={<Mail />}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      fullWidth
                    />
                    <Button fullWidth isLoading={isLoading} type="submit">
                      Send Code
                    </Button>
                  </motion.form>
                )}

                {stage === 'otp' && (
                  <motion.form
                    key="otp"
                    onSubmit={handleVerifyOtp}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-4"
                  >
                    {renderOtpInputs()}
                    <Button fullWidth isLoading={isLoading} type="submit">
                      Verify Code
                    </Button>
                  </motion.form>
                )}

                {stage === 'reset' && (
                  <motion.form
                    key="reset"
                    onSubmit={handleReset}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <Input
                        type={showNewPass ? 'text' : 'password'}
                        label="New Password"
                        icon={<Lock />}
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                        fullWidth
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(v => !v)}
                        className="absolute inset-y-0 flex items-center right-3 text-white/70"
                      >
                        {showNewPass ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        type={showConfirmPass ? 'text' : 'password'}
                        label="Confirm Password"
                        icon={<Lock />}
                        value={confirmPass}
                        onChange={e => setConfirmPass(e.target.value)}
                        fullWidth
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(v => !v)}
                        className="absolute inset-y-0 flex items-center right-3 text-white/70"
                      >
                        {showConfirmPass ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                    <Button fullWidth isLoading={isLoading} type="submit">
                      Update Password
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="flex justify-between mt-4 text-sm text-white/70">
                <button onClick={() => setShowForgot(false)}>Cancel</button>
                <button
                  onClick={() => {
                    setStage(stage === 'reset' ? 'otp' : 'email');
                    setError('');
                    if (stage === 'otp') setOtp(Array(OTP_LENGTH).fill(''));
                  }}
                >
                  ← Back
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
