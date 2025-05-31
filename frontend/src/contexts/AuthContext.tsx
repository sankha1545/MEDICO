// File: frontend/src/contexts/AuthContext.tsx

import React, { createContext, useContext, ReactNode } from 'react';
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
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>(null!);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  //
  // —— Make sure this exactly matches the variable in frontend/.env —— 
  //
  const baseURL = import.meta.env.VITE_API_URL as string;

  const api: AxiosInstance = axios.create({
    baseURL,                     // ← this must be e.g. "http://localhost:4000/api"
    headers: { 'Content-Type': 'application/json' },
  });

  const sendEmailOtp = async (email: string): Promise<void> => {
    try {
      await api.post('/send-email-otp', { email });
    } catch (err) {
      throw err;
    }
  };

  const verifyEmailOtp = async (email: string, otp: string): Promise<void> => {
    try {
      await api.post('/verify-email-otp', { email, otp });
    } catch (err) {
      throw err;
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
    } catch (err) {
      throw err;
    }
  };

  const isAuthenticated = false;

  return (
    <AuthContext.Provider value={{ sendEmailOtp, verifyEmailOtp, signup, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => useContext(AuthContext);
