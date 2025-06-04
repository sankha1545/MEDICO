// File: src/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import axios, { AxiosInstance } from 'axios';
import { useNavigate } from 'react-router-dom';

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
  signInWithGoogle: () => Promise<void>;

  // for OAuth redirect pages to call
  loginWithToken: (token: string) => void;

  // ← NEW: logout function
  logout: () => void;

  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>(null!);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const baseURL = import.meta.env.VITE_API_URL as string;

  const api: AxiosInstance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });

  // state flag for authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // this hook is needed so that logout can redirect
  const navigate = useNavigate();

  // On mount, check if a token is already in localStorage
  useEffect(() => {
    const existing = localStorage.getItem('authToken');
    if (existing) {
      setIsAuthenticated(true);
    }
  }, []);

  const sendEmailOtp = async (email: string): Promise<void> => {
    try {
      await api.post('/send-email-otp', { email });
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Failed to send OTP. Please try again.';
      throw new Error(msg);
    }
  };

  const verifyEmailOtp = async (email: string, otp: string): Promise<void> => {
    try {
      await api.post('/verify-email-otp', { email, otp });
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Failed to verify OTP. Please try again.';
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
      const msg =
        err.response?.data?.message || 'Signup failed. Please try again.';
      throw new Error(msg);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const res = await api.post('/login', { email, password });
      const { token } = res.data;
      localStorage.setItem('authToken', token);
      setIsAuthenticated(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Login failed. Please try again.';
      throw new Error(msg);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    // Redirect browser to your backend’s Google OAuth endpoint
    window.location.href = `${baseURL}/auth/google`;
  };

  // Used by OAuthSuccessPage (or elsewhere) to ingest a token,
  // update localStorage, and mark user as authenticated immediately.
  const loginWithToken = (token: string) => {
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);
  };

  // ← NEW: Clear token, update state, and redirect to /login
  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        sendEmailOtp,
        verifyEmailOtp,
        signup,
        login,
        signInWithGoogle,
        loginWithToken,
        logout,              // ← expose logout here
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  return useContext(AuthContext);
};
