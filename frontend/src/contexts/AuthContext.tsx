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

interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor';
  provider?: string;
  isVerified?: boolean;
}

interface AuthContextValue {
  user: User | null;
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
  loginWithToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>(null!);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const baseURL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const api: AxiosInstance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const fetchUser = async (token: string) => {
    try {
      const res = await api.get('/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('❌ Failed to fetch user:', err);
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

  const signup = async ({
    name,
    email,
    password,
    role,
  }: {
    name: string;
    email: string;
    password: string;
    role: 'patient' | 'doctor';
  }) => {
    try {
      await api.post('/signup', { name, email, password, role });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Signup failed.';
      throw new Error(msg);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const res = await api.post('/login', { email, password });
      const { token } = res.data;
      localStorage.setItem('authToken', token);
      await fetchUser(token);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed.';
      throw new Error(msg);
    }
  };

  const signInWithGoogle = () => {
    window.location.href = `${baseURL}/auth/google`;
  };

  const loginWithToken = (token: string) => {
    localStorage.setItem('authToken', token);
    fetchUser(token);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        sendEmailOtp,
        verifyEmailOtp,
        signup,
        login,
        signInWithGoogle,
        loginWithToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
