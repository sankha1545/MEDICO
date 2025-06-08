// File: frontend/src/contexts/AuthContext.tsx

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
  dob: string; // ISO date string, e.g. "2025-06-07"
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
}

const AuthContext = createContext<AuthContextValue>(null!);

export const useAuth = (): AuthContextValue => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Make sure VITE_API_URL includes the “/api” suffix, e.g. “http://localhost:4000/api”
  const baseURL = import.meta.env.VITE_API_URL as string;
  const navigate = useNavigate();

  const api: AxiosInstance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });
  
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // ─── Helper: fetch /me to populate user from stored token
  const fetchUser = async (token: string) => {
    try {
      const res = await api.get('/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetched: User = {
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
        provider: res.data.provider,
        isVerified: res.data.isVerified,
        phone: res.data.phone || '',
        dob: res.data.dob ? new Date(res.data.dob).toISOString().split('T')[0] : '',
        profileImageUrl: '', // (we aren’t storing profile images in this demo)
      };
      setUser(fetched);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('❌ fetchUser error:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // ─── On mount, check localStorage for a token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  // ─── Send OTP  
  const sendEmailOtp = async (email: string): Promise<void> => {
    try {
      await api.post('/send-email-otp', { email });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to send OTP.');
    }
  };

  // ─── Verify OTP  
  const verifyEmailOtp = async (email: string, otp: string): Promise<void> => {
    try {
      await api.post('/verify-email-otp', { email, otp });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to verify OTP.');
    }
  };

  // ─── Sign up  
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

  // ─── Login (email/password)  
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const res = await api.post('/login', { email, password });
      const { token, user: loggedInUser } = res.data;
      localStorage.setItem('authToken', token);

      const u: User = {
        id: loggedInUser.id,
        name: loggedInUser.name,
        email: loggedInUser.email,
        role: loggedInUser.role,
        provider: loggedInUser.provider,
        isVerified: loggedInUser.isVerified,
        phone: loggedInUser.phone || '',
        dob: loggedInUser.dob
          ? new Date(loggedInUser.dob).toISOString().split('T')[0]
          : '',
        profileImageUrl: '', // (no profile images)
      };
      setUser(u);
      setIsAuthenticated(true);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Login failed.');
    }
  };

  // ─── Google OAuth redirect  
  const signInWithGoogle = () => {
    window.location.href = `${baseURL}/auth/google`;
  };

  // ─── Called by OAuthSuccessPage to ingest the token  
  const loginWithToken = async (token: string) => {
    localStorage.setItem('authToken', token);
    await fetchUser(token);
  };

  // ─── Logout  
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  // ─── Update Profile (name, email, phone, dob)  
  const updateProfile = async (data: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
  }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated.');
      const res = await api.put(
        '/me',
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser: User = {
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
        provider: res.data.provider,
        isVerified: res.data.isVerified,
        phone: res.data.phone || '',
        dob: res.data.dob ? new Date(res.data.dob).toISOString().split('T')[0] : '',
        profileImageUrl: user?.profileImageUrl || '',
      };
      setUser(updatedUser);
    } catch (err: any) {
      console.error('❌ updateProfile error:', err);
      throw new Error(err.response?.data?.message || 'Failed to update profile');
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
