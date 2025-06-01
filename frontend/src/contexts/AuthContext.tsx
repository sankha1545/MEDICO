
// File: frontend/src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';
import axios, { AxiosInstance } from 'axios';

interface AuthContextValue {
  sendEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, otp: string) => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    role: 'patient' | 'doctor';
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>(null!);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const baseURL = import.meta.env.VITE_API_URL as string;

  const api: AxiosInstance = axios.create({
    baseURL,                     // e.g. "http://localhost:4000/api"
    headers: { 'Content-Type': 'application/json' },
  });

  // You can store a token or auth state if needed. For now, we keep it simple:
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const sendEmailOtp = async (email: string): Promise<void> => {
    try {
      await api.post('/send-email-otp', { email });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
      throw new Error(msg);
    }
  };

  const verifyEmailOtp = async (email: string, otp: string): Promise<void> => {
    try {
      await api.post('/verify-email-otp', { email, otp });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to verify OTP. Please try again.';
      throw new Error(msg);
    }
  };

  const signup = async (data: {
    name: string;
    email: string;
    password: string;
    role: 'patient' | 'doctor';
  }): Promise<void> => {
    try {
      await api.post('/signup', data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      throw new Error(msg);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      await api.post('/login', { email, password });
      // If you want to set a token in localStorage/cookies, do it here.
      // For example:
      // const token = response.data.token;
      // localStorage.setItem('authToken', token);
      // setIsAuthenticated(true);
      setIsAuthenticated(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider
      value={{ sendEmailOtp, verifyEmailOtp, signup, login, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => useContext(AuthContext);
