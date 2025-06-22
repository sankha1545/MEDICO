// File: frontend/src/pages/doctor/DoctorDashboard.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, subMonths, subYears, startOfMonth, startOfYear } from 'date-fns';
import {
  Calendar,
  Users,
  DollarSign,
  Bell,
  User as UserIcon,
  Activity,
  Settings as SettingsIcon,
  LogOut,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import {
  FadeIn,
  SlideIn,
  StaggeredContainer,
  staggeredItemVariants,
} from '../../components/animations/Transitions';
import EditProfileForm from '../../components/common/editprofile/editprofileformsdoc'; // adjust path

// Recharts imports
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import axios from 'axios';

// Interfaces
interface DoctorAppointment {
  id: string;
  patientName: string;
  date: string; // ISO string
  status: 'upcoming' | 'completed' | 'pending' | 'cancelled';
}
interface NotificationItem {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

type TabKey = 'overview' | 'appointments' | 'patients' | 'earnings' | 'messages' | 'profile' | 'payout';
const tabs: TabKey[] = ['overview', 'appointments', 'patients', 'earnings', 'messages', 'profile', 'payout'];

const DoctorDashboardPage: React.FC = () => {
  const { user, logout, fetchDoctorProfile, updateDoctorProfile } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken') || '';
  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api') ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Profile fields
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileSpecialty, setProfileSpecialty] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileDob, setProfileDob] = useState(''); // "YYYY-MM-DD"
  const [profileLocationObj, setProfileLocationObj] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [profileAvailabilitySlots, setProfileAvailabilitySlots] = useState<string[]>([]);
  const [profileMaxPatients, setProfileMaxPatients] = useState<number>(1);
  const [profileExperience, setProfileExperience] = useState<string>('');
  const [profileConsultationFee, setProfileConsultationFee] = useState<number>(0);

  // Payout fields
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIFSC, setBankIFSC] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutStatusMsg, setPayoutStatusMsg] = useState<string | null>(null);
  const [existingPayoutAccountId, setExistingPayoutAccountId] = useState<string | null>(null);

  // Appointments & notifications state
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<NotificationItem[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);

  const fetchedProfileRef = useRef(false);

  // Fetch doctor profile once
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.role === 'doctor' && !fetchedProfileRef.current) {
        fetchedProfileRef.current = true;
        setLoadingProfile(true);
        try {
          const prof = await fetchDoctorProfile();
          setProfileName(prof.name);
          setProfileEmail(prof.email);
          setProfileSpecialty(prof.specialty || '');
          setProfileImageUrl(prof.profileImageUrl);
          setProfilePhone(prof.phone || '');
          setProfileDob(prof.dob || '');
          if (prof.location && typeof prof.location === 'object') {
            setProfileLocationObj({
              lat: (prof.location as any).lat,
              lng: (prof.location as any).lng,
              address: (prof.location as any).address,
            });
          } else {
            setProfileLocationObj(null);
          }
          setProfileAvailabilitySlots(prof.availabilitySlots || []);
          setProfileMaxPatients(prof.maxPatients ?? 1);
          setProfileExperience(prof.experience || '');
          setProfileConsultationFee(prof.consultationFee ?? 0);
          if ((prof as any).razorpayAccountId) {
            setExistingPayoutAccountId((prof as any).razorpayAccountId);
          }
        } catch (err: any) {
          console.error('Failed to load doctor profile:', err);
          setProfileError(err.message || 'Failed to load profile');
        } finally {
          setLoadingProfile(false);
        }
      }
    };
    loadProfile();
  }, [user, fetchDoctorProfile]);

  // Fetch appointments whenever activeTab is relevant or on mount
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!token) return;
      try {
        const resp = await axios.get<DoctorAppointment[]>(buildUrl('/appointments/doctor'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = resp.data || [];
        setAppointments(data);
        // Count upcoming
        const now = new Date();
        const upcoming = data.filter((a) => {
          const dt = new Date(a.date);
          return a.status === 'upcoming' && dt > now;
        }).length;
        setUpcomingCount(upcoming);
      } catch (err) {
        console.error('Error fetching doctor appointments:', err);
      }
    };
    if (activeTab === 'overview' || activeTab === 'appointments' || activeTab === 'earnings') {
      fetchAppointments();
    }
  }, [activeTab, token]);

  // Fetch notifications whenever activeTab is appointments or overview
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;
      try {
        const resp = await axios.get<NotificationItem[]>(buildUrl('/notifications'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const notifs = resp.data || [];
        // Only unread appointment_requested notifications for appointment tab
        const unread = notifs.filter((n) => !n.read && n.type === 'appointment_requested');
        setNotifications(notifs);
        setUnreadNotifications(unread);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    if (activeTab === 'overview' || activeTab === 'appointments') {
      fetchNotifications();
    }
  }, [activeTab, token]);

  // Handle marking a notification as read
  const markNotificationRead = async (notifId: string) => {
    try {
      await axios.put(
        buildUrl(`/notifications/${notifId}/read`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Remove from unreadNotifications
      setUnreadNotifications((prev) => prev.filter((n) => n._id !== notifId));
      // Also update full notifications list
      setNotifications((prev) => prev.map((n) => n._id === notifId ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  // Save updated profile
  const handleSaveProfile = async (
    name: string,
    email: string,
    specialty: string,
    profileImageFile: File | null,
    availabilitySlots: string[],
    locationObj: { lat: number; lng: number; address: string },
    maxPatients: number,
    dob: string,
    experience: string,
    hospitalAffiliation?: string,
    bio?: string,
    qualifications?: string[],
    languages?: string[],
    consultationFee?: number
  ) => {
    setProfileError('');
    try {
      const updated = await updateDoctorProfile({
        name,
        email,
        specialty,
        profileImageFile,
        availabilitySlots,
        location: locationObj,
        maxPatients,
        dob,
        experience,
        consultationFee,
        hospitalAffiliation,
        bio,
        qualifications,
        languages,
      });
      // Update local state
      setProfileName(updated.name);
      setProfileEmail(updated.email);
      setProfileSpecialty(updated.specialty || '');
      setProfileImageUrl(
        profileImageFile ? URL.createObjectURL(profileImageFile) : updated.profileImageUrl || ''
      );
      setProfilePhone(updated.phone || '');
      setProfileDob(updated.dob || '');
      if (updated.location && typeof updated.location === 'object') {
        setProfileLocationObj({
          lat: (updated.location as any).lat,
          lng: (updated.location as any).lng,
          address: (updated.location as any).address,
        });
      } else {
        setProfileLocationObj(null);
      }
      setProfileAvailabilitySlots(updated.availabilitySlots || []);
      setProfileMaxPatients(updated.maxPatients ?? 1);
      setProfileExperience(updated.experience || '');
      setProfileConsultationFee(updated.consultationFee ?? 0);
      setShowEditProfile(false);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setProfileError(err.message || 'Failed to save profile');
    }
  };

  // Handle Add Payout Account
  const handleAddPayoutAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutLoading(true);
    setPayoutStatusMsg(null);
    try {
      const resp = await fetch(buildUrl('/medical/doctor/payout-account'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountHolderName: bankAccountName.trim(),
          accountNumber: bankAccountNumber.trim(),
          ifsc: bankIFSC.trim(),
        }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.message || 'Failed to add payout account');
      }
      const data = await resp.json();
      setExistingPayoutAccountId(data.fundAccountId);
      setPayoutStatusMsg('Payout account added successfully.');
      setBankAccountName('');
      setBankAccountNumber('');
      setBankIFSC('');
    } catch (err: any) {
      console.error('Payout account error:', err);
      setPayoutStatusMsg(err.message || 'Failed to add payout account');
    } finally {
      setPayoutLoading(false);
    }
  };

  // Chart data
  const weeklyData = useMemo(() => {
    const data: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i);
      const key = format(day, 'yyyy-MM-dd');
      const count = appointments.filter(a => format(new Date(a.date), 'yyyy-MM-dd') === key).length;
      data.push({ date: format(day, 'MMM d'), count });
    }
    return data;
  }, [appointments]);

  const monthlyData = useMemo(() => {
    const data: { month: string; count: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const m = subMonths(now, i);
      const key = format(startOfMonth(m), 'yyyy-MM');
      const count = appointments.filter(a => format(new Date(a.date), 'yyyy-MM') === key).length;
      data.push({ month: format(m, 'MMM yyyy'), count });
    }
    return data;
  }, [appointments]);

  const yearlyData = useMemo(() => {
    const data: { year: string; count: number }[] = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const y = subYears(now, i);
      const key = format(startOfYear(y), 'yyyy');
      const count = appointments.filter(a => format(new Date(a.date), 'yyyy') === key).length;
      data.push({ year: format(y, 'yyyy'), count });
    }
    return data;
  }, [appointments]);

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <FadeIn>
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-700 rounded-full overflow-hidden">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-full h-full p-4 text-gray-500" />
                )}
              </div>
              <h1 className="text-4xl font-extrabold text-gray-100 tracking-tight">
                Dr. {profileName}
              </h1>
              <motion.button
                onClick={() => setShowEditProfile(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl"
              >
                <Pencil className="w-5 h-5" /> <span>Edit Profile</span>
              </motion.button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="mt-4 md:mt-0"
            >
              <LogOut className="mr-2 w-4 h-4" /> Logout
            </Button>
          </header>
        </FadeIn>

        {showEditProfile && (
          <EditProfileForm
            currentName={profileName}
            currentEmail={profileEmail}
            currentSpecialty={profileSpecialty}
            currentProfileImageUrl={profileImageUrl}
            currentAvailabilitySlots={profileAvailabilitySlots}
            currentLocation={
              profileLocationObj
                ? {
                    lat: profileLocationObj.lat,
                    lng: profileLocationObj.lng,
                    address: profileLocationObj.address,
                  }
                : undefined
            }
            currentMaxPatients={profileMaxPatients}
            currentDob={profileDob}
            currentExperience={profileExperience}
            currentConsultationFee={profileConsultationFee}
            onCancel={() => setShowEditProfile(false)}
            onSave={handleSaveProfile}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              title: 'Upcoming Appointments',
              value: upcomingCount,
              icon: <Calendar className="w-6 h-6 text-white" />,
              gradient: 'bg-gradient-to-br from-blue-700 to-blue-900',
            },
            {
              title: 'Total Patients',
              value: appointments.length > 0
                ? /* count unique patients? or total appointments */ [...new Set(appointments.map(a => a.patientName))].length
                : 0,
              icon: <Users className="w-6 h-6 text-white" />,
              gradient: 'bg-gradient-to-br from-indigo-700 to-indigo-900',
            },
            {
              title: 'Earnings This Month',
              value: (() => {
                // sum of appointments in this month * consultationFee
                const now = new Date();
                const thisMonthKey = format(now, 'yyyy-MM');
                const countThisMonth = appointments.filter(a =>
                  format(new Date(a.date), 'yyyy-MM') === thisMonthKey
                ).length;
                return `₹ ${countThisMonth * profileConsultationFee}`;
              })(),
              icon: <DollarSign className="w-6 h-6 text-white" />,
              gradient: 'bg-gradient-to-br from-green-700 to-green-900',
            },
            {
              title: 'Unread Notifications',
              value: notifications.filter(n => !n.read).length,
              icon: <Bell className="w-6 h-6 text-white" />,
              gradient: 'bg-gradient-to-br from-purple-700 to-purple-900',
            },
          ].map((stat, idx) => (
            <SlideIn key={idx} direction="up" delay={idx * 0.1}>
              <div
                className={`${stat.gradient} rounded-2xl shadow-lg overflow-hidden text-white`}
              >
                <div className="p-6 flex items-center">
                  <div className="p-3 rounded-full bg-white bg-opacity-25 mr-4">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-wide">{stat.title}</p>
                    <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </div>
            </SlideIn>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 mb-12 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-700">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center space-x-2 px-5 py-3 ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>
                  {{
                    overview: <Activity className="w-5 h-5" />,
                    appointments: <Calendar className="w-5 h-5" />,
                    patients: <Users className="w-5 h-5" />,
                    earnings: <DollarSign className="w-5 h-5" />,
                    messages: <Bell className="w-5 h-5" />,
                    profile: <UserIcon className="w-5 h-5" />,
                    payout: <DollarSign className="w-5 h-5" />,
                  }[tab]}
                </span>
                <span className="capitalize">{tab}</span>
                {tab === 'appointments' && upcomingCount > 0 && (
                  <span className="ml-1 inline-block bg-yellow-500 text-black text-xs rounded-full px-2">
                    {upcomingCount}
                  </span>
                )}
                {tab === 'messages' && notifications.filter(n => !n.read).length > 0 && (
                  <span className="ml-1 inline-block bg-red-500 text-white text-xs rounded-full px-2">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="p-8 text-gray-100">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <StaggeredContainer>
                <div className="space-y-8">
                  {/* Weekly Graph */}
                  <SlideIn direction="up" delay={0.1}>
                    <div className="bg-gray-800 rounded-xl shadow-lg p-6">
                      <h3 className="text-xl font-semibold text-gray-100 mb-4">
                        Last 7 Days: Appointments
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={weeklyData}>
                          <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                          <XAxis dataKey="date" stroke="#888" />
                          <YAxis allowDecimals={false} stroke="#888" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#2d2d2d', border: 'none' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#aaa' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#4ade80"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 6 }}
                            isAnimationActive={true}
                            animationDuration={1500}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </SlideIn>
                  {/* Monthly Graph */}
                  <SlideIn direction="up" delay={0.2}>
                    <div className="bg-gray-800 rounded-xl shadow-lg p-6">
                      <h3 className="text-xl font-semibold text-gray-100 mb-4">
                        Last 12 Months: Appointments
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthlyData}>
                          <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                          <XAxis dataKey="month" stroke="#888" />
                          <YAxis allowDecimals={false} stroke="#888" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#2d2d2d', border: 'none' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#aaa' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#60a5fa"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 6 }}
                            isAnimationActive={true}
                            animationDuration={1500}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </SlideIn>
                  {/* Yearly Graph */}
                  <SlideIn direction="up" delay={0.3}>
                    <div className="bg-gray-800 rounded-xl shadow-lg p-6">
                      <h3 className="text-xl font-semibold text-gray-100 mb-4">
                        Last 5 Years: Appointments
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={yearlyData}>
                          <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                          <XAxis dataKey="year" stroke="#888" />
                          <YAxis allowDecimals={false} stroke="#888" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#2d2d2d', border: 'none' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#aaa' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#facc15"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 6 }}
                            isAnimationActive={true}
                            animationDuration={1500}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </SlideIn>
                </div>
              </StaggeredContainer>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                {/* Unread appointment notifications */}
                {unreadNotifications.length > 0 && (
                  <div className="bg-yellow-800/50 border border-yellow-600 rounded-lg p-4 space-y-3">
                    <h3 className="text-lg font-semibold text-yellow-200 mb-2">
                      New Appointment Requests
                    </h3>
                    {unreadNotifications.map((notif) => (
                      <motion.div
                        key={notif._id}
                        className="flex justify-between items-center bg-yellow-700/30 p-3 rounded"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="w-5 h-5 text-yellow-300" />
                          <p className="text-yellow-100 text-sm">{notif.message}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="xs"
                          className="border-yellow-300 text-yellow-200 hover:bg-yellow-600/20"
                          onClick={() => markNotificationRead(notif._id)}
                        >
                          Mark read
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* List appointments */}
                {appointments.length > 0 ? (
                  appointments.map((a) => {
                    const dt = new Date(a.date);
                    const statusLabel =
                      a.status === 'upcoming'
                        ? 'Upcoming'
                        : a.status === 'completed'
                        ? 'Completed'
                        : a.status.charAt(0).toUpperCase() + a.status.slice(1);
                    return (
                      <motion.div
                        key={a.id}
                        variants={staggeredItemVariants}
                        className="bg-gray-800 rounded-lg shadow-sm p-6 flex justify-between items-center hover:shadow-md transition-shadow"
                      >
                        <div>
                          <p className="font-semibold text-gray-100">
                            {a.patientName}
                          </p>
                          <p className="text-gray-400 mt-1">
                            {format(dt, 'MMMM d, yyyy h:mm a')}
                          </p>
                          <span
                            className={`mt-2 inline-block text-xs font-medium px-2 py-1 rounded-full ${
                              a.status === 'upcoming'
                                ? 'bg-yellow-600 text-yellow-100'
                                : a.status === 'completed'
                                ? 'bg-green-600 text-green-100'
                                : 'bg-red-600 text-red-100'
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <div className="flex space-x-3">
                          {a.status === 'upcoming' ? (
                            <>
                              <Button variant="outline" size="sm" onClick={() => {
                                // maybe reschedule or view details
                                navigate(`/doctor/appointments/${a.id}`);
                              }}>
                                Details
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => {
                              navigate(`/doctor/appointments/${a.id}`);
                            }}>
                              View Notes
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <p className="text-gray-400">No appointments to show.</p>
                )}
              </div>
            )}

            {/* Patients Tab */}
            {activeTab === 'patients' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold">Patient Records & Seats</h2>
                {/* Implement as needed */}
                <p className="text-gray-400">Patient records section coming soon.</p>
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold text-gray-100">
                  Earnings Overview
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <motion.div
                    variants={staggeredItemVariants}
                    className="bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <p className="text-sm text-gray-400 uppercase tracking-wide">
                      This Month
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-100">
                      {(() => {
                        const now = new Date();
                        const thisMonthKey = format(now, 'yyyy-MM');
                        const countThisMonth = appointments.filter(a =>
                          format(new Date(a.date), 'yyyy-MM') === thisMonthKey
                        ).length;
                        return `₹ ${countThisMonth * profileConsultationFee}`;
                      })()}
                    </p>
                  </motion.div>
                  <motion.div
                    variants={staggeredItemVariants}
                    className="bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <p className="text-sm text-gray-400 uppercase tracking-wide">
                      Total to Date
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-100">
                      {(() => {
                        const totalCount = appointments.length;
                        return `₹ ${totalCount * profileConsultationFee}`;
                      })()}
                    </p>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="space-y-4">
                <p className="text-gray-400">Messaging feature coming soon.</p>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                  variants={staggeredItemVariants}
                  className="bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-gray-100 mb-5">
                    Profile Details
                  </h3>
                  <div className="flex items-start space-x-6">
                    <div className="w-20 h-20 bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-full h-full p-4 text-gray-500" />
                      )}
                    </div>
                    <div className="space-y-3 text-gray-100 flex-1">
                      <div>
                        <p className="text-sm text-gray-400">Name</p>
                        <p className="font-medium">Dr. {profileName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <p className="font-medium">{profileEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Specialty</p>
                        <p className="font-medium">{profileSpecialty || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Phone</p>
                        <p className="font-medium">{profilePhone || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Date of Birth</p>
                        <p className="font-medium">{profileDob || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Location</p>
                        <p className="font-medium">
                          {profileLocationObj?.address || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Experience</p>
                        <p className="font-medium">
                          {profileExperience || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Consultation Fee (INR)</p>
                        <p className="font-medium">
                          {profileConsultationFee != null
                            ? `₹ ${profileConsultationFee}`
                            : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Available Slots</p>
                        {profileAvailabilitySlots && profileAvailabilitySlots.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {profileAvailabilitySlots.map((slot, idx) => {
                              let display = slot;
                              try {
                                const dt = new Date(slot);
                                if (!isNaN(dt.getTime())) {
                                  display = format(dt, 'MMM d, yyyy h:mm a');
                                }
                              } catch {}
                              return (
                                <li key={idx} className="font-medium">
                                  {display}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="font-medium text-gray-400">Not set</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Max Patients per Slot</p>
                        <p className="font-medium">{profileMaxPatients}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Payout Account ID</p>
                        <p className="font-medium break-all">
                          {existingPayoutAccountId || 'Not added'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  variants={staggeredItemVariants}
                  className="bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-gray-100 mb-5">
                    Account Settings
                  </h3>
                  <Link to="/doc-settings">
                    <Button variant="primary" size="sm">
                      <SettingsIcon className="mr-2 w-4 h-4" /> Go to Settings
                    </Button>
                  </Link>
                </motion.div>
              </div>
            )}

            {/* Payout Tab */}
            {activeTab === 'payout' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-100 mb-4">
                  Payout Account
                </h2>
                {existingPayoutAccountId ? (
                  <div className="bg-gray-800 rounded-xl shadow-sm p-6">
                    <p className="text-gray-300">
                      You have already added a payout account:
                    </p>
                    <p className="text-white break-all font-medium">
                      {existingPayoutAccountId}
                    </p>
                    <p className="text-gray-400 mt-2">
                      If you need to update bank details, please contact support or remove and re-add below.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleAddPayoutAccount}
                    className="bg-gray-800 rounded-xl shadow-sm p-6 space-y-4"
                  >
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={bankAccountName}
                        onChange={e => setBankAccountName(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={payoutLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={e => setBankAccountNumber(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={payoutLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={bankIFSC}
                        onChange={e => setBankIFSC(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={payoutLoading}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={payoutLoading}
                      className="mt-4 w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 rounded-lg disabled:opacity-50"
                    >
                      {payoutLoading ? 'Adding...' : 'Add Payout Account'}
                    </button>
                    {payoutStatusMsg && (
                      <p className="text-sm mt-2 text-center text-white">
                        {payoutStatusMsg}
                      </p>
                    )}
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {profileError && (
          <div className="mt-4 bg-red-600 text-white p-3 rounded">{profileError}</div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboardPage;
