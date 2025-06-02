import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronsRight, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { SlideIn, FadeIn } from '../components/animations/Transitions';

type Role = 'patient' | 'doctor';

const SignUpPage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [role, setRole] = useState<Role>('patient');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const { sendEmailOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      // Send OTP to email
      await sendEmailOtp(email);

      // Navigate to OTP verification, passing form data
      navigate('/verify-email-otp', {
        state: { name, email, password, role },
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const googleAuthUrl = `${import.meta.env.VITE_API_URL}/auth/google`;
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: Image & Info */}
      <SlideIn direction="left">
        <div className="hidden md:block relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tl from-secondary-500 to-primary-500 opacity-90"></div>
          <img
            src="https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Doctor with patient"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 flex flex-col justify-center p-12">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl text-white max-w-md">
              <h2 className="text-2xl font-bold mb-4">Join our healthcare community</h2>
              <p className="mb-6">
                Create an account to book appointments, access virtual consultations, and manage your health journey seamlessly.
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
                ].map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center space-x-2"
                    variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                  >
                    <ChevronsRight size={18} />
                    <span>{benefit}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </SlideIn>

      {/* Right: Form */}
      <FadeIn>
        <div className="flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center mb-5">
                <div className="text-primary-500 mr-2">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                  MedBook
                </span>
              </Link>
              <h1 className="text-3xl font-bold text-gray-800">Create an account</h1>
              <p className="text-gray-600 mt-2">Sign up to get started with MedBook</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-error-50 text-error-700 p-3 rounded-md mb-4"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                id="name"
                label="Full Name"
                placeholder="John Doe"
                icon={<User size={16} />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
              />

              <Input
                type="email"
                id="email"
                label="Email Address"
                placeholder="you@example.com"
                icon={<Mail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                  onChange={(e) => setPassword(e. target.value)}
                  required
                  fullWidth
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 top-6 flex items-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                  required
                  fullWidth
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 top-6 flex items-center"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">I am a:</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['patient', 'doctor'] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      disabled={isLoading}
                      className={
                        `py-2 rounded-md transition-colors border ` +
                        (role === r
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'border-gray-300 hover:bg-gray-50')
                      }
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary-500 hover:text-primary-600">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary-500 hover:text-primary-600">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button type="submit" variant="primary" isLoading={isLoading} fullWidth className="mt-6">
                Create Account
              </Button>

              <div className="mt-4">
                <Button type="button" variant="outline" onClick={handleGoogleSignup} fullWidth>
                  Sign Up with Google
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default SignUpPage;
