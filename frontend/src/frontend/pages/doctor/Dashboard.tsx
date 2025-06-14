// File: src/frontend/pages/doctor/DoctorDashboardEnhanced.tsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, subMonths, subYears, startOfMonth, startOfYear } from 'date-fns';
import {
  Calendar,
  Users,
  DollarSign,
  Bell,
  User,
  Activity,
  Settings as SettingsIcon,
  LogOut,
  Pencil,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import { Enhanced3DCard, MedicalCard } from '../../components/ui/Enhanced3DCard';
import { NeonButton } from '../../components/ui/NeonButton';
import { GlowingText } from '../../components/animations/GlowingText';
import { Medical3DBackground } from '../../components/animations/3D/FloatingMedicalElements';

// Import PatientAdmission component
import PatientAdmission from './PatientAdmission'; // adjust path if needed

// Mock data interfaces for overview & other tabs
interface DoctorAppointment {
  id: string;
  patientName: string;
  date: Date;
  status: 'upcoming' | 'completed' | 'cancelled';
}

interface DoctorMessage {
  id: string;
  from: string;
  content: string;
  date: Date;
  read: boolean;
}

interface PatientRecord {
  id: string;
  name: string;
  lastVisit: Date;
  condition: string;
}

// Mock data for demonstration (you may replace with real API calls)
const mockAppointments: DoctorAppointment[] = [
  { id: 'a1', patientName: 'John Doe', date: new Date(2025, 4, 20, 10, 0), status: 'upcoming' },
  { id: 'a2', patientName: 'Jane Smith', date: new Date(2025, 4, 21, 14, 30), status: 'upcoming' },
  { id: 'a3', patientName: 'Mike Johnson', date: new Date(2025, 3, 15, 9, 0), status: 'completed' },
  { id: 'a4', patientName: 'Alice Walker', date: subDays(new Date(), 1), status: 'completed' },
  { id: 'a5', patientName: 'Bob Martin', date: subDays(new Date(), 2), status: 'completed' },
  { id: 'a6', patientName: 'Carol King', date: subDays(new Date(), 2), status: 'completed' },
  { id: 'a7', patientName: 'David Brown', date: subDays(new Date(), 3), status: 'completed' },
  { id: 'a8', patientName: 'Eve Davis', date: subDays(new Date(), 5), status: 'completed' },
  { id: 'a9', patientName: 'Frank Moore', date: subDays(new Date(), 6), status: 'completed' },
  { id: 'a10', patientName: 'Grace Lee', date: subMonths(new Date(), 1), status: 'completed' },
  { id: 'a11', patientName: 'Harry White', date: subMonths(new Date(), 1), status: 'completed' },
  { id: 'a12', patientName: 'Ivy Green', date: subMonths(new Date(), 2), status: 'completed' },
  { id: 'a13', patientName: 'Jack Black', date: subMonths(new Date(), 4), status: 'completed' },
  { id: 'a14', patientName: 'Karen Hill', date: subMonths(new Date(), 5), status: 'completed' },
  { id: 'a15', patientName: 'Leo Scott', date: subMonths(new Date(), 11), status: 'completed' },
  { id: 'a16', patientName: 'Mia Clark', date: subYears(new Date(), 1), status: 'completed' },
  { id: 'a17', patientName: 'Noah Cox', date: subYears(new Date(), 2), status: 'completed' },
  { id: 'a18', patientName: 'Olivia Fox', date: subYears(new Date(), 3), status: 'completed' },
  { id: 'a19', patientName: 'Paul Young', date: subYears(new Date(), 4), status: 'completed' },
  { id: 'a20', patientName: 'Quinn Reed', date: subYears(new Date(), 4), status: 'completed' },
  { id: 'a21', patientName: 'Ryan Diaz', date: subYears(new Date(), 5), status: 'completed' },
];

const mockMessages: DoctorMessage[] = [
  { id: 'm1', from: 'Emily Clark', content: 'Question about prescription', date: new Date(2025, 4, 18, 16, 0), read: false },
  { id: 'm2', from: 'Samuel Lee', content: 'Thank you!', date: new Date(2025, 4, 17, 9, 30), read: true },
];

const mockPatients: PatientRecord[] = [
  { id: 'p1', name: 'Emily Clark', lastVisit: new Date(2025, 4, 18), condition: 'Hypertension' },
  { id: 'p2', name: 'Samuel Lee', lastVisit: new Date(2025, 4, 15), condition: 'Diabetes' },
  { id: 'p3', name: 'Olivia Brown', lastVisit: new Date(2025, 3, 30), condition: 'Asthma' },
];

const tabs = ['overview', 'appointments', 'patients', 'earnings', 'messages', 'profile'] as const;
type TabKey = typeof tabs[number];

/**
 * DoctorDashboardEnhanced
 * 
 * - Enhanced 3D background and cards
 * - Tabs: overview, appointments (with embedded PatientAdmission), patients, earnings, messages, profile
 * - Fetches doctor profile via useAuth, but here using static user name for demo
 */
const DoctorDashboardEnhanced: React.FC = () => {
  const { user, logout, fetchDoctorProfile, updateDoctorProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  // Profile local state
  const [profileName, setProfileName] = useState<string>(user?.name || '');
  const [profileEmail, setProfileEmail] = useState<string>(user?.email || '');
  const [profileSpecialty, setProfileSpecialty] = useState<string>(user?.specialty || '');
  const [profileImageUrl, setProfileImageUrl] = useState<string>(user?.profileImageUrl || '');
  const [profilePhone, setProfilePhone] = useState<string>(user?.phone || '');
  const [profileDob, setProfileDob] = useState<string>(user?.dob || '');
  const [profileLocation, setProfileLocation] = useState<string>(user?.location?.address || '');
  const [profileNextAvailable, setProfileNextAvailable] = useState<string>(user?.slotDateTime || '');
  const [profileAvailableSlots, setProfileAvailableSlots] = useState<number>(user?.maxPatients ?? 1);

  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string>('');
  const fetchedRef = useRef<boolean>(false);

  // Mock stats for overview
  const upcomingCount = mockAppointments.filter((a) => a.status === 'upcoming').length;
  const totalPatients = mockPatients.length;
  const earningsThisMonth = 5200;
  const unreadMessages = mockMessages.filter((m) => !m.read).length;

  // Chart data (mocked)
  const weeklyData = useMemo(() => {
    const data: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const key = format(day, 'yyyy-MM-dd');
      const label = format(day, 'MMM d');
      const count = mockAppointments.filter((a) => format(a.date, 'yyyy-MM-dd') === key).length;
      data.push({ date: label, count });
    }
    return data;
  }, []);

  const monthlyData = useMemo(() => {
    const data: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const m = subMonths(new Date(), i);
      const key = format(startOfMonth(m), 'yyyy-MM');
      const label = format(m, 'MMM yyyy');
      const count = mockAppointments.filter((a) => format(a.date, 'yyyy-MM') === key).length;
      data.push({ month: label, count });
    }
    return data;
  }, []);

  const yearlyData = useMemo(() => {
    const data: { year: string; count: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const y = subYears(new Date(), i);
      const key = format(startOfYear(y), 'yyyy');
      const label = format(y, 'yyyy');
      const count = mockAppointments.filter((a) => format(a.date, 'yyyy') === key).length;
      data.push({ year: label, count });
    }
    return data;
  }, []);

  // Fetch doctor profile once
  useEffect(() => {
    const loadProfile = async () => {
      if (user && user.role === 'doctor' && !fetchedRef.current) {
        fetchedRef.current = true;
        setLoadingProfile(true);
        try {
          const prof = await fetchDoctorProfile();
          setProfileName(prof.name);
          setProfileEmail(prof.email);
          setProfileSpecialty(prof.specialty || '');
          setProfileImageUrl(prof.profileImageUrl || '');
          setProfilePhone(prof.phone || '');
          setProfileDob(prof.dob || '');
          setProfileNextAvailable(prof.slotDateTime || '');
          setProfileAvailableSlots(prof.maxPatients ?? 1);
          setProfileLocation(prof.location?.address || '');
        } catch (err: any) {
          console.error('Failed to load profile:', err);
          setProfileError(err.message || 'Failed to load profile');
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [user, fetchDoctorProfile]);

  // Handle edit profile save (not shown UI here, but could be in a modal)
  const handleSaveProfile = async (
    name: string,
    email: string,
    specialty: string,
    profileImageFile: File | null,
    slotDateTime: string,
    locationObj: { lat: number; lng: number; address: string },
    maxPatients: number
  ) => {
    setProfileError('');
    try {
      const updated = await updateDoctorProfile({
        name,
        email,
        specialty,
        profileImageFile,
        slotDateTime,
        location: locationObj,
        maxPatients,
      });
      setProfileName(updated.name);
      setProfileEmail(updated.email);
      setProfileSpecialty(updated.specialty || '');
      if (profileImageFile) {
        const newUrl = URL.createObjectURL(profileImageFile);
        setProfileImageUrl(newUrl);
      } else {
        setProfileImageUrl(updated.profileImageUrl || '');
      }
      setProfilePhone(updated.phone || '');
      setProfileDob(updated.dob || '');
      setProfileNextAvailable(updated.slotDateTime || '');
      setProfileAvailableSlots(updated.maxPatients ?? 1);
      setProfileLocation(updated.location?.address || '');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setProfileError(err.message || 'Failed to save profile');
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading profile...
      </div>
    );
  }

  // Stats configuration for overview
  const stats = [
    {
      title: 'Upcoming Appointments',
      value: upcomingCount,
      icon: <Calendar className="w-8 h-8" />,
      gradient: 'from-blue-500 to-cyan-500',
      glowColor: '#00d4ff',
    },
    {
      title: 'Total Patients',
      value: totalPatients,
      icon: <Users className="w-8 h-8" />,
      gradient: 'from-purple-500 to-pink-500',
      glowColor: '#ff6b6b',
    },
    {
      title: 'Earnings This Month',
      value: `$${earningsThisMonth}`,
      icon: <DollarSign className="w-8 h-8" />,
      gradient: 'from-green-500 to-emerald-500',
      glowColor: '#4ecdc4',
    },
    {
      title: 'Unread Messages',
      value: unreadMessages,
      icon: <Bell className="w-8 h-8" />,
      gradient: 'from-yellow-500 to-orange-500',
      glowColor: '#feca57',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 opacity-15">
        <Medical3DBackground />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-gray-900/80 to-black/95" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12"
        >
          <div className="flex items-center space-x-6">
            <Enhanced3DCard
              delay={0.2}
              intensity="subtle"
              className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full overflow-hidden flex-shrink-0 shadow-lg shadow-cyan-500/50"
            >
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-4 text-white" />
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-black" />
            </Enhanced3DCard>

            <div>
              <GlowingText>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Dr. {profileName}
                </h1>
              </GlowingText>
              <p className="text-gray-400 text-lg mt-2">{profileSpecialty || 'Specialist'}</p>
            </div>

            {/* Edit Profile button - you can hook this up to open your EditProfileForm modal */}
            <NeonButton size="sm" className="group">
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </NeonButton>
          </div>

          <NeonButton variant="secondary" size="sm" onClick={logout}>
            <LogOut className="mr-2 w-4 h-4" />
            Logout
          </NeonButton>
        </motion.header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <Enhanced3DCard key={idx} delay={idx * 0.1} glowColor={stat.glowColor} intensity="medium">
              <div className="relative group">
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300`}
                />
                <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      className={`p-3 rounded-full bg-gradient-to-r ${stat.gradient} text-white shadow-lg`}
                      style={{ boxShadow: `0 10px 30px ${stat.glowColor}40` }}
                    >
                      {stat.icon}
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.1 + 0.5, type: 'spring' }}
                      className="text-right"
                    >
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </motion.div>
                  </div>
                  <p className="text-gray-400 text-sm uppercase tracking-wide">{stat.title}</p>
                </div>
              </div>
            </Enhanced3DCard>
          ))}
        </div>

        {/* Tabs */}
        <Enhanced3DCard delay={0.6} intensity="subtle">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden mb-8">
            <div className="flex overflow-x-auto border-b border-gray-700">
              {tabs.map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  className={`flex items-center space-x-3 px-6 py-4 transition-all duration-300 ${
                    activeTab === tab
                      ? 'border-b-2 border-cyan-500 text-cyan-400 bg-cyan-500/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  <span>
                    {{
                      overview: <Activity className="w-5 h-5" />,
                      appointments: <Calendar className="w-5 h-5" />,
                      patients: <Users className="w-5 h-5" />,
                      earnings: <DollarSign className="w-5 h-5" />,
                      messages: <Bell className="w-5 h-5" />,
                      profile: <User className="w-5 h-5" />,
                    }[tab]}
                  </span>
                  <span className="capitalize font-medium">{tab}</span>
                </motion.button>
              ))}
            </div>

            <div className="p-8">
              <AnimatePresence mode="wait">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    <GlowingText>
                      <h2 className="text-3xl font-bold mb-8">Today's Overview</h2>
                    </GlowingText>

                    {/* Weekly Chart */}
                    <Enhanced3DCard delay={0.1} glowColor="#4ade80">
                      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-xl font-semibold mb-4 text-cyan-400">Last 7 Days: Appointments</h3>
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
                              strokeWidth={3}
                              dot={{ r: 4, fill: '#4ade80' }}
                              activeDot={{ r: 6, fill: '#4ade80' }}
                              isAnimationActive={true}
                              animationDuration={2000}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Enhanced3DCard>

                    {/* Monthly Chart */}
                    <Enhanced3DCard delay={0.2} glowColor="#60a5fa">
                      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-xl font-semibold mb-4 text-blue-400">Last 12 Months: Appointments</h3>
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
                              strokeWidth={3}
                              dot={{ r: 4, fill: '#60a5fa' }}
                              activeDot={{ r: 6, fill: '#60a5fa' }}
                              isAnimationActive={true}
                              animationDuration={2000}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Enhanced3DCard>

                    {/* Yearly Chart */}
                    <Enhanced3DCard delay={0.3} glowColor="#facc15">
                      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-xl font-semibold mb-4 text-yellow-400">Last 5 Years: Appointments</h3>
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
                              strokeWidth={3}
                              dot={{ r: 4, fill: '#facc15' }}
                              activeDot={{ r: 6, fill: '#facc15' }}
                              isAnimationActive={true}
                              animationDuration={2000}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Enhanced3DCard>

                    {/* Quick Actions & Recent Appointments */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <Enhanced3DCard delay={0.4}>
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                          <h3 className="text-xl font-semibold mb-4 text-cyan-400">Recent Appointments</h3>
                          <div className="space-y-4">
                            {mockAppointments.slice(0, 3).map((appointment) => (
                              <motion.div
                                key={appointment.id}
                                whileHover={{ x: 10 }}
                                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium text-white">{appointment.patientName}</p>
                                  <p className="text-sm text-gray-400">{format(appointment.date, 'MMM d, h:mm a')}</p>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    appointment.status === 'upcoming'
                                      ? 'bg-yellow-500/20 text-yellow-400'
                                      : 'bg-green-500/20 text-green-400'
                                  }`}
                                >
                                  {appointment.status}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </Enhanced3DCard>

                      <Enhanced3DCard delay={0.5}>
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                          <h3 className="text-xl font-semibold mb-4 text-purple-400">Quick Actions</h3>
                          <div className="space-y-3">
                            <NeonButton className="w-full justify-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              Schedule Appointment
                            </NeonButton>
                            <NeonButton variant="secondary" className="w-full justify-center">
                              <Users className="w-4 h-4 mr-2" />
                              View Patients
                            </NeonButton>
                            <NeonButton variant="success" className="w-full justify-center">
                              <Bell className="w-4 h-4 mr-2" />
                              Check Messages
                            </NeonButton>
                          </div>
                        </div>
                      </Enhanced3DCard>
                    </div>
                  </motion.div>
                )}

                {/* Appointments Tab: embed PatientAdmission */}
                {activeTab === 'appointments' && (
                  <motion.div
                    key="appointments"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <GlowingText>
                      <h2 className="text-3xl font-bold mb-8">Appointments / Patient Admission</h2>
                    </GlowingText>

                    {/* Entire PatientAdmission component rendered here */}
                    <PatientAdmission />
                  </motion.div>
                )}

                {/* Patients Tab */}
                {activeTab === 'patients' && (
                  <motion.div
                    key="patients"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    <GlowingText>
                      <h2 className="text-3xl font-bold mb-6">Patients</h2>
                    </GlowingText>
                    {mockPatients.map((p) => (
                      <Enhanced3DCard key={p.id} delay={0.1}>
                        <div className="bg-gray-800/50 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                              {p.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-100">{p.name}</p>
                              <p className="text-sm text-gray-400">
                                Last visit: {format(p.lastVisit, 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-300 flex-1">Condition: {p.condition}</p>
                          {/* Link or button to view record */}
                          <NeonButton variant="secondary" className="mt-4 w-full justify-center">
                            View Record
                          </NeonButton>
                        </div>
                      </Enhanced3DCard>
                    ))}
                  </motion.div>
                )}

                {/* Earnings Tab */}
                {activeTab === 'earnings' && (
                  <motion.div
                    key="earnings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    <GlowingText>
                      <h2 className="text-3xl font-bold mb-8">Earnings Overview</h2>
                    </GlowingText>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Enhanced3DCard delay={0.1}>
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:shadow-md transition-shadow">
                          <p className="text-sm text-gray-400 uppercase tracking-wide">This Month</p>
                          <p className="mt-2 text-3xl font-bold text-gray-100">${earningsThisMonth}</p>
                        </div>
                      </Enhanced3DCard>
                      <Enhanced3DCard delay={0.2}>
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:shadow-md transition-shadow">
                          <p className="text-sm text-gray-400 uppercase tracking-wide">Total to Date</p>
                          <p className="mt-2 text-3xl font-bold text-gray-100">$32,450</p>
                        </div>
                      </Enhanced3DCard>
                    </div>
                  </motion.div>
                )}

                {/* Messages Tab */}
                {activeTab === 'messages' && (
                  <motion.div
                    key="messages"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <GlowingText>
                      <h2 className="text-3xl font-bold mb-6">Messages</h2>
                    </GlowingText>
                    {mockMessages.map((m) => (
                      <Enhanced3DCard key={m.id} delay={0.1}>
                        <div
                          className={`bg-gray-800/50 rounded-xl shadow-sm p-5 flex justify-between hover:shadow-md transition-shadow ${
                            m.read ? 'border border-gray-700' : 'border-2 border-blue-600 bg-blue-900'
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-gray-100">{m.from}</p>
                            <p className="text-sm text-gray-400 mt-1">{m.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(m.date, 'MMM d, h:mm a')}
                            </p>
                          </div>
                          {!m.read && (
                            <span className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-2"></span>
                          )}
                        </div>
                      </Enhanced3DCard>
                    ))}
                  </motion.div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  >
                    <GlowingText>
                      <h2 className="text-3xl font-bold mb-6">Profile Details</h2>
                    </GlowingText>
                    <Enhanced3DCard delay={0.1}>
                      <div className="bg-gray-800/50 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow flex items-center space-x-6">
                        <div className="w-20 h-20 bg-gray-700 rounded-full overflow-hidden">
                          {profileImageUrl ? (
                            <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-full h-full p-4 text-gray-500" />
                          )}
                        </div>
                        <div className="space-y-3 text-gray-100">
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
                            <p className="font-medium">{profileSpecialty}</p>
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
                            <p className="font-medium">{profileLocation || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Next Available Slot</p>
                            <p className="font-medium">
                              {profileNextAvailable
                                ? new Date(profileNextAvailable).toLocaleString()
                                : 'Not set'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Max Patients per Slot</p>
                            <p className="font-medium">{profileAvailableSlots}</p>
                          </div>
                        </div>
                      </div>
                    </Enhanced3DCard>
                    <Enhanced3DCard delay={0.2}>
                      <div className="bg-gray-800/50 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                        <h3 className="text-xl font-semibold text-gray-100 mb-5">Account Settings</h3>
                        <NeonButton variant="primary" size="sm">
                          <SettingsIcon className="mr-2 w-4 h-4" /> Go to Settings
                        </NeonButton>
                      </div>
                    </Enhanced3DCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Enhanced3DCard>

        {profileError && (
          <div className="mt-4 bg-red-600 text-white p-3 rounded">{profileError}</div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboardEnhanced;
