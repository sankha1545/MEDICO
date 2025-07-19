// File: frontend/src/pages/SignUpPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronsRight,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { SlideIn, FadeIn } from '../components/animations/Transitions';

type Step =
  | 'chooseMethod'
  | 'emailInput'
  | 'otpInput'
  | 'details'
  | 'googleProcessing'
  | 'googleRoleSelection';

type Role = 'patient' | 'doctor';

declare global {
  interface Window {
    google: any;
  }
}

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    sendEmailOtp,
    verifyEmailOtp,
    signup,
    signUpWithGoogle,
    completeGoogleSignup,
  } = useAuth();

  // --- Multi-step & Error State ---
  const [step, setStep] = useState<Step>('chooseMethod');
  const [error, setError] = useState<string | null>(null);

  // --- Email Signup State ---
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSentSuccess, setOtpSentSuccess] = useState(false);

  // --- Account Details State ---
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('patient');
  const [creating, setCreating] = useState(false);

  // --- Password Visibility ---
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- OTP Timer & Resend Control ---
  const [timer, setTimer] = useState(30);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // --- Google Signup State ---
  const [googleTempToken, setGoogleTempToken] = useState<string | null>(null);
  const [googleProcessing, setGoogleProcessing] = useState(false);

  // --- GSI Script Loading & Button Ref ---
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [gsiLoaded, setGsiLoaded] = useState(false);

  // Load the GSI script once
  useEffect(() => {
    if (gsiLoaded) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGsiLoaded(true);
    script.onerror = () => console.error('Failed to load Google script');
    document.body.appendChild(script);
  }, [gsiLoaded]);

  // Initialize Google client when script loads
  useEffect(() => {
    if (!gsiLoaded) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID not set');
      return;
    }
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp: { credential: string }) => {
        if (!resp.credential) {
          setError('Google authentication failed');
          setStep('chooseMethod');
          return;
        }
        setError(null);
        setStep('googleProcessing');
        setGoogleProcessing(true);
        try {
          const token = await signUpWithGoogle(resp.credential);
          setGoogleTempToken(token);
          setStep('googleRoleSelection');
        } catch (e: any) {
          setError(e.message || 'Google signup error');
          setStep('chooseMethod');
        } finally {
          setGoogleProcessing(false);
        }
      },
      ux_mode: 'popup',
    });
  }, [gsiLoaded, signUpWithGoogle]);

  // Render or re-render Google button whenever we are in chooseMethod
  useEffect(() => {
    if (!gsiLoaded || step !== 'chooseMethod' || !googleBtnRef.current) return;
    googleBtnRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size: 'large',
      width: 500,
      text: 'signup_with',
    });
  }, [gsiLoaded, step]);

  // OTP countdown
  useEffect(() => {
    if (step !== 'otpInput') return;
    if (timer > 0 && !canResendOtp) {
      const id = setTimeout(() => setTimer(t => t - 1), 1000);
      return () => clearTimeout(id);
    }
    if (timer === 0) setCanResendOtp(true);
  }, [timer, canResendOtp, step]);

  // Hide OTP success banner after 3s
  useEffect(() => {
    if (otpSentSuccess) {
      const id = setTimeout(() => setOtpSentSuccess(false), 3000);
      return () => clearTimeout(id);
    }
  }, [otpSentSuccess]);

  // Handlers
  const handleSendOtp = async () => {
    setError(null);
    if (!email) return setError('Email is required');
    setSendingOtp(true);
    try {
      await sendEmailOtp(email);
      setOtpSentSuccess(true);
      setStep('otpInput');
      setTimer(30);
      setCanResendOtp(false);
      setOtp('');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message;
      setError(msg.includes('exists') ? msg : msg || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (otp.length !== 6) return setError('Enter 6-digit OTP');
    setVerifyingOtp(true);
    try {
      await verifyEmailOtp(email, otp);
      setStep('details');
    } catch (e: any) {
      setError(e.message || 'OTP verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleCreateAccount = async () => {
    setError(null);
    if (!name || !password || !confirmPassword) return setError('All fields are required');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setCreating(true);
    try {
      await signup({ name, email, password, role });
      navigate('/login?signup=success');
    } catch (e: any) {
      setError(e.message.includes('exists') ? 'Account already exists' : e.message || 'Signup failed');
    } finally {
      setCreating(false);
    }
  };

  const handleGoogleRoleSubmit = async () => {
    if (!googleTempToken) {
      setError('Missing Google token');
      setStep('chooseMethod');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await completeGoogleSignup(googleTempToken, role);
      navigate('/login?signup=success');
    } catch (e: any) {
      setError(e.message || 'Failed to complete Google signup');
      setStep('chooseMethod');
    } finally {
      setCreating(false);
    }
  };

  const handleBack = () => {
    if (step === 'otpInput') setStep('emailInput');
    else if (step === 'details') setStep('otpInput');
    else setStep('chooseMethod');
  };

  const renderOtpInputs = () =>
    Array.from({ length: 6 }).map((_, i) => (
      <input
        key={i}
        id={`otp-${i}`}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={otp[i] || ''}
        onChange={e => {
          const d = e.target.value.replace(/\D/, '');
          const arr = otp.split('');
          arr[i] = d;
          setOtp(arr.join(''));
          if (d && i < 5) document.getElementById(`otp-${i+1}`)?.focus();
        }}
        className="w-12 h-12 text-lg text-center border-2 border-gray-300 rounded-md outline-none focus:border-primary-500"
      />
    ));

  return (
    <div className="grid min-h-screen bg-white md:grid-cols-2">
      {/* Left pane */}
     <SlideIn direction="left">
        <div className="relative hidden overflow-hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-tl from-secondary-500 to-primary-500 opacity-90" />
          <img
            src="https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Doctor with patient"
            className="object-cover w-full h-full"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="max-w-md p-8 text-white bg-white/10 backdrop-blur-md rounded-2xl">
              <h2 className="mb-4 text-2xl font-bold">
                Join our healthcare community
              </h2>
              <p className="mb-6">
                Create an account to book appointments, access virtual consultations,
                and manage your health journey seamlessly.
              </p>
              <motion.div
                className="flex flex-col space-y-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
                }}
              >
                {[
                  'Book appointments with top specialists',
                  'Access your medical records anytime',
                  'Get reminders for medications and appointments',
                  'Connect with doctors via virtual consultation',
                ].map((b, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center space-x-2"
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <ChevronsRight size={18} />
                    <span>{b}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </SlideIn>

      {/* Right pane */}
      <FadeIn>
        <div className="flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8 text-center">
              <Link to="/" className="inline-flex items-center mb-5">
                {/* logo */}
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-primary-900">
                  MedicoX
                </span>
              </Link>
              <h1 className="text-3xl font-bold">Create an account</h1>
              <p className="mt-2 text-gray-600">Sign up to get started</p>
            </div>

            {/* OTP success */}
            <AnimatePresence>
              {otpSentSuccess && step === 'otpInput' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-3 mb-4 text-center text-green-700 rounded-md bg-green-50"
                >
                  Your OTP has been sent!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 mb-4 text-center text-red-700 rounded-md bg-red-50"
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence>
              {/* chooseMethod */}
              {step === 'chooseMethod' && (
                <motion.div
                  key="chooseMethod"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="space-y-4"
                >
                  <div ref={googleBtnRef} />
                  <div className="my-2 text-center">OR</div>
                  <Button fullWidth onClick={() => { setError(null); setStep('emailInput'); }}>
                    Sign up with Email
                  </Button>
                </motion.div>
              )}

              {/* emailInput */}
              {step === 'emailInput' && (
                <motion.div
                  key="emailInput"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="space-y-4"
                >
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="you@example.com"
                    icon={<Mail size={16} />}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    fullWidth
                  />
                  <Button fullWidth onClick={handleSendOtp} isLoading={sendingOtp}>
                    {sendingOtp ? 'Sending OTP…' : 'Send OTP'}
                  </Button>
                  <div className="text-sm text-gray-500">
                    <button onClick={() => setStep('chooseMethod')} className="underline">
                      Back
                    </button>
                  </div>
                </motion.div>
              )}

              {/* otpInput */}
              {step === 'otpInput' && (
                <motion.div
                  key="otpInput"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between">{renderOtpInputs()}</div>
                  <Button fullWidth onClick={handleVerifyOtp} isLoading={verifyingOtp}>
                    {verifyingOtp ? 'Verifying…' : 'Verify OTP'}
                  </Button>
                  <div className="flex justify-between text-sm text-gray-500">
                    <button onClick={handleBack} className="underline">Back</button>
                    {canResendOtp ? (
                      <button onClick={handleSendOtp} className="underline">Resend OTP</button>
                    ) : (
                      <span>Resend in {timer}s</span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* details */}
              {step === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="space-y-4"
                >
                  <Input
                    type="text"
                    label="Full Name"
                    placeholder="John Doe"
                    icon={<UserIcon size={16} />}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    fullWidth
                  />

                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      label="Password"
                      placeholder="••••••••"
                      icon={<Lock size={16} />}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      fullWidth
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute inset-y-0 flex items-center right-3"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      label="Confirm Password"
                      placeholder="••••••••"
                      icon={<Lock size={16} />}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      fullWidth
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute inset-y-0 flex items-center right-3"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">I am a:</label>
                    <div className="grid grid-cols-2 gap-4">
                      {(['patient', 'doctor'] as Role[]).map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          disabled={creating}
                          className={`py-2 rounded-md border transition ${
                            role === r
                              ? 'bg-primary-50 border-primary-500 text-primary-700'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    <button onClick={handleBack} className="underline">Back</button>
                  </div>

                  <Button fullWidth onClick={handleCreateAccount} isLoading={creating}>
                    {creating ? 'Creating…' : 'Create Account'}
                  </Button>
                </motion.div>
              )}

              {/* googleProcessing */}
              {step === 'googleProcessing' && (
                <motion.div key="googleProcessing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4 text-center">
                  Processing Google signup…
                </motion.div>
              )}

              {/* googleRoleSelection */}
              {step === 'googleRoleSelection' && (
                <motion.div key="googleRoleSelection" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="space-y-4">
                  <h3 className="text-lg font-medium text-center">Choose Your Role</h3>
                  <div className="flex items-center justify-center space-x-4">
                    {(['patient', 'doctor'] as Role[]).map(r => (
                      <label key={r} className="flex items-center space-x-2">
                        <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} /> 
                        <span>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                  <Button fullWidth onClick={handleGoogleRoleSubmit} isLoading={creating}>
                    {creating ? 'Processing…' : 'Continue'}
                  </Button>
                  <div className="text-sm text-center text-gray-500">
                    <button onClick={() => setStep('chooseMethod')} className="underline">Cancel</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer link */}
            <div className="mt-6 text-sm text-center text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-500 hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default SignUpPage;
