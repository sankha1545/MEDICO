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
  | 'googleRoleSelection'
  | 'googleProcessing';

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
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false);
  const [otpSentSuccess, setOtpSentSuccess] = useState<boolean>(false);

  // --- Account Details State ---
  const [name, setName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [role, setRole] = useState<Role>('patient');
  const [creating, setCreating] = useState<boolean>(false);

  // --- Password Visibility ---
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // --- Google Signup State ---
  const [googleTempToken, setGoogleTempToken] = useState<string | null>(null);
  const [googleProcessing, setGoogleProcessing] = useState<boolean>(false);

  // --- OTP Timer & Resend Control ---
  const [timer, setTimer] = useState<number>(30);
  const [canResendOtp, setCanResendOtp] = useState<boolean>(false);

  // --- GSI Script Loading & Button Ref ---
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [gsiInitialized, setGsiInitialized] = useState(false);

  // Load the GSI script once
  useEffect(() => {
    if (gsiLoaded) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGsiLoaded(true);
    script.onerror = () => console.error('Failed to load Google Identity Services script');
    document.body.appendChild(script);
  }, [gsiLoaded]);

  // Initialize & render Google button when on chooseMethod step
  useEffect(() => {
    if (!gsiLoaded || gsiInitialized || step !== 'chooseMethod' || !googleBtnRef.current) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID is not set');
      return;
    }
    const handleCredentialResponse = async (response: { credential: string }) => {
      if (!response.credential) {
        setError('Google did not return a credential');
        setStep('chooseMethod');
        return;
      }
      setError(null);
      setStep('googleProcessing');
      setGoogleProcessing(true);
      try {
        const tempToken = await signUpWithGoogle(response.credential);
        setGoogleTempToken(tempToken);
        setStep('googleRoleSelection');
      } catch (err: any) {
        console.error('Google signup error:', err);
        setError(err.message || 'Google signup failed');
        setStep('chooseMethod');
      } finally {
        setGoogleProcessing(false);
      }
    };

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      ux_mode: 'popup',
    });
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size: 'large',
      width: 250,
      text: 'signup_with',
    });
    setGsiInitialized(true);
  }, [gsiLoaded, gsiInitialized, step, signUpWithGoogle]);

  // Countdown Logic
  useEffect(() => {
    if (step !== 'otpInput') return;
    if (timer > 0 && !canResendOtp) {
      const id = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(id);
    }
    if (timer === 0) {
      setCanResendOtp(true);
    }
  }, [timer, canResendOtp, step]);

  // Hide OTP success banner after 3 seconds
  useEffect(() => {
    if (otpSentSuccess) {
      const id = setTimeout(() => setOtpSentSuccess(false), 3000);
      return () => clearTimeout(id);
    }
  }, [otpSentSuccess]);

  // Handlers

  // Send or Resend OTP
  const handleSendOtp = async () => {
    setError(null);
    if (!email) {
      setError('Email is required');
      return;
    }
    setSendingOtp(true);
    try {
      await sendEmailOtp(email);
      setOtpSentSuccess(true);
      setStep('otpInput');
      setTimer(30);
      setCanResendOtp(false);
      setOtp('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      if (msg.includes('exists') || msg.includes('registered')) {
        setError(msg);
      } else {
        setError(msg || 'Failed to send OTP');
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    setError(null);
    if (otp.length !== 6) {
      setError('Enter the full 6-digit OTP');
      return;
    }
    setVerifyingOtp(true);
    try {
      await verifyEmailOtp(email, otp);
      setStep('details');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Create Account via Email
  const handleCreateAccount = async () => {
    setError(null);
    if (!name || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setCreating(true);
    try {
      await signup({ name, email, password, role });
      navigate('/login?signup=success');
    } catch (err: any) {
      if (err.message.includes('exists') || err.message.includes('in use')) {
        setError('An account already exists with this email. Try another.');
      } else {
        setError(err.message || 'Signup failed');
      }
    } finally {
      setCreating(false);
    }
  };

  // Submit role after Google signup
  const handleGoogleRoleSubmit = async () => {
    if (!googleTempToken) {
      setError('Missing token from Google signup');
      setStep('chooseMethod');
      return;
    }
    setError(null);
    setCreating(true);
    try {
      await completeGoogleSignup(googleTempToken, role);
      navigate('/login?signup=success');
    } catch (err: any) {
      setError(err.message || 'Failed to complete Google signup');
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

  // Render OTP inputs as 6 boxes
  const renderOtpInputs = () =>
    Array.from({ length: 6 }).map((_, idx) => (
      <input
        key={idx}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={otp[idx] || ''}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/, '');
          const newOtp = otp.split('');
          newOtp[idx] = val;
          setOtp(newOtp.join(''));
          if (val && idx < 5) {
            document.getElementById(`otp-${idx + 1}`)?.focus();
          }
        }}
        id={`otp-${idx}`}
        className="w-12 h-12 border-2 border-gray-300 rounded-md text-center text-lg focus:border-primary-500 outline-none"
      />
    ));

  // --- UI JSX ---
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left graphic pane */}
      <SlideIn direction="left">
        <div className="hidden md:block relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tl from-secondary-500 to-primary-500 opacity-90" />
          <img
            src="https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Doctor with patient"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 flex justify-center items-center p-12">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl text-white max-w-md">
              <h2 className="text-2xl font-bold mb-4">
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

      {/* Right form pane */}
      <FadeIn>
        <div className="flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center mb-5">
                <div className="text-primary-500 mr-2">{/* logo svg */}</div>
                <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-primary-900 bg-clip-text text-transparent">
                  MedicoX
                </span>
              </Link>
              <h1 className="text-3xl font-bold text-gray-800">Create an account</h1>
              <p className="text-gray-600 mt-2 " >Sign up to get started</p>
            </div>

            {/* Success Banner */}
            <AnimatePresence>
              {otpSentSuccess && step === 'otpInput' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-center"
                >
                  Your OTP is sent successfully!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Banner */}
           {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Steps */}
            <AnimatePresence>
              {step === 'chooseMethod' && (
                <motion.div
                  key="method"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="space-y-4"
                >
                  <div ref={googleBtnRef} />
                  <div className="text-center my-2">OR</div>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      setError(null);
                      setStep('emailInput');
                    }}
                  >
                    Sign up with Email
                  </Button>
                </motion.div>
              )}

              {step === 'emailInput' && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="space-y-4"
                >
                  <Input
                    type="email"
                    id="email"
                    label="Email Address"
                    placeholder="you@example.com"
                    icon={<Mail size={16} />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                  />
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleSendOtp}
                    isLoading={sendingOtp}
                  >
                    {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                  <div className="flex justify-between text-sm text-gray-500">
                    <button
                      onClick={() => {
                        setError(null);
                        setStep('chooseMethod');
                      }}
                      className="underline"
                    >
                      Back
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'otpInput' && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between">{renderOtpInputs()}</div>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleVerifyOtp}
                    isLoading={verifyingOtp}
                  >
                    {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                  <div className="flex justify-between text-sm text-gray-500">
                    <button onClick={handleBack} className="underline">
                      Back
                    </button>
                    {canResendOtp ? (
                      <button onClick={handleSendOtp} className="underline">
                        Resend OTP
                      </button>
                    ) : (
                      <span>Resend in {timer}s</span>
                    )}
                  </div>
                </motion.div>
              )}

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
                    id="name"
                    label="Full Name"
                    placeholder="John Doe"
                    icon={<UserIcon size={16} />}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                  />

                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      label="Password"
                      placeholder="••••••••"
                      icon={<Lock size={16} />}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      fullWidth
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 top-6 flex items-center"
                      aria-label={showPassword ? 'Hide' : 'Show'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      label="Confirm Password"
                      placeholder="••••••••"
                      icon={<Lock size={16} />}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      fullWidth
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-3 top-6 flex items-center"
                      aria-label={showConfirmPassword ? 'Hide' : 'Show'}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      I am a:
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {(['patient', 'doctor'] as Role[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          disabled={creating}
                          className={`
                            py-2 rounded-md border transition-colors
                            ${role === r
                              ? 'bg-primary-50 border-primary-500 text-primary-700'
                              : 'border-gray-300 hover:bg-gray-50'}
                          `}
                        >
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-500">
                    <button onClick={handleBack} className="underline">
                      Back
                    </button>
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleCreateAccount}
                    isLoading={creating}
                  >
                    {creating ? 'Creating...' : 'Create Account'}
                  </Button>
                </motion.div>
              )}

              {step === 'googleProcessing' && (
                <motion.div
                  key="googleProcessing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-4"
                >
                  <div>Processing Google signup...</div>
                </motion.div>
              )}

              {step === 'googleRoleSelection' && (
                <motion.div
                  key="googleRoleSelection"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-medium mb-4 text-center">
                    Choose Your Role
                  </h3>
                  <div className="mb-4">
                    <label className="block mb-1">Role</label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="patient"
                          checked={role === 'patient'}
                          onChange={() => setRole('patient')}
                          className="mr-1"
                        />
                        Patient
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="doctor"
                          checked={role === 'doctor'}
                          onChange={() => setRole('doctor')}
                          className="mr-1"
                        />
                        Doctor
                      </label>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleGoogleRoleSubmit}
                    isLoading={creating}
                  >
                    {creating ? 'Processing...' : 'Continue'}
                  </Button>
                  <div className="mt-2 text-sm text-gray-500 text-center">
                    <button
                      onClick={() => setStep('chooseMethod')}
                      className="underline"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom link */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
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
