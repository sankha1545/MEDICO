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
  Atom,
  Cpu,
  Globe,
  Star,
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

  // Multi-step & error
  const [step, setStep] = useState<Step>('chooseMethod');
  const [error, setError] = useState<string | null>(null);

  // Email signup
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSentSuccess, setOtpSentSuccess] = useState(false);

  // Account details
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('patient');
  const [creating, setCreating] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP timer
  const [timer, setTimer] = useState(30);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // Google signup
  const [googleTempToken, setGoogleTempToken] = useState<string | null>(null);
  const [googleProcessing, setGoogleProcessing] = useState(false);

  // GSI script & ref
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [gsiLoaded, setGsiLoaded] = useState(false);

  // Load GSI script
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

  // Init GSI client
  useEffect(() => {
    if (!gsiLoaded) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID not set');
      return;
    }
    window.google.accounts.id.initialize({
      client_id: clientId,
      ux_mode: 'popup',
      callback: async ({ credential }: { credential: string }) => {
        if (!credential) {
          setError('Google authentication failed');
          return setStep('chooseMethod');
        }
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
  }, [gsiLoaded, signUpWithGoogle]);

  // Render GSI button
  useEffect(() => {
    if (gsiLoaded && step === 'chooseMethod' && googleBtnRef.current) {
      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 200,
        text: 'signup_with',
      });
    }
  }, [gsiLoaded, step]);

  // OTP timer countdown
  useEffect(() => {
    if (step !== 'otpInput') return;
    if (timer > 0 && !canResendOtp) {
      const id = setTimeout(() => setTimer(t => t - 1), 1000);
      return () => clearTimeout(id);
    }
    if (timer === 0) setCanResendOtp(true);
  }, [timer, canResendOtp, step]);

  // Hide OTP success banner
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
      setError(e.response?.data?.message || e.message || 'Failed to send OTP');
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
      return setStep('chooseMethod');
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
          if (d && i < 5) {
            document.getElementById(`otp-${i+1}`)?.focus();
          }
        }}
        className="w-16 h-16 text-2xl font-bold text-center transition transform border-2 bg-white/10 border-white/20 rounded-2xl backdrop-blur-xl focus:border-primary-400 focus:ring-4 focus:ring-primary-400/30 hover:scale-110 focus:scale-110 placeholder-white/50"
        initial={{ opacity:0, scale:0.8, rotateY:-90 }}
        animate={{ opacity:1, scale:1, rotateY:0 }}
        transition={{ delay:i*0.1, type:'spring', stiffness:300, damping:20 }}
        whileFocus={{ boxShadow:'0 0 30px rgba(99,102,241,0.5)', scale:1.15, rotateY:10 }}
      />
    ));

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background (non-interactive) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="absolute inset-0 pointer-events-none animate-gradient-xy bg-gradient-to-tl from-primary-500/30 via-secondary-500/20 to-accent-500/30" />
        </div>
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.3) 1px,transparent 1px),
              linear-gradient(90deg,rgba(99,102,241,0.3) 1px,transparent 1px),
              linear-gradient(rgba(168,85,247,0.2) 1px,transparent 1px),
              linear-gradient(90deg,rgba(168,85,247,0.2) 1px,transparent 1px)
            `,
            backgroundSize: '100px 100px,100px 100px,20px 20px,20px 20px',
            animation: 'float 20s ease-in-out infinite',
          }}
        />
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 80 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full pointer-events-none bg-gradient-to-r from-primary-400 to-secondary-400"
              style={{ top:`${Math.random()*100}%`, left:`${Math.random()*100}%` }}
              animate={{
                x:[0, Math.random()*30-15, 0],
                y:[0, -50, 0],
                opacity:[0.2,1,0.2],
                scale:[1,1.5,1],
                rotateZ:[0,360],
              }}
              transition={{ duration:5+Math.random()*5, repeat:Infinity, ease:'easeInOut', delay:Math.random()*5 }}
            />
          ))}
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[Atom, Cpu, Globe, Star].map((Icon, i) => (
            <motion.div
              key={i}
              className="absolute pointer-events-none text-white/10"
              style={{ left:`${20+i*20}%`, top:`${10+i*15}%`, fontSize:'6rem' }}
              animate={{ rotateY:[0,360], rotateX:[0,180,0], scale:[1,1.2,1] }}
              transition={{ duration:15+i*5, repeat:Infinity, ease:'linear' }}
            >
              <Icon size={96} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Interactive content */}
      <div className="relative z-20 flex items-center justify-center min-h-screen p-4 pointer-events-auto">
        <motion.div
          className="w-full max-w-xl"
          initial={{ opacity:0, y:100, rotateX:45, scale:0.8 }}
          animate={{ opacity:1, y:0, rotateX:0, scale:1 }}
          transition={{ duration:1.2, type:'spring', stiffness:100, damping:20 }}
          style={{ perspective:'2000px', transformStyle:'preserve-3d' }}
        >
          <motion.div
            className="relative p-10 border shadow-2xl bg-white/10 backdrop-blur-2xl border-white/20 rounded-3xl"
            whileHover={{ scale:1.02, rotateY:5, rotateX:2, boxShadow:'0 50px 100px rgba(0,0,0,0.3)' }}
            transition={{ type:'spring', stiffness:300, damping:30 }}
          >
            {/* Glow */}
            <div className="absolute pointer-events-none -inset-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 opacity-30 blur-xl animate-pulse rounded-3xl" />

            {/* Header */}
            <div className="mb-8 text-center pointer-events-auto">
              <motion.h1
                className="mb-2 text-5xl font-bold text-white"
                initial={{ opacity:0, scale:0.5, rotateX:-90 }}
                animate={{ opacity:1, scale:1, rotateX:0 }}
                transition={{ delay:0.3, type:'spring', stiffness:200 }}
                style={{
                  textShadow:'0 0 30px rgba(255,255,255,0.5)',
                  background:'linear-gradient(135deg,#fff 0%,#e0e7ff 50%,#c7d2fe 100%)',
                  WebkitBackgroundClip:'text',
                  WebkitTextFillColor:'transparent'
                }}
              >
                Join the Future
              </motion.h1>
              <motion.p className="text-lg text-white/80" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}>
                Experience next-generation healthcare
              </motion.p>
            </div>

            {/* Success */}
            <AnimatePresence>
              {otpSentSuccess && step==='otpInput' && (
                <motion.div
                  className="p-4 mb-6 border pointer-events-auto bg-emerald-500/20 border-emerald-500/30 text-emerald-300 rounded-2xl backdrop-blur-md"
                  initial={{ opacity:0, y:-20 }}
                  animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-20 }}
                  style={{ boxShadow:'0 0 30px rgba(16,185,129,0.3)' }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Sparkles size={20}/>
                    <span>OTP sent successfully! Check your email</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="p-4 mb-6 text-red-300 border pointer-events-auto bg-red-500/20 border-red-500/30 rounded-2xl backdrop-blur-md"
                  initial={{ opacity:0, y:-20 }}
                  animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-20 }}
                  style={{ boxShadow:'0 0 30px rgba(239,68,68,0.3)' }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Shield size={20}/>
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Multi-step */}
            <AnimatePresence exitBeforeEnter>
              {/* Choose Method */}
              {step==='chooseMethod' && (
                <motion.div
                  key="chooseMethod"
                  className="space-y-6 pointer-events-auto"
                  initial={{ opacity:0, x:-100 }}
                  animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:100 }}
                  transition={{ type:'spring', stiffness:200, damping:25 }}
                >
                  <div ref={googleBtnRef} className="flex justify-center" />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/30" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 border rounded-full bg-slate-900/70 text-white/80 border-white/20 backdrop-blur-sm">OR</span>
                    </div>
                  </div>
                  <Button fullWidth onClick={() => { setError(null); setStep('emailInput'); }}>
                    <div className="flex items-center justify-center space-x-2">
                      <Mail size={20}/>
                      <span>Continue with Email</span>
                      <ChevronsRight size={20}/>
                    </div>
                  </Button>
                </motion.div>
              )}

              {/* Email Input */}
              {step==='emailInput' && (
                <motion.div
                  key="emailInput"
                  className="space-y-6 pointer-events-auto"
                  initial={{ opacity:0, x:-100 }}
                  animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:100 }}
                  transition={{ type:'spring', stiffness:200, damping:25 }}
                >
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="you@example.com"
                    icon={<Mail size={20} className="text-primary-400"/>}
                    value={email}
                    onChange={e=>setEmail(e.target.value)}
                    fullWidth
                  />
                  <Button fullWidth onClick={handleSendOtp} isLoading={sendingOtp}>
                    <div className="flex items-center justify-center space-x-2">
                      <Zap size={20}/>
                      <span>{sendingOtp ? 'Sending…' : 'Send Verification Code'}</span>
                    </div>
                  </Button>
                  <button onClick={()=>setStep('chooseMethod')} className="underline text-white/70">
                    ← Back to options
                  </button>
                </motion.div>
              )}

              {/* OTP Input */}
              {step==='otpInput' && (
                <motion.div
                  key="otpInput"
                  className="space-y-6 pointer-events-auto"
                  initial={{ opacity:0, x:-100 }}
                  animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:100 }}
                  transition={{ type:'spring', stiffness:200, damping:25 }}
                >
                  <div className="flex justify-center space-x-2">
                    {renderOtpInputs()}
                  </div>
                  <Button fullWidth onClick={handleVerifyOtp} isLoading={verifyingOtp}>
                    <div className="flex items-center justify-center space-x-2">
                      <Shield size={20}/>
                      <span>{verifyingOtp ? 'Verifying…' : 'Verify Code'}</span>
                    </div>
                  </Button>
                  <div className="flex items-center justify-between text-white/70">
                    <button onClick={handleBack}>← Back</button>
                    {canResendOtp
                      ? <button onClick={handleSendOtp} className="text-primary-400">Resend Code</button>
                      : <span>Resend in {timer}s</span>}
                  </div>
                </motion.div>
              )}

              {/* Details */}
              {step==='details' && (
                <motion.div
                  key="details"
                  className="space-y-6 pointer-events-auto"
                  initial={{ opacity:0, x:-100 }}
                  animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:100 }}
                  transition={{ type:'spring', stiffness:200, damping:25 }}
                >
                  <Input
                    type="text"
                    label="Full Name"
                    placeholder="John Doe"
                    icon={<Users size={20} className="text-primary-400"/>}
                    value={name}
                    onChange={e=>setName(e.target.value)}
                    fullWidth
                  />
                  <div className="relative">
                    <Input
                      type={showPassword?'text':'password'}
                      label="Password"
                      placeholder="••••••••"
                      icon={<Lock size={20} className="text-primary-400"/>}
                      value={password}
                      onChange={e=>setPassword(e.target.value)}
                      fullWidth
                    />
                    <button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute -translate-y-1/2 right-4 top-1/2 text-white/70">
                      {showPassword?<EyeOff size={20}/>:<Eye size={20}/>}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword?'text':'password'}
                      label="Confirm Password"
                      placeholder="••••••••"
                      icon={<Lock size={20} className="text-primary-400"/>}
                      value={confirmPassword}
                      onChange={e=>setConfirmPassword(e.target.value)}
                      fullWidth
                    />
                    <button type="button" onClick={()=>setShowConfirmPassword(v=>!v)} className="absolute -translate-y-1/2 right-4 top-1/2 text-white/70">
                      {showConfirmPassword?<EyeOff size={20}/>:<Eye size={20}/>}
                    </button>
                  </div>
                  <div>
                    <label className="block mb-2 text-white">I am a:</label>
                    <div className="flex space-x-4">
                      {(['patient','doctor'] as Role[]).map(r=>(
                        <button
                          key={r}
                          type="button"
                          onClick={()=>setRole(r)}
                          className={`px-4 py-2 rounded-lg border ${role===r?'border-primary-400 bg-primary-500/20':'border-white/30'} text-white`}
                        >
                          {r.charAt(0).toUpperCase()+r.slice(1)}
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

              {/* Google Processing */}
              {step==='googleProcessing' && (
                <motion.div key="googleProcessing" className="py-16 text-center pointer-events-auto"
                  initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.5 }}
                >
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin-slow">
                    <Sparkles size={24} className="text-white"/>
                  </div>
                  <p className="text-white">Processing Google signup…</p>
                </motion.div>
              )}

              {/* Google Role Selection */}
              {step==='googleRoleSelection' && (
                <motion.div key="googleRoleSelection" className="space-y-6 pointer-events-auto"
                  initial={{ opacity:0, x:-100 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:100 }} transition={{ type:'spring', stiffness:200, damping:25 }}
                >
                  <p className="mb-4 text-center text-white">Choose your role</p>
                  <div className="flex space-x-4">
                    {(['patient','doctor'] as Role[]).map(r=>(
                      <button
                        key={r}
                        type="button"
                        onClick={()=>setRole(r)}
                        className={`px-4 py-2 rounded-lg border ${role===r?'border-primary-400 bg-primary-500/20':'border-white/30'} text-white`}
                      >
                        {r.charAt(0).toUpperCase()+r.slice(1)}
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
            <div className="mt-8 text-center pointer-events-auto">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:underline">
                Sign in
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUpPage;
