import React, {
  createContext,
  useContext,
  useState,
  ReactNode
} from 'react';

interface SignupData {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor';
  otp: string;
}

interface AuthContextType {
  sendEmailOtp: (email: string) => Promise<void>;
  completeSignup: (data: SignupData) => Promise<void>;
  userEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 1) Trigger backend to send OTP to email
  const sendEmailOtp = async (email: string) => {
    const resp = await fetch('http://localhost:5000/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!resp.ok) {
      const { message } = await resp.json();
      throw new Error(message || 'Failed to send OTP');
    }
    setUserEmail(email);
  };

  // 2) Complete signup by submitting all data + OTP
  const completeSignup = async ({
    name,
    email,
    password,
    role,
    otp,
  }: SignupData) => {
    const resp = await fetch('http://localhost:5000/auth/complete-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, otp }),
    });
    if (!resp.ok) {
      const { message } = await resp.json();
      throw new Error(message || 'Signup verification failed');
    }
    // optionally read token or user from resp.json()
    setUserEmail(email);
  };

  return (
    <AuthContext.Provider
      value={{ sendEmailOtp, completeSignup, userEmail }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
