// File: frontend/src/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import axios, { AxiosInstance } from 'axios';
import { useNavigate } from 'react-router-dom';

export interface LocationType {
  lat: number;
  lng: number;
  address: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor';
  provider?: string;
  isVerified?: boolean;
  phone: string;
  dob: string; // "YYYY-MM-DD"
  profileImageUrl?: string;
  specialty?: string;
  availabilitySlots?: string[];
  location?: LocationType;
  maxPatients?: number;
  experience?: string;
  hospitalAffiliation?: string;
  bio?: string;
  qualifications?: string[];
  languages?: string[];
  consultationFee?: number;
}

interface AuthContextValue {
  user: User | null;
  setUser: (u: User | null) => void;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  signupError: string | null;

  sendEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, otp: string) => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    role: 'patient' | 'doctor';
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;

  signUpWithGoogle: (idToken: string) => Promise<string>;
  completeGoogleSignup: (
    tempToken: string,
    role: 'patient' | 'doctor'
  ) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;

  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;

  updateUserProfile: (data: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
    profileImageFile?: File | null;
  }) => Promise<void>;
  updateDoctorProfile: (data: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
    specialty?: string;
    profileImageFile?: File | null;
    availabilitySlots?: string[];
    location?: LocationType;
    maxPatients?: number;
    experience?: string;
    hospitalAffiliation?: string;
    bio?: string;
    qualifications?: string[];
    languages?: string[];
    consultationFee?: number;
  }) => Promise<User>;
  fetchDoctorProfile: () => Promise<User>;

  // convenience aliases
  updateProfile: (data: any) => Promise<void>;
  updateMedicalInfo: (data: any) => Promise<User>;

  sendPasswordResetOtp: (email: string) => Promise<void>;
  verifyPasswordResetOtp: (email: string, otp: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export { AuthContext };

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const baseURL = import.meta.env.VITE_API_URL as string;
  const navigate = useNavigate();

  const api: AxiosInstance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  api.interceptors.request.use((config) => {
    const t = localStorage.getItem('authToken');
    if (t && config.headers) {
      config.headers.Authorization = `Bearer ${t}`;
    }
    return config;
  });

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [signupError, setSignupError] = useState<string | null>(null);

  const fetchUserCommon = async () => {
    try {
      const res = await api.get('/auth/me');
      const data = res.data;
      const commonUser: User = {
        id: data._id || data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        provider: data.provider,
        isVerified: data.isVerified,
        phone: data.phone || '',
        dob: data.dob ? data.dob.split('T')[0] : '',
      };
      setUser(commonUser);
      setIsAuthenticated(true);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('authToken');
    if (stored) {
      setToken(stored);
      fetchUserCommon();
    } else {
      setLoading(false);
    }
  }, []);

  const sendEmailOtp = async (email: string) => {
    await api.post('/auth/send-email-otp', { email });
  };

  const verifyEmailOtp = async (email: string, otp: string) => {
    await api.post('/auth/verify-email-otp', { email, otp });
  };

  const signup = async (data: { name: string; email: string; password: string; role: 'patient' | 'doctor' }) => {
    setSignupError(null);
    try {
      await api.post('/auth/signup', data);
      navigate('/login?signup=success');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (err.response?.status === 409 || msg?.includes('exists')) {
        setSignupError(msg || 'An account already exists with this email.');
      } else {
        setSignupError('Signup failed. Please try again.');
      }
      throw new Error(signupError || 'Signup error');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const newToken: string = res.data.token;
      localStorage.setItem('authToken', newToken);
      setToken(newToken);
      await fetchUserCommon();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Login failed.');
    }
  };

  const signUpWithGoogle = async (idToken: string): Promise<string> => {
    const res = await api.post('/auth/google/signup', { token: idToken });
    return res.data.tempToken;
  };

  const completeGoogleSignup = async (tempToken: string, role: 'patient' | 'doctor') => {
    await api.post('/auth/google/complete-signup', { token: tempToken, role });
    navigate('/login?signup=success');
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      const res = await api.post('/auth/google/login', { token: idToken });
      const appJwt: string = res.data.token;
      localStorage.setItem('authToken', appJwt);
      setToken(appJwt);
      setLoading(true);
      await fetchUserCommon();
      navigate(res.data.role === 'doctor' ? '/doc-dashboard' : '/home');
    } catch (err: any) {
      console.error('Google login error', err.response?.data);
      throw new Error(err.response?.data?.message || 'Google login failed.');
    }
  };

  const loginWithToken = async (tkn: string) => {
    localStorage.setItem('authToken', tkn);
    setToken(tkn);
    setLoading(true);
    await fetchUserCommon();
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  // ----- Profile Updates -----
  const updateUserProfile = async (data: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
    profileImageFile?: File | null;
  }): Promise<void> => {
    if (user?.role === 'doctor') {
      const updated = await updateDoctorProfile({ ...data });
      setUser(updated);
      return;
    }
    const form = new FormData();
    if (data.name) form.append('name', data.name);
    if (data.email) form.append('email', data.email);
    if (data.phone) form.append('phone', data.phone);
    if (data.dob) form.append('dob', data.dob);
    if (data.profileImageFile) form.append('profileImage', data.profileImageFile);

    // <-- No manual Content-Type header here!
    const res = await api.put('/auth/me', form);
    const resUser = res.data;
    setUser(prev => prev ? {
      ...prev,
      name: resUser.name,
      email: resUser.email,
      phone: resUser.phone || prev.phone,
      dob: resUser.dob ? resUser.dob.split('T')[0] : prev.dob,
      profileImageUrl: resUser.profileImageUrl || prev.profileImageUrl,
    } : prev);
  };

  const fetchDoctorProfileInternal = async (commonUser: User): Promise<User> => {
    const res = await api.get('/medical/doctor/me');
    const d = res.data;
    let loc: LocationType | undefined;
    if (d.location) {
      if (typeof d.location === 'object' && 'address' in d.location) {
        loc = { lat: d.location.lat || 0, lng: d.location.lng || 0, address: d.location.address };
      } else {
        loc = { lat: 0, lng: 0, address: d.location as string };
      }
    }
    return {
      id: d._id || d.id,
      name: d.name,
      email: d.email,
      role: 'doctor',
      provider: commonUser.provider,
      isVerified: commonUser.isVerified,
      phone: d.phone || '',
      dob: d.dob ? d.dob.split('T')[0] : commonUser.dob,
      profileImageUrl: d.profileImageUrl,
      specialty: d.specialty,
      availabilitySlots: Array.isArray(d.availabilitySlots) ? d.availabilitySlots : [],
      location: loc,
      maxPatients: d.maxPatients,
      experience: d.experience,
      hospitalAffiliation: d.hospitalAffiliation,
      bio: d.bio,
      qualifications: Array.isArray(d.qualifications) ? d.qualifications : [],
      languages: Array.isArray(d.languages) ? d.languages : [],
      consultationFee: typeof d.consultationFee === 'number' ? d.consultationFee : 0,
    };
  };

  const fetchDoctorProfile = async (): Promise<User> => {
    if (!user) throw new Error('Not authenticated');
    const updated = await fetchDoctorProfileInternal(user);
    setUser(updated);
    return updated;
  };

  const updateDoctorProfile = async (data: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
    specialty?: string;
    profileImageFile?: File | null;
    availabilitySlots?: string[];
    location?: LocationType;
    maxPatients?: number;
    experience?: string;
    hospitalAffiliation?: string;
    bio?: string;
    qualifications?: string[];
    languages?: string[];
    consultationFee?: number;
  }): Promise<User> => {
    const form = new FormData();
    if (data.name) form.append('name', data.name);
    if (data.email) form.append('email', data.email);
    if (data.phone) form.append('phone', data.phone);
    if (data.dob) form.append('dob', data.dob);
    if (data.specialty) form.append('specialty', data.specialty);
    if (data.availabilitySlots) form.append('availabilitySlots', JSON.stringify(data.availabilitySlots));
    if (data.location) {
      form.append('locationObj', JSON.stringify(data.location));
      form.append('location', data.location.address);
    }
    if (data.maxPatients !== undefined) form.append('maxPatients', data.maxPatients.toString());
    if (data.experience) form.append('experience', data.experience);
    if (data.hospitalAffiliation) form.append('hospitalAffiliation', data.hospitalAffiliation);
    if (data.bio) form.append('bio', data.bio);
    if (data.qualifications) form.append('qualifications', JSON.stringify(data.qualifications));
    if (data.languages) form.append('languages', JSON.stringify(data.languages));
    if (data.consultationFee !== undefined) form.append('consultationFee', data.consultationFee.toString());
    if (data.profileImageFile) form.append('profileImage', data.profileImageFile);

    // <-- And here, too, no manual header override
    const res = await api.put('/medical/doctor/me', form);
    const d = res.data;
    let loc: LocationType | undefined;
    if (d.location) {
      if (typeof d.location === 'object' && 'address' in d.location) {
        loc = { lat: d.location.lat || 0, lng: d.location.lng || 0, address: d.location.address };
      } else {
        loc = { lat: 0, lng: 0, address: d.location as string };
      }
    }
    const updated: User = {
      id: d._id || d.id,
      name: d.name,
      email: d.email,
      role: 'doctor',
      provider: user?.provider,
      isVerified: user?.isVerified,
      phone: d.phone || '',
      dob: d.dob ? d.dob.split('T')[0] : user?.dob || '',
      profileImageUrl: d.profileImageUrl,
      specialty: d.specialty,
      availabilitySlots: Array.isArray(d.availabilitySlots) ? d.availabilitySlots : [],
      location: loc,
      maxPatients: d.maxPatients,
      experience: d.experience,
      hospitalAffiliation: d.hospitalAffiliation,
      bio: d.bio,
      qualifications: Array.isArray(d.qualifications) ? d.qualifications : [],
      languages: Array.isArray(d.languages) ? d.languages : [],
      consultationFee: typeof d.consultationFee === 'number' ? d.consultationFee : 0,
    };
    setUser(updated);
    return updated;
  };

  // aliases to avoid calling errors
  const updateProfile = updateUserProfile;
  const updateMedicalInfo = updateDoctorProfile;

  const sendPasswordResetOtp = async (email: string) => {
    await api.post('/auth/send-reset-otp', { email });
  };

  const verifyPasswordResetOtp = async (email: string, otp: string) => {
    await api.post('/auth/verify-reset-otp', { email, otp });
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    await api.post('/auth/reset-password', { email, otp, newPassword });
    navigate('/login');
  };

  const deleteAccount = async (password: string) => {
    await api.delete('/auth/user', { data: { password } });
    logout();
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      token,
      isAuthenticated,
      loading,
      signupError,
      sendEmailOtp,
      verifyEmailOtp,
      signup,
      login,
      signUpWithGoogle,
      completeGoogleSignup,
      loginWithGoogle,
      loginWithToken,
      logout,
      updateUserProfile,
      updateDoctorProfile,
      fetchDoctorProfile,
      updateProfile,
      updateMedicalInfo,
      sendPasswordResetOtp,
      verifyPasswordResetOtp,
      resetPassword,
      deleteAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
