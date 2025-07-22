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

  // form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // google login state
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [gsiInitialized, setGsiInitialized] = useState(false);

  // forgot password
  const [showForgot, setShowForgot] = useState(false);
  const [stage, setStage] = useState<'email' | 'otp' | 'reset'>('email');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // load saved email
  useEffect(() => {
    const saved = localStorage.getItem('savedEmail');
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  // login via token
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setIsLoading(true);
      loginWithToken(token)
        .catch(() => setError('Google login failed'))
        .finally(() => setIsLoading(false));
    }
  }, [searchParams, loginWithToken]);

  // redirect after auth
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'doctor' ? '/doc-dashboard' : '/home');
    }
  }, [isAuthenticated, user, navigate]);

  // load GSI script
  useEffect(() => {
    if (!gsiLoaded) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setGsiLoaded(true);
      script.onerror = () => console.error('Failed to load Google script');
      document.body.appendChild(script);
    }
  }, [gsiLoaded]);

  // init & render GSI button
  useEffect(() => {
    if (gsiLoaded && !gsiInitialized && googleBtnRef.current) {
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
        width: 200,
        text: 'signin_with',
      });
      setGsiInitialized(true);
    }
  }, [gsiLoaded, gsiInitialized, loginWithGoogle]);

  // handle login submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email.trim(), password.trim());
      if (rememberMe) localStorage.setItem('savedEmail', email.trim());
      else localStorage.removeItem('savedEmail');
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // password reset flows
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
      setError('Password updated! Please log in.');
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP input handler
  const handleOtpChange = (idx: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const arr = [...otp];
    arr[idx] = val;
    setOtp(arr);
    if (val && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };
  const renderOtpInputs = () =>
    otp.map((digit, i) => (
      <motion.input
        key={i}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={digit}
        onChange={e => handleOtpChange(i, e.target.value)}
        ref={el => el && (inputRefs.current[i] = el)}
        className="text-xl font-bold text-center transition border-2 w-14 h-14 bg-white/10 border-white/20 rounded-2xl backdrop-blur-xl focus:border-primary-400 focus:ring-4 focus:ring-primary-400/30 transform-gpu hover:scale-110 focus:scale-110 placeholder-white/50"
      />
    ));

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background layers - non-interactive */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="absolute inset-0 pointer-events-none animate-gradient-xy bg-gradient-to-tl from-primary-500/30 via-secondary-500/20 to-accent-500/30" />
        </div>
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px),
              linear-gradient(rgba(168,85,247,0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(168,85,247,0.2) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
            animation: 'float 20s ease-in-out infinite',
          }}
        />
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 80 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full pointer-events-none bg-gradient-to-r from-primary-400 to-secondary-400"
              style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%` }}
              animate={{
                x: [0, Math.random()*30-15, 0],
                y: [0, -50, 0],
                opacity: [0.2,1,0.2],
                scale: [1,1.5,1],
                rotateZ: [0,360],
              }}
              transition={{ duration: 5+Math.random()*5, repeat: Infinity, ease: 'easeInOut', delay: Math.random()*5 }}
            />
          ))}
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[Atom, Cpu, Globe, Star].map((Icon, i) => (
            <motion.div
              key={i}
              className="absolute pointer-events-none text-white/10"
              style={{ left: `${20+i*20}%`, top: `${10+i*15}%`, fontSize: '6rem' }}
              animate={{ rotateY:[0,360], rotateX:[0,180,0], scale:[1,1.2,1] }}
              transition={{ duration:15+i*5, repeat: Infinity, ease:'linear' }}
            >
              <Icon size={96} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main content - interactive */}
      <div className="relative z-20 flex items-center justify-center min-h-screen p-4 pointer-events-auto">
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity:0, y:100, rotateX:45, scale:0.8 }}
          animate={{ opacity:1, y:0, rotateX:0, scale:1 }}
          transition={{ duration:1.2, type:'spring', stiffness:100, damping:20 }}
          style={{ perspective:'2000px', transformStyle:'preserve-3d' }}
        >
          {/* Card */}
          <motion.div
            className="relative p-10 border shadow-2xl bg-white/10 backdrop-blur-2xl border-white/20 rounded-3xl"
            whileHover={{ scale:1.02, rotateY:5, rotateX:2, boxShadow:'0 50px 100px rgba(0,0,0,0.3)' }}
            transition={{ type:'spring', stiffness:300, damping:30 }}
          >
            <div className="absolute pointer-events-none -inset-1 rounded-3xl opacity-30 blur-xl bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 animate-pulse" />

            {/* Logo & Title */}
            <div className="mb-8 text-center">
              <Link to="/" className="inline-block mb-4 pointer-events-auto">
                <div className="inline-flex items-center space-x-3">
                  <div className="p-3 shadow-lg rounded-2xl bg-gradient-to-r from-primary-500 to-pink-500">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-pink-500 to-accent-400">MedicoX</span>
                </div>
              </Link>
              <motion.h1
                className="mb-2 text-5xl font-bold text-white"
                initial={{ opacity:0, scale:0.5, rotateX:-90 }}
                animate={{ opacity:1, scale:1, rotateX:0 }}
                transition={{ delay:0.3, type:'spring', stiffness:200 }}
                style={{ textShadow:'0 0 30px rgba(255,255,255,0.5)', background:'linear-gradient(135deg,#fff 0%,#e0e7ff 50%,#c7d2fe 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}
              >
                Welcome Back
              </motion.h1>
              <motion.p className="text-lg text-white/80" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}>
                Sign in to continue your healthcare journey
              </motion.p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="p-4 mb-6 text-red-300 border bg-red-500/20 border-red-500/30 rounded-2xl backdrop-blur-md"
                  initial={{ opacity:0, y:-20 }}
                  animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-20 }}
                  style={{ boxShadow:'0 0 30px rgba(239,68,68,0.3)' }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-6 pointer-events-auto">
              <Input
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                icon={<Mail className="text-primary-400" size={20} />}
                value={email}
                onChange={e => setEmail(e.target.value)}
                fullWidth
              />
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="••••••••"
                  icon={<Lock className="text-primary-400" size={20} />}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  fullWidth
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute p-2 text-black -translate-y-1/2 top-1/2 right-4 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20}/> : <Eye size={20} />}
                </button>
              </div>
              <div className="flex items-center justify-between">
              
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setStage('email'); setError(''); }}
                  className="underline text-primary-400 hover:text-primary-300"
                >
                  Forgot password?
                </button>
              </div>
              <Button fullWidth isLoading={isLoading} type="submit">
                <div className="flex items-center justify-center space-x-2">
                  <Shield size={20} />
                  <span >{isLoading ? 'Signing In…' : 'Sign In'}</span>
                  <ArrowRight size={20} />
                </div>
              </Button>
            </form>

            {/* OR divider & Google */}
           <div className="mt-8 pointer-events-auto">
  <div className="relative px-4 sm:px-0">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-white/30" />
    </div>
    <div className="relative flex justify-center">
      <span className="px-3 text-xs border rounded-full sm:px-4 sm:text-sm bg-slate-900/70 text-white/80 border-white/20 backdrop-blur-sm">
        OR
      </span>
    </div>
  </div>

  <div
    ref={googleBtnRef}
    className="flex justify-center w-full px-4 mt-4 sm:w-auto sm:px-0"
  />

  {googleLoading && (
    <div className="flex items-center justify-center px-4 mt-4 space-x-2 text-sm text-white/70 sm:text-base sm:px-0">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Zap size={20} />
      </motion.div>
      <span>Processing Google login…</span>
    </div>
  )}
</div>


            {/* Footer */}
            <div className="mt-8 text-center pointer-events-auto text-white/70">
              Don’t have an account?{' '}
              <Link to="/signup" className="underline text-primary-400 hover:text-primary-300">
                Sign up for the future
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
          >
            <motion.div
              className="relative w-full max-w-md p-8 border shadow-2xl pointer-events-auto bg-white/10 backdrop-blur-2xl border-white/20 rounded-3xl"
              initial={{ scale:0.5, opacity:0, rotateY:-180 }}
              animate={{ scale:1, opacity:1, rotateY:0 }}
              exit={{ scale:0.5, opacity:0, rotateY:180 }}
              transition={{ type:'spring', stiffness:200, damping:25 }}
            >
              <div className="absolute pointer-events-none -inset-1 rounded-3xl opacity-30 blur-xl bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 animate-pulse" />
              <div className="mb-6 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl animate-spin-slow">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">Reset Password</h3>
                <p className="text-white/70">
                  {stage==='email' && 'Enter your email for a reset code'}
                  {stage==='otp' && 'Enter the verification code from your email'}
                  {stage==='reset' && 'Create your new password'}
                </p>
              </div>
              
              <AnimatePresence mode="wait">
                {stage==='email' && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <Input
                      type="email"
                      label="Email Address"
                      placeholder="you@example.com"
                      icon={<Mail className="text-primary-400" size={20} />}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      fullWidth
                    />
                    <Button fullWidth isLoading={isLoading} type="submit">
                      <span className="flex items-center space-x-2">
                        <Zap size={20} />
                        <span>Send Reset Code</span>
                      </span>
                    </Button>
                  </form>
                )}
                {stage==='otp' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="flex justify-center space-x-2">{renderOtpInputs()}</div>
                    <Button fullWidth isLoading={isLoading} type="submit">
                      <span className="flex items-center space-x-2">
                        <CheckCircle size={20} />
                        <span>Verify Code</span>
                      </span>
                    </Button>
                  </form>
                )}
                {stage==='reset' && (
                  <form onSubmit={handleReset} className="space-y-4">
                    <div className="relative">
                      <Input
                        type={showNewPass ? 'text' : 'password'}
                        label="New Password"
                        placeholder="••••••••"
                        icon={<Lock className="text-primary-400" size={20} />}
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                        fullWidth
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(v => !v)}
                        className="absolute p-2 -translate-y-1/2 top-1/2 right-4 text-white/60"
                      >
                        {showNewPass ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        type={showConfirmPass ? 'text' : 'password'}
                        label="Confirm Password"
                        placeholder="••••••••"
                        icon={<Lock className="text-primary-400" size={20} />}
                        value={confirmPass}
                        onChange={e => setConfirmPass(e.target.value)}
                        fullWidth
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(v => !v)}
                        className="absolute p-2 -translate-y-1/2 top-1/2 right-4 text-white/60"
                      >
                        {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <Button fullWidth isLoading={isLoading} type="submit">
                      <span className="flex items-center space-x-2">
                        <Shield size={20} />
                        <span>Update Password</span>
                      </span>
                    </Button>
                  </form>
                )}
              </AnimatePresence>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => { setShowForgot(false); setError(''); }}
                  className="text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                {stage!=='email' && (
                  <button
                    onClick={() => {
                      setStage(stage==='reset'?'otp':'email');
                      setError('');
                      if (stage==='otp') setOtp(Array(OTP_LENGTH).fill(''));
                    }}
                    className="text-primary-400 hover:text-primary-300"
                  >
                    ← Back
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
