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
  Sparkles,
  Shield,
  Zap,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

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
      width: 400,
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
      <motion.input
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
        className="w-14 h-14 text-xl font-bold text-center bg-white/80 backdrop-blur-md border-2 border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-300 hover:bg-white/90 focus:bg-white/90 transform-gpu hover:scale-110 focus:scale-110"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
        whileFocus={{ scale: 1.1, boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }}
      />
    ));

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-accent-500/20" />
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 50, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ 
            duration: 0.8, 
            type: 'spring',
            stiffness: 100,
            damping: 20 
          }}
          style={{ 
            perspective: '1000px',
            transformStyle: 'preserve-3d' 
          }}
        >
          {/* Floating Form Container */}
          <motion.div 
            className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
            whileHover={{ 
              scale: 1.02,
              rotateY: 2,
              boxShadow: '0 25px 50px rgba(0,0,0,0.2)' 
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl opacity-20 blur-xl" />
            
            {/* Header */}
            <motion.div 
              className="mb-8 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/" className="inline-flex items-center mb-6 group">
                <motion.div
                  className="flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </motion.div>
                  <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">
                    MedicoX
                  </span>
                </motion.div>
              </Link>
              
              <motion.h1 
                className="text-4xl font-bold text-white mb-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                Join the Future
              </motion.h1>
              
              <motion.p 
                className="text-white/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Create your account to experience next-gen healthcare
              </motion.p>
            </motion.div>

            {/* Success Banner */}
            <AnimatePresence>
              {otpSentSuccess && step === 'otpInput' && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  className="p-4 mb-6 text-center text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    ✨ OTP sent successfully! Check your email
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  className="p-4 mb-6 text-center text-red-300 bg-red-500/20 border border-red-500/30 rounded-2xl backdrop-blur-md"
                >
                  <motion.div
                    animate={{ x: [-10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    {error}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Multi-Step Form */}
            <AnimatePresence mode="wait">
              {/* Choose Method */}
              {step === 'chooseMethod' && (
                <motion.div
                  key="chooseMethod"
                  initial={{ opacity: 0, x: -100, rotateY: -10 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: 100, rotateY: 10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="space-y-6"
                >
                  {/* Google Button Container */}
                  <motion.div 
                    ref={googleBtnRef}
                    className="flex justify-center"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  />
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 text-white/70 bg-slate-900/50 backdrop-blur-sm rounded-full">
                        OR
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    fullWidth 
                    onClick={() => { setError(null); setStep('emailInput'); }}
                    className="relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      <Mail className="w-5 h-5" />
                      <span>Continue with Email</span>
                    </span>
                  </Button>
                </motion.div>
              )}

              {/* Email Input */}
              {step === 'emailInput' && (
                <motion.div
                  key="emailInput"
                  initial={{ opacity: 0, x: -100, rotateY: -10 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: 100, rotateY: 10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="space-y-6"
                >
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="you@example.com"
                    icon={<Mail size={20} className="text-primary-500" />}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    fullWidth
                  />
                  
                  <Button fullWidth onClick={handleSendOtp} isLoading={sendingOtp}>
                    <span className="flex items-center justify-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>{sendingOtp ? 'Sending Magic Link...' : 'Send Verification Code'}</span>
                    </span>
                  </Button>
                  
                  <motion.button
                    onClick={() => setStep('chooseMethod')}
                    className="w-full text-sm text-white/70 hover:text-white transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ← Back to options
                  </motion.button>
                </motion.div>
              )}

              {/* OTP Input */}
              {step === 'otpInput' && (
                <motion.div
                  key="otpInput"
                  initial={{ opacity: 0, x: -100, rotateY: -10 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: 100, rotateY: 10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <motion.div
                      className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl"
                      animate={{ rotateY: [0, 180, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Shield className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white mb-2">Verify Your Email</h3>
                    <p className="text-white/70 text-sm">
                      Enter the 6-digit code sent to {email}
                    </p>
                  </div>
                  
                  <div className="flex justify-center space-x-3">
                    {renderOtpInputs()}
                  </div>
                  
                  <Button fullWidth onClick={handleVerifyOtp} isLoading={verifyingOtp}>
                    <span className="flex items-center justify-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>{verifyingOtp ? 'Verifying...' : 'Verify Code'}</span>
                    </span>
                  </Button>
                  
                  <div className="flex justify-between items-center text-sm">
                    <motion.button
                      onClick={handleBack}
                      className="text-white/70 hover:text-white transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      ← Back
                    </motion.button>
                    
                    {canResendOtp ? (
                      <motion.button
                        onClick={handleSendOtp}
                        className="text-primary-400 hover:text-primary-300 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Resend Code
                      </motion.button>
                    ) : (
                      <span className="text-white/50">Resend in {timer}s</span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Account Details */}
              {step === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: -100, rotateY: -10 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: 100, rotateY: 10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <motion.div
                      className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Users className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white">Complete Your Profile</h3>
                  </div>

                  <Input
                    type="text"
                    label="Full Name"
                    placeholder="John Doe"
                    icon={<UserIcon size={20} className="text-primary-500" />}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    fullWidth
                  />

                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      label="Password"
                      placeholder="••••••••"
                      icon={<Lock size={20} className="text-primary-500" />}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      fullWidth
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </motion.button>
                  </div>

                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      label="Confirm Password"
                      placeholder="••••••••"
                      icon={<Lock size={20} className="text-primary-500" />}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      fullWidth
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </motion.button>
                  </div>

                  <div>
                    <label className="block mb-4 text-sm font-medium text-white">I am a:</label>
                    <div className="grid grid-cols-2 gap-4">
                      {(['patient', 'doctor'] as Role[]).map(r => (
                        <motion.button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          disabled={creating}
                          className={`
                            relative py-4 px-6 rounded-xl border-2 transition-all duration-300
                            transform-gpu hover:scale-105 hover:-translate-y-1
                            ${role === r
                              ? 'bg-primary-500/20 border-primary-500 text-primary-300 shadow-lg shadow-primary-500/25'
                              : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30'
                            }
                          `}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: r === 'patient' ? 0.1 : 0.2 }}
                        >
                          <span className="font-semibold">
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </span>
                          {role === r && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <motion.button
                    onClick={handleBack}
                    className="w-full text-sm text-white/70 hover:text-white transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ← Back
                  </motion.button>

                  <Button fullWidth onClick={handleCreateAccount} isLoading={creating}>
                    <span className="flex items-center justify-center space-x-2">
                      <Sparkles className="w-5 h-5" />
                      <span>{creating ? 'Creating Your Account...' : 'Create Account'}</span>
                    </span>
                  </Button>
                </motion.div>
              )}

              {/* Google Processing */}
              {step === 'googleProcessing' && (
                <motion.div 
                  key="googleProcessing" 
                  initial={{ opacity: 0, scale: 0.8 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="py-12 text-center"
                >
                  <motion.div
                    className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl"
                    animate={{ rotateY: [0, 180, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">Processing Google Signup</h3>
                  <p className="text-white/70">Please wait while we set up your account...</p>
                </motion.div>
              )}

              {/* Google Role Selection */}
              {step === 'googleRoleSelection' && (
                <motion.div 
                  key="googleRoleSelection" 
                  initial={{ opacity: 0, x: -100, rotateY: -10 }} 
                  animate={{ opacity: 1, x: 0, rotateY: 0 }} 
                  exit={{ opacity: 0, x: 100, rotateY: 10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <motion.div
                      className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl"
                      animate={{ rotateX: [0, 180, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Users className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white mb-2">Choose Your Role</h3>
                    <p className="text-white/70">How would you like to use MedicoX?</p>
                  </div>

                  <div className="space-y-4">
                    {(['patient', 'doctor'] as Role[]).map(r => (
                      <motion.label 
                        key={r} 
                        className={`
                          flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                          transform-gpu hover:scale-105
                          ${role === r
                            ? 'bg-primary-500/20 border-primary-500 shadow-lg shadow-primary-500/25'
                            : 'bg-white/5 border-white/20 hover:bg-white/10'
                          }
                        `}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: r === 'patient' ? 0.1 : 0.2 }}
                      >
                        <input 
                          type="radio" 
                          name="role" 
                          value={r} 
                          checked={role === r} 
                          onChange={() => setRole(r)}
                          className="mr-4 w-5 h-5 text-primary-500 border-white/30 focus:ring-primary-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </div>
                          <div className="text-sm text-white/70">
                            {r === 'patient' ? 'Book appointments and manage health' : 'Provide consultations and manage patients'}
                          </div>
                        </div>
                      </motion.label>
                    ))}
                  </div>

                  <Button fullWidth onClick={handleGoogleRoleSubmit} isLoading={creating}>
                    <span className="flex items-center justify-center space-x-2">
                      <ChevronsRight className="w-5 h-5" />
                      <span>{creating ? 'Setting Up...' : 'Continue'}</span>
                    </span>
                  </Button>

                  <motion.button
                    onClick={() => setStep('chooseMethod')}
                    className="w-full text-sm text-white/70 hover:text-white transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <motion.div 
              className="mt-8 text-center text-sm text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-primary-400 hover:text-primary-300 transition-colors font-semibold hover:underline"
              >
                Sign in
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUpPage;