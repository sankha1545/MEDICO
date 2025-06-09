// LoginPage.tsx
// React component: Sign In with embedded Forgot Password flow via modal overlays, preserving original UI.

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { FadeIn, SlideIn } from '../components/animations/Transitions';

const OTP_LENGTH = 6;

const LoginPage: React.FC = () => {
  const { login, loginWithToken, user, isAuthenticated,
          sendPasswordResetOtp, verifyPasswordResetOtp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [stage, setStage] = useState<'email'|'otp'|'reset'>('email');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // OAuth token on mount
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) loginWithToken(token).catch(() => setError('Google login failed'));
  }, [searchParams, loginWithToken]);

  // Redirect after login
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role==='doctor'?'/doc-dashboard':'/home');
    }
  }, [isAuthenticated,user,navigate]);

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try { await login(email,password); }
    catch(err:any){ setError(err.message); }
    finally{ setIsLoading(false); }
  };

  // Forgot: send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try {
      await sendPasswordResetOtp(email);
      setStage('otp');
    } catch(err:any){ setError(err.message); }
    finally{ setIsLoading(false); }
  };

  // Forgot: verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    const code=otp.join('');
    if(code.length!==OTP_LENGTH){ setError('Enter full code'); setIsLoading(false); return; }
    try{
      await verifyPasswordResetOtp(email,code);
      setStage('reset');
    }catch(err:any){ setError(err.message); }
    finally{ setIsLoading(false); }
  };

  // Forgot: reset password
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if(newPass!==confirmPass){ setError('Passwords must match'); return; }
    setIsLoading(true);
    try{
      await resetPassword(email, otp.join(''), newPass);
      setShowForgot(false); setStage('email'); setError('Password updated. Please login.');
    }catch(err:any){ setError(err.message); }
    finally{ setIsLoading(false); }
  };

  // OTP input
  const handleOtpChange=(i:number,v:string)=>{
    if(!/^[0-9]?$/.test(v))return;
    const arr=[...otp]; arr[i]=v; setOtp(arr);
    if(v&&i<OTP_LENGTH-1) inputRefs.current[i+1]?.focus();
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gray-100">
      {/* Left UI unchanged */}
      <FadeIn>
        <div className="flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center mb-5 text-2xl font-bold">
                <span className="text-primary-500">MedBook</span>
              </Link>
              <h1 className="text-3xl font-bold text-gray-800">Welcome back</h1>
              <p className="text-gray-600 mt-2">Sign in to your account to continue</p>
            </div>
            {error&&<motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</motion.div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="email" id="email" label="Email Address" placeholder="you@example.com" icon={<UserIcon size={16}/>} value={email} onChange={e=>setEmail(e.target.value)} required fullWidth />
              <Input type="password" id="password" label="Password" placeholder="••••••••" icon={<Lock size={16}/>} value={password} onChange={e=>setPassword(e.target.value)} required fullWidth />
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded" />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">Remember me</label>
                </div>
                <button type="button" className="text-sm text-primary-500 hover:text-primary-600" onClick={()=>{setShowForgot(true);setStage('email');setError('');}}>Forgot password?</button>
              </div>
              <Button type="submit" variant="primary" isLoading={isLoading} fullWidth>Sign In</Button>
            </form>
            <div className="mt-4">
              <Button variant="outline" fullWidth onClick={()=>window.location.href=`${import.meta.env.VITE_API_URL}/auth/google`}>Continue with Google</Button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">Don’t have an account? <Link to="/signup" className="text-primary-500 hover:text-primary-600 font-medium">Sign up</Link></p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Right UI unchanged */}
      <SlideIn direction="right">
        <div className="hidden md:block relative">
          <img src="https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=1260" alt="Medical professionals" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center max-w-sm p-8">
              <h2 className="text-2xl font-bold mb-4">Your health is our priority</h2>
              <p>Book appointments with top doctors, get digital prescriptions, and manage your health record—all in one place.</p>
            </div>
          </div>
        </div>
      </SlideIn>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <motion.div className="bg-white rounded-xl shadow-xl p-6 w-11/12 max-w-md" initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.8,opacity:0}}>
              <h3 className="text-xl font-semibold mb-4">Forgot Password</h3>
              {stage==='email'&&(
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <Input type="email" label="Email Address" value={email} onChange={e=>setEmail(e.target.value)} required fullWidth icon={<Mail size={16}/>} />
                  <Button type="submit" variant="primary" isLoading={isLoading} fullWidth>Send OTP</Button>
                </form>
              )}
              {stage==='otp'&&(
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="flex justify-between">
                    {otp.map((d,i)=>(
                      <input key={i} type="text" maxLength={1} inputMode="numeric" value={d} onChange={e=>handleOtpChange(i,e.target.value)} ref={el=>el&& (inputRefs.current[i]=el)} className="w-12 h-12 text-center border rounded" autoFocus={i===0}/>
                    ))}
                  </div>
                  <Button type="submit" variant="primary" isLoading={isLoading} fullWidth>Verify OTP</Button>
                </form>
              )}
              {stage==='reset'&&(
                <form onSubmit={handleReset} className="space-y-4">
                  <Input type="password" label="New Password" value={newPass} onChange={e=>setNewPass(e.target.value)} required fullWidth icon={<Lock size={16}/>} />
                  <Input type="password" label="Confirm Password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} required fullWidth icon={<Lock size={16}/>} />
                  <Button type="submit" variant="primary" isLoading={isLoading} fullWidth>Reset Password</Button>
                </form>
              )}
              <div className="mt-4 text-center">
                <button className="text-sm text-gray-600 mr-4" onClick={()=>{setShowForgot(false); setError('');}}>Cancel</button>
                {stage!=='email'&&<button className="text-sm text-primary-500" onClick={()=>{setStage('email');setError('');}}>Back</button>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
