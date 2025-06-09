// frontend/src/contexts/AuthContext.tsx
// Manages authentication state and actions: login, signup, email OTP, Google OAuth,
// profile updates, and password reset flows.

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios, { AxiosInstance } from 'axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor';
  provider?: string;
  isVerified?: boolean;
  phone: string;
  dob: string; // ISO date string
  profileImageUrl?: string;
}

interface AuthContextValue {
  user: User | null;
  setUser: (u: User | null) => void;
  isAuthenticated: boolean;
  loading: boolean;
  sendEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, otp: string) => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    role: 'patient' | 'doctor';
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => void;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
  }) => Promise<void>;
  sendPasswordResetOtp: (email: string) => Promise<void>;
  verifyPasswordResetOtp: (email: string, otp: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>(null!);

export const useAuth = (): AuthContextValue => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const baseURL = import.meta.env.VITE_API_URL as string;
  const navigate = useNavigate();

  const api: AxiosInstance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch current user if token present
  const fetchUser = async (token: string) => {
    try {
      const res = await api.get('/me', { headers: { Authorization: `Bearer ${token}` } });
      const u: User = {
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
        provider: res.data.provider,
        isVerified: res.data.isVerified,
        phone: res.data.phone || '',
        dob: res.data.dob ? new Date(res.data.dob).toISOString().split('T')[0] : '',
        profileImageUrl: res.data.profileImageUrl || '',
      };
      setUser(u);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('fetchUser error:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) fetchUser(token);
    else setLoading(false);
  }, []);

  // Email OTP flows
  const sendEmailOtp = async (email: string) => {
    try {
      await api.post('/send-email-otp', { email });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to send OTP.');
    }
  };

  const verifyEmailOtp = async (email: string, otp: string) => {
    try {
      await api.post('/verify-email-otp', { email, otp });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to verify OTP.');
    }
  };

  // Authentication
  const signup = async (data: { name: string; email: string; password: string; role: 'patient' | 'doctor'; }) => {
    try {
      await api.post('/signup', data);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Signup failed.');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/login', { email, password });
      const token: string = res.data.token;
      localStorage.setItem('authToken', token);
      const u: User = {
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
        provider: res.data.user.provider,
        isVerified: res.data.user.isVerified,
        phone: res.data.user.phone || '',
        dob: res.data.user.dob ? new Date(res.data.user.dob).toISOString().split('T')[0] : '',
        profileImageUrl: res.data.user.profileImageUrl || '',
      };
      setUser(u);
      setIsAuthenticated(true);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Login failed.');
    }
  };

  const signInWithGoogle = () => {
    window.location.href = `${baseURL}/auth/google`;
  };

  const loginWithToken = async (token: string) => {
    localStorage.setItem('authToken', token);
    await fetchUser(token);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  // Profile update
  const updateProfile = async (data: { name?: string; email?: string; phone?: string; dob?: string; }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated.');
      const res = await api.put('/me', data, { headers: { Authorization: `Bearer ${token}` } });
      const u: User = {
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
        provider: res.data.provider,
        isVerified: res.data.isVerified,
        phone: res.data.phone || '',
        dob: res.data.dob ? new Date(res.data.dob).toISOString().split('T')[0] : '',
        profileImageUrl: res.data.profileImageUrl || '',
      };
      setUser(u);
    } catch (err: any) {
      console.error('updateProfile error:', err);
      throw new Error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  // Password-reset flows
  const sendPasswordResetOtp = async (email: string) => {
    try {
      await api.post('/send-reset-otp', { email });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to send reset OTP');
    }
  };

  const verifyPasswordResetOtp = async (email: string, otp: string) => {
    try {
      await api.post('/verify-reset-otp', { email, otp });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to verify reset OTP');
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    try {
      await api.post('/reset-password', { email, otp, newPassword });
      navigate('/login');
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Password reset failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        loading,
        sendEmailOtp,
        verifyEmailOtp,
        signup,
        login,
        signInWithGoogle,
        loginWithToken,
        logout,
        updateProfile,
        sendPasswordResetOtp,
        verifyPasswordResetOtp,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};