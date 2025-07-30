// File: frontend/src/pages/SignUpPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronsRight,
  Mail,
  Sparkles,
  Shield,
  Zap,
  Users,
  Eye,
  EyeOff,
  Lock,
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
const OTP_LENGTH = 6;

declare global {
  interface Window { google: any; }
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

  const [step, setStep] = useState<Step>('chooseMethod');
  const [error, setError] = useState<string|null>(null);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSentSuccess, setOtpSentSuccess] = useState(false);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('patient');
  const [creating, setCreating] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [timer, setTimer] = useState(30);
  const [canResendOtp, setCanResendOtp] = useState(false);

  const [googleTempToken, setGoogleTempToken] = useState<string|null>(null);
  const [googleProcessing, setGoogleProcessing] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const otpRefs = useRef<HTMLInputElement[]>([]);

  // Load Google script
  useEffect(() => {
    if (gsiLoaded) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGsiLoaded(true);
    document.body.appendChild(script);
  }, [gsiLoaded]);

  // Initialize & render GSI
  useEffect(() => {
    if (!gsiLoaded) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
    if (!clientId) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      ux_mode: 'popup',
      callback: async ({ credential }: { credential: string }) => {
        setError(null);
        setStep('googleProcessing');
        setGoogleProcessing(true);
        try {
          const token = await signUpWithGoogle(credential);
          setGoogleTempToken(token);
          setStep('googleRoleSelection');
        } catch (e: any) {
          setError(e.message || 'Google signup error');
          setStep('chooseMethod');
        } finally {
          setGoogleProcessing(false);
        }
      },
    });
    if (step === 'chooseMethod' && googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 240,
        text: 'signup_with',
      });
    }
  }, [gsiLoaded, step, signUpWithGoogle]);

  // OTP countdown
  useEffect(() => {
    if (step !== 'otpInput') return;
    if (timer > 0 && !canResendOtp) {
      const id = setTimeout(() => setTimer(t => t - 1), 1000);
      return () => clearTimeout(id);
    }
    if (timer === 0) setCanResendOtp(true);
  }, [timer, canResendOtp, step]);

  // Hide success banner
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
      setOtp(Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
    } catch (e: any) {
      setError(e.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpChange = (i: number, v: string) => {
    if (!/^[0-9]?$/.test(v)) return;
    let arr = [...otp];
    arr[i] = v;
    setOtp(arr);
    if (v && i < OTP_LENGTH - 1) otpRefs.current[i+1]?.focus();
  };

  const handleVerifyOtp = async () => {
    setError(null);
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return setError('Enter full OTP');
    setVerifyingOtp(true);
    try {
      await verifyEmailOtp(email, code);
      setStep('details');
    } catch (e: any) {
      setError(e.message || 'OTP verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleCreateAccount = async () => {
    setError(null);
    if (!name || !password || !confirmPassword) return setError('All fields required');
    if (password !== confirmPassword) return setError('Passwords must match');
    setCreating(true);
    try {
      await signup({ name, email, password, role });
      navigate('/login?signup=success');
    } catch (e: any) {
      setError(e.message || 'Signup failed');
    } finally {
      setCreating(false);
    }
  };

  const handleGoogleRoleSubmit = async () => {
    if (!googleTempToken) return setStep('chooseMethod');
    setCreating(true);
    try {
      await completeGoogleSignup(googleTempToken, role);
      navigate('/login?signup=success');
    } catch (e: any) {
      setError(e.message || 'Google completion failed');
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

  const renderOtpGrid = () => (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {otp.map((d, i) => (
        <motion.input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleOtpChange(i, e.target.value)}
          ref={el => el && (otpRefs.current[i] = el)}
          className="w-full h-12 text-2xl font-bold text-center transition border rounded-lg sm:h-14 bg-white/20 border-white/30 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
        />
      ))}
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <motion.div
        className="w-full max-w-lg p-6 border shadow-lg bg-white/10 backdrop-blur-lg border-white/20 rounded-3xl sm:p-8"
        initial={{ opacity:0, y:50, scale:0.9 }}
        animate={{ opacity:1, y:0, scale:1 }}
        transition={{ duration:0.8 }}
      >
        {/* Logo */}
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-gradient-to-r from-primary-400 to-pink-500"/>
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-pink-500 to-accent-400">
              MedicoX
            </span>
          </Link>
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="flex items-center justify-center p-3 mb-4 text-red-100 border border-red-500 rounded-lg bg-red-600/30"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            >
              <Shield className="w-5 h-5 mr-2"/> {error}
            </motion.div>
          )}
          {otpSentSuccess && step==='otpInput' && (
            <motion.div
              className="flex items-center justify-center p-3 mb-4 border rounded-lg bg-emerald-600/30 border-emerald-500 text-emerald-100"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            >
              <Zap className="w-5 h-5 mr-2"/> OTP sent!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step content */}
        <AnimatePresence exitBeforeEnter>
          {/* Choose method */}
          {step==='chooseMethod' && (
            <motion.div
              key="choose"
              initial={{ opacity:0, x:-50 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:50 }}
              transition={{ type:'spring', stiffness:200, damping:20 }}
              className="space-y-4"
            >
              <div ref={googleBtnRef} className="flex justify-center" />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="flex-grow border-t border-white/30"/>
                </div>
                <div className="relative text-center">
                  <span className="px-3 rounded-full bg-slate-900/70 text-white/80">OR</span>
                </div>
              </div>
              <Button fullWidth onClick={() => setStep('emailInput')}>
                <div className="flex items-center justify-center space-x-2">
                  <Mail/> <span>Continue with Email</span> <ChevronsRight/>
                </div>
              </Button>
            </motion.div>
          )}

          {/* Email input */}
          {step==='emailInput' && (
            <motion.div
              key="email"
              initial={{ opacity:0, x:-50 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:50 }}
              transition={{ type:'spring', stiffness:200, damping:20 }}
              className="space-y-4"
            >
              <Input
                type="email" label="Email" placeholder="you@example.com"
                icon={<Mail className='text-black'/>} value={email}
                onChange={e=>setEmail(e.target.value)} fullWidth
              />
              <Button fullWidth onClick={handleSendOtp} isLoading={sendingOtp}>
                <div className="flex items-center justify-center space-x-2">
                  <Zap/> <span>Send OTP</span>
                </div>
              </Button>
              <button onClick={handleBack} className="text-sm underline text-white/70">← Back</button>
            </motion.div>
          )}

          {/* OTP input */}
          {step==='otpInput' && (
            <motion.div
              key="otp"
              initial={{ opacity:0, x:-50 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:50 }}
              transition={{ type:'spring', stiffness:200, damping:20 }}
              className="space-y-4"
            >
              {renderOtpGrid()}
              <Button fullWidth onClick={handleVerifyOtp} isLoading={verifyingOtp}>
                <div className="flex items-center justify-center space-x-2">
                  <Shield/> <span>Verify OTP</span>
                </div>
              </Button>
              <div className="flex justify-between text-sm text-white/70">
                <button onClick={handleBack}>← Back</button>
                {canResendOtp
                  ? <button onClick={handleSendOtp} className="text-primary-400">Resend</button>
                  : <span>Resend in {timer}s</span>
                }
              </div>
            </motion.div>
          )}

          {/* Details */}
          {step==='details' && (
            <motion.div
              key="details"
              initial={{ opacity:0, x:-50 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:50 }}
              transition={{ type:'spring', stiffness:200, damping:20 }}
              className="space-y-4"
            >
              <Input
                type="text" label="Full Name" placeholder="John Doe"
                icon={<Users className='text-black'/>} value={name}
                onChange={e=>setName(e.target.value)} fullWidth
              />
              <div className="relative">
                <Input
                  type={showPassword?'text':'password'} label="Password" placeholder="••••••••"
                  icon={<Lock className='text-black'/>} value={password}
                  onChange={e=>setPassword(e.target.value)} fullWidth
                />
                <button
                  type="button"
                  onClick={()=>setShowPassword(v=>!v)}
                  className="absolute inset-y-0 flex items-center right-3 text-white/70"
                >
                  {showPassword?<EyeOff className='text-black'/>:<Eye className='text-black'/>}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showConfirmPassword?'text':'password'}
                  label="Confirm Password" placeholder="••••••••"
                  icon={<Lock className='text-black'/>} value={confirmPassword}
                  onChange={e=>setConfirmPassword(e.target.value)} fullWidth
                />
                <button
                  type="button"
                  onClick={()=>setShowConfirmPassword(v=>!v)}
                  className="absolute inset-y-0 flex items-center right-3 text-white/70"
                >
                  {showConfirmPassword?<EyeOff className='text-black'/>:<Eye className='text-black'/>}
                </button>
              </div>
              <div>
                <label className="block mb-1 text-white">I am a:</label>
                <div className="flex space-x-4">
                  {(['patient','doctor'] as Role[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={()=>setRole(r)}
                      className={`px-4 py-2 rounded-lg border ${
                        role===r
                          ? 'border-primary-400 bg-primary-500/20'
                          : 'border-white/30'
                      } text-white`}
                    >
                      {r[0].toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={handleBack} className="text-white/70">← Back</button>
                <Button onClick={handleCreateAccount} isLoading={creating}>
                  Create Account
                </Button>
              </div>
            </motion.div>
          )}

          {/* Google processing & role */}
          {step==='googleProcessing' && (
            <motion.div
              key="gp"
              className="py-12 text-center"
              initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, scale:0.8 }}
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
                <Sparkles className="text-white" size={24}/>
              </div>
              <p className="text-white">Processing Google signup…</p>
            </motion.div>
          )}
          {step==='googleRoleSelection' && (
            <motion.div
              key="gr"
              className="space-y-4"
              initial={{ opacity:0, x:-50 }} animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:50 }}
            >
              <p className="mb-2 text-center text-white">Choose your role</p>
              <div className="flex justify-center space-x-4">
                {(['patient','doctor'] as Role[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={()=>setRole(r)}
                    className={`px-4 py-2 rounded-lg border ${
                      role===r
                        ? 'border-primary-400 bg-primary-500/20'
                        : 'border-white/30'
                    } text-white`}
                  >
                    {r[0].toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={()=>setStep('chooseMethod')} className="text-white/70">Cancel</button>
                <Button onClick={handleGoogleRoleSubmit} isLoading={creating}>
                  Continue
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="mt-6 text-sm text-center text-white/70">
          Already have an account?{' '}
          <Link to="/login" className="underline text-primary-400">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUpPage;
