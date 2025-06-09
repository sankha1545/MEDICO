// File: frontend/src/contexts/AuthContext.tsx
// Manages authentication state and actions: login, signup, email OTP, Google OAuth,
// profile updates (including specialty & profile image), and password reset flows.

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
  dob: string; // ISO date string (YYYY-MM-DD)
  profileImageUrl?: string;
  specialty?: string;
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
  updateUserProfile: (data: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
    specialty?: string;
    profileImageFile?: File | null;
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

  // Axios instance for all API calls
  const api: AxiosInstance = axios.create({
    baseURL,
  });

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch current user if token is present
  const fetchUser = async (token: string) => {
    try {
      const res = await api.get('/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
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
        specialty: res.data.specialty || '',
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
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Send email OTP for signup/verification
  const sendEmailOtp = async (email: string) => {
    try {
      await api.post('/send-email-otp', { email });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to send OTP.');
    }
  };

  // Verify email OTP
  const verifyEmailOtp = async (email: string, otp: string) => {
    try {
      await api.post('/verify-email-otp', { email, otp });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to verify OTP.');
    }
  };

  // Sign up new user (patient or doctor)
  const signup = async (data: {
    name: string;
    email: string;
    password: string;
    role: 'patient' | 'doctor';
  }) => {
    try {
      await api.post('/signup', data);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Signup failed.');
    }
  };

  // Log in with email/password
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
        specialty: res.data.user.specialty || '',
      };
      setUser(u);
      setIsAuthenticated(true);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Login failed.');
    }
  };

  // Google OAuth redirection
  const signInWithGoogle = () => {
    window.location.href = `${baseURL}/auth/google`;
  };

  // Login with token from Google OAuth flow
  const loginWithToken = async (token: string) => {
    localStorage.setItem('authToken', token);
    await fetchUser(token);
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  // Update user profile (name, email, phone, dob, specialty, profileImageFile)
  const updateUserProfile = async (data: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
    specialty?: string;
    profileImageFile?: File | null;
  }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated.');
      const formData = new FormData();

      if (data.name) formData.append('name', data.name);
      if (data.email) formData.append('email', data.email);
      if (data.phone) formData.append('phone', data.phone);
      if (data.dob) formData.append('dob', data.dob);
      if (data.specialty) formData.append('specialty', data.specialty);
      if (data.profileImageFile) {
        formData.append('profileImage', data.profileImageFile);
      }

      const res = await api.put('/me', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update local user state with returned data
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
        specialty: res.data.specialty || '',
      };
      setUser(u);
    } catch (err: any) {
      console.error('updateUserProfile error:', err);
      throw new Error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  // Send password‐reset OTP
  const sendPasswordResetOtp = async (email: string) => {
    try {
      await api.post('/send-reset-otp', { email });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to send reset OTP');
    }
  };

  // Verify password‐reset OTP
  const verifyPasswordResetOtp = async (email: string, otp: string) => {
    try {
      await api.post('/verify-reset-otp', { email, otp });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to verify reset OTP');
    }
  };

  // Reset password after OTP verification
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
        updateUserProfile,
        sendPasswordResetOtp,
        verifyPasswordResetOtp,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/*
  Analysis:
  - updateUserProfile now sends a FormData payload with fields name/email/phone/dob/specialty/profileImage.
  - After PUT /me, we update `user.profileImageUrl` (which the backend returns as a base64 data URI).
  - The dashboard uses that `profileImageUrl` to render the new photo immediately.
*/
