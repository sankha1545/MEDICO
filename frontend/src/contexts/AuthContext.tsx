import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import axios, { AxiosInstance } from 'axios';
import { useNavigate } from 'react-router-dom';

interface LocationType {
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
  dob: string;
  // doctor-specific:
  profileImageUrl?: string;
  specialty?: string;
  slotDateTime?: string; // ISO string or datetime-local
  location?: LocationType;
  maxPatients?: number;
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
    slotDateTime?: string;
    location?: LocationType;
    maxPatients?: number;
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
  // e.g. VITE_API_URL = 'http://localhost:4000/api'
  const baseURL = import.meta.env.VITE_API_URL as string;
  const navigate = useNavigate();

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

  // Fetch common user; if doctor, also fetch doctor-specific
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
          const doc = await fetchDoctorProfileInternal();
          setUser(doc);
        } catch (e) {
          console.error('Error fetching doctor-specific after common:', e);
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

  const updateUserProfile = async (data: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
    profileImageFile?: File | null;
  }) => {
    try {
      if (user?.role === 'doctor') {
        // Merge common updates into doctor
        const updated = await updateDoctorProfile({
          name: data.name,
          email: data.email,
          phone: data.phone,
          dob: data.dob,
          profileImageFile: data.profileImageFile,
        });
        setUser(updated);
      } else {
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
        setUser((prev) => ({
          ...prev!,
          name: resUser.name,
          email: resUser.email,
          phone: resUser.phone || prev?.phone || '',
          dob: resUser.dob || prev?.dob || '',
          profileImageUrl: resUser.profileImageUrl || prev?.profileImageUrl || '',
        }));
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  // Internal helper to GET doctor profile
  const fetchDoctorProfileInternal = async (): Promise<User> => {
    // GET baseURL + '/medical/doctor/me'
    const res = await api.get('/medical/doctor/me');
    const d = res.data;
    const updated: User = {
      id: d.id,
      name: d.name,
      email: d.email,
      role: 'doctor',
      provider: user?.provider,
      isVerified: user?.isVerified,
      phone: d.phone,
      dob: d.dob,
      profileImageUrl: d.profileImageUrl,
      specialty: d.specialty,
      slotDateTime: d.slotDateTime,
      location: d.location,
      maxPatients: d.maxPatients,
    };
    return updated;
  };

  const fetchDoctorProfile = async (): Promise<User> => {
    try {
      const updated = await fetchDoctorProfileInternal();
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
    slotDateTime?: string;
    location?: LocationType;
    maxPatients?: number;
  }): Promise<User> => {
    try {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.email) formData.append('email', data.email);
      if (data.phone) formData.append('phone', data.phone);
      if (data.dob) formData.append('dob', data.dob);
      if (data.specialty) formData.append('specialty', data.specialty);
      if (data.slotDateTime) formData.append('nextAvailable', data.slotDateTime);
      if (data.location) {
        // backend expects 'location' as address string
        formData.append('location', data.location.address);
      }
      if (data.maxPatients !== undefined) {
        formData.append('availableSlots', data.maxPatients.toString());
      }
      if (data.profileImageFile) {
        formData.append('profileImage', data.profileImageFile);
      }
      // PUT baseURL + '/medical/doctor/me'
      const res = await api.put('/medical/doctor/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const d = res.data;
      const updated: User = {
        id: d.id,
        name: d.name,
        email: d.email,
        role: 'doctor',
        provider: user?.provider,
        isVerified: user?.isVerified,
        phone: d.phone,
        dob: d.dob,
        profileImageUrl: d.profileImageUrl,
        specialty: d.specialty,
        slotDateTime: d.slotDateTime,
        location: d.location,
        maxPatients: d.maxPatients,
      };
      setUser(updated);
      return updated;
    } catch (err: any) {
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
