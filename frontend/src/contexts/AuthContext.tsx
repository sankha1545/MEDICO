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
  // doctor-specific:
  profileImageUrl?: string;
  specialty?: string;
  availabilitySlots?: string[]; // ISO datetime strings
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
    profileImageFile?: File | null;
  }) => Promise<void>;

  fetchDoctorProfile: () => Promise<User>;
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

  // Create axios instance
  const api: AxiosInstance = axios.create({ baseURL });
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch common user info, then doctor-specific if needed
  const fetchUserCommon = async () => {
    try {
      const res = await api.get('/me');
      const data = res.data;
      const commonUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        provider: data.provider,
        isVerified: data.isVerified,
        phone: data.phone || '',
        dob: data.dob || '',
      };
      setUser(commonUser);
      setIsAuthenticated(true);

      if (commonUser.role === 'doctor') {
        try {
          const docFull = await fetchDoctorProfileInternal(commonUser);
          setUser(docFull);
        } catch (e) {
          console.error('Error fetching doctor-specific profile:', e);
        }
      }
    } catch (err) {
      console.error('fetchUserCommon error:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserCommon();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth methods
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
      setLoading(true);
      await fetchUserCommon();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Login failed.');
    }
  };
  const signInWithGoogle = () => {
    window.location.href = `${baseURL}/auth/google`;
  };
  const loginWithToken = async (token: string) => {
    localStorage.setItem('authToken', token);
    setLoading(true);
    await fetchUserCommon();
  };
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  // Update common user profile (for patients); for doctor, delegate
  const updateUserProfile = async (data: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
    profileImageFile?: File | null;
  }) => {
    if (user?.role === 'doctor') {
      try {
        const updatedDoc = await updateDoctorProfile({
          name: data.name,
          email: data.email,
          phone: data.phone,
          dob: data.dob,
          profileImageFile: data.profileImageFile,
        });
        setUser(updatedDoc);
      } catch (err: any) {
        throw err;
      }
    } else {
      try {
        const formData = new FormData();
        if (data.name) formData.append('name', data.name);
        if (data.email) formData.append('email', data.email);
        if (data.phone) formData.append('phone', data.phone);
        if (data.dob) formData.append('dob', data.dob);
        if (data.profileImageFile) {
          formData.append('profileImage', data.profileImageFile);
        }
        const res = await api.put('/me', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const resUser = res.data;
        setUser((prev) =>
          prev
            ? {
                ...prev,
                name: resUser.name,
                email: resUser.email,
                phone: resUser.phone || prev.phone,
                dob: resUser.dob || prev.dob,
                profileImageUrl: resUser.profileImageUrl || prev.profileImageUrl,
              }
            : prev
        );
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Failed to update profile');
      }
    }
  };

  // Internal: fetch full doctor profile
  const fetchDoctorProfileInternal = async (commonUser: User): Promise<User> => {
    const res = await api.get('/medical/doctor/me');
    const d = res.data;
    let loc: LocationType | undefined;
    if (d.location) {
      if (typeof d.location === 'object' && 'address' in d.location) {
        loc = {
          lat: (d.location.lat as number) || 0,
          lng: (d.location.lng as number) || 0,
          address: d.location.address as string,
        };
      } else if (typeof d.location === 'string') {
        loc = { lat: 0, lng: 0, address: d.location };
      }
    }
    // Ensure consultationFee is read
    const fee: number =
      typeof d.consultationFee === 'number' ? d.consultationFee : 0;

    const updated: User = {
      id: d.id,
      name: d.name,
      email: d.email,
      role: 'doctor',
      provider: commonUser.provider,
      isVerified: commonUser.isVerified,
      phone: d.phone || '',
      dob: d.dob || '',
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
      consultationFee: fee,
    };
    return updated;
  };

  const fetchDoctorProfile = async (): Promise<User> => {
    try {
      if (!user) throw new Error('Not authenticated');
      const updated = await fetchDoctorProfileInternal(user);
      setUser(updated);
      return updated;
    } catch (err: any) {
      console.error('fetchDoctorProfile error:', err);
      throw new Error(err.response?.data?.message || 'Failed to fetch doctor profile');
    }
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
    try {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.email) formData.append('email', data.email);
      if (data.phone) formData.append('phone', data.phone);
      if (data.dob) formData.append('dob', data.dob);
      if (data.specialty) formData.append('specialty', data.specialty);
      if (data.availabilitySlots) {
        formData.append('availabilitySlots', JSON.stringify(data.availabilitySlots));
      }
      if (data.location) {
        formData.append('locationObj', JSON.stringify(data.location));
        formData.append('location', data.location.address);
      }
      if (data.maxPatients !== undefined) {
        formData.append('maxPatients', data.maxPatients.toString());
      }
      if (data.experience !== undefined) {
        formData.append('experience', data.experience);
      }
      if (data.hospitalAffiliation !== undefined) {
        formData.append('hospitalAffiliation', data.hospitalAffiliation);
      }
      if (data.bio !== undefined) {
        formData.append('bio', data.bio);
      }
      if (data.qualifications !== undefined) {
        formData.append('qualifications', JSON.stringify(data.qualifications));
      }
      if (data.languages !== undefined) {
        formData.append('languages', JSON.stringify(data.languages));
      }
      if (data.consultationFee !== undefined) {
        console.log('Appending consultationFee:', data.consultationFee);
        formData.append('consultationFee', data.consultationFee.toString());
      }
      if (data.profileImageFile) {
        formData.append('profileImage', data.profileImageFile);
      }

      const res = await api.put('/medical/doctor/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const d = res.data;

      // Parse location again
      let loc: LocationType | undefined;
      if (d.location) {
        if (typeof d.location === 'object' && 'address' in d.location) {
          loc = {
            lat: (d.location.lat as number) || 0,
            lng: (d.location.lng as number) || 0,
            address: d.location.address as string,
          };
        } else if (typeof d.location === 'string') {
          loc = { lat: 0, lng: 0, address: d.location };
        }
      }
      const fee: number =
        typeof d.consultationFee === 'number' ? d.consultationFee : 0;

      const updated: User = {
        id: d.id,
        name: d.name,
        email: d.email,
        role: 'doctor',
        provider: user?.provider,
        isVerified: user?.isVerified,
        phone: d.phone || '',
        dob: d.dob || '',
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
        consultationFee: fee,
      };
      console.log('Received updated consultationFee:', updated.consultationFee);
      setUser(updated);
      return updated;
    } catch (err: any) {
      console.error('updateDoctorProfile error:', err);
      throw new Error(err.response?.data?.message || 'Failed to update doctor profile');
    }
  };

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
  const resetPassword = async (
    email: string,
    otp: string,
    newPassword: string
  ) => {
    try {
      await api.post('/reset-password', { email, otp, newPassword });
      navigate('/login');
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Password reset failed');
    }
  };
  const deleteAccount = async (password: string) => {
    try {
      await api.delete('/user', { data: { password } });
      localStorage.removeItem('authToken');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/signup');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete account';
      throw new Error(msg);
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
        fetchDoctorProfile,
        updateDoctorProfile,
        sendPasswordResetOtp,
        verifyPasswordResetOtp,
        resetPassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
