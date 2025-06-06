// File: frontend/src/pages/LoginPage.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User as UserIcon, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { FadeIn, SlideIn } from '../components/animations/Transitions';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, loginWithToken, signInWithGoogle, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auto-login if redirected from Google OAuth
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      (async () => {
        try {
          await loginWithToken(token);
        } catch {
          setError('Google login failed');
        }
      })();
    }
  }, [searchParams, loginWithToken]);

  // After user is authenticated, redirect based on role
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'doctor') {
        navigate('/doc-dashboard');
      } else {
        navigate('/home');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Redirect will happen automatically from useEffect
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gray-100">
      {/* Left: Form */}
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

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-100 text-red-700 p-3 rounded-md mb-4"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                id="email"
                label="Email Address"
                placeholder="you@example.com"
                icon={<UserIcon size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />

              <Input
                type="password"
                id="password"
                label="Password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link to="/forgot-password" className="text-sm text-primary-500 hover:text-primary-600">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" variant="primary" isLoading={isLoading} fullWidth>
                Sign In
              </Button>
            </form>

            <div className="mt-4">
              <Button variant="outline" onClick={signInWithGoogle} fullWidth>
                Continue with Google
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don’t have an account?{' '}
                <Link to="/signup" className="text-primary-500 hover:text-primary-600 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Right: Image */}
      <SlideIn direction="right">
        <div className="hidden md:block relative">
          <img
            src="https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Medical professionals"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center max-w-sm p-8">
              <h2 className="text-2xl font-bold mb-4">Your health is our priority</h2>
              <p>
                Book appointments with top doctors, get digital prescriptions, and manage your health
                record—all in one place.
              </p>
            </div>
          </div>
        </div>
      </SlideIn>
    </div>
  );
};

export default LoginPage;
