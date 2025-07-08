// File: frontend/src/pages/docdashboardpage.tsx

import React, { useState, useEffect, useMemo, useRef, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  subDays,
  subMonths,
  subYears,
  startOfMonth,
} from 'date-fns';
import {
  Calendar,
  Users,
  DollarSign,
  Bell,
  Pencil,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';

import ThreeBackground from '../../components/animations/doctor/ThreeBackground';
import FloatingNavbar from '../../components/animations/doctor/FloatingNavbar';
import StatsCard from '../../components/animations/doctor/StatsCard';
import AnimatedChart from '../../components/animations/doctor/AnimatedChart';
import ProfileAvatar3D from '../../components/animations/doctor/ProfileAvatar3D';
import EditProfileForm, {
  LocationType,
} from '../../components/common/editprofile/editprofileformsdoc';

interface DoctorAppointment {
  id: string;
  patientName: string;
  date: string;
  status: 'upcoming' | 'completed' | 'pending' | 'cancelled';
}

interface NotificationItem {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

type TabKey =
  | 'overview'
  | 'appointments'
  | 'patients'
  | 'earnings'
  | 'messages'
  | 'profile'
  | 'payout';

export default function DocDashboardPage() {
  const { user, logout, fetchDoctorProfile, updateDoctorProfile } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken') || '';
  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api') ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;

  /*** State ***/
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Profile fields
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileSpecialty, setProfileSpecialty] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string>();
  const [profileExperience, setProfileExperience] = useState('');
  const [profileLocationData, setProfileLocationData] = useState<LocationType | null>(null);
  const [profileLocation, setProfileLocation] = useState('');
  const [profileConsultationFee, setProfileConsultationFee] = useState(0);

  // Appointments & notifications
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Payout
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIFSC, setBankIFSC] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutStatusMsg, setPayoutStatusMsg] = useState<string | null>(null);
  const [existingPayoutAccountId, setExistingPayoutAccountId] = useState<string | null>(null);

  const fetchedProfileRef = useRef(false);

  /*** Handlers ***/
  const handleLogout = () => setIsLogoutModalOpen(true);
  const confirmLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSaveProfile = async (
    name: string,
    email: string,
    specialty: string,
    file: File | null,
    experience: string,
    location: string,
    fee: number
  ) => {
    setProfileError('');
    try {
      const updated = await updateDoctorProfile({
        name,
        email,
        specialty,
        profileImageFile: file,
        experience,
        location,
        consultationFee: fee,
      });

      // Update profile state
      setProfileName(updated.name);
      setProfileEmail(updated.email);
      setProfileSpecialty(updated.specialty || '');
      setProfileExperience(updated.experience || '');
      setProfileConsultationFee(updated.consultationFee ?? 0);

      const loc = updated.location as LocationType | undefined;
      if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        setProfileLocationData(loc);
        setProfileLocation(loc.address);
      }

      setProfileImageUrl(
        file ? URL.createObjectURL(file) : updated.profileImageUrl || undefined
      );
      setShowEditProfile(false);
    } catch (err: any) {
      console.error('Save Profile Error:', err);
      setProfileError(err.message || 'Failed to save profile');
    }
  };

  const handleAddPayoutAccount = async (e: FormEvent) => {
    e.preventDefault();
    setPayoutLoading(true);
    setPayoutStatusMsg(null);
    try {
      const resp = await axios.post(
        buildUrl('/medical/doctor/payout-account'),
        {
          accountHolderName: bankAccountName.trim(),
          accountNumber: bankAccountNumber.trim(),
          ifsc: bankIFSC.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = resp.data;
      setExistingPayoutAccountId(data.fundAccountId || data.razorpayAccountId);
      setPayoutStatusMsg('Payout account added successfully.');
      setBankAccountName('');
      setBankAccountNumber('');
      setBankIFSC('');
    } catch (err: any) {
      console.error('Payout Error:', err);
      setPayoutStatusMsg(err.message || 'Failed to add payout account');
    } finally {
      setPayoutLoading(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await axios.put(
        buildUrl(`/notifications/${id}/read`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('Mark Read Error:', err);
    }
  };

  /*** Data Fetching ***/
  useEffect(() => {
    async function loadProfile() {
      if (user?.role === 'doctor' && !fetchedProfileRef.current) {
        fetchedProfileRef.current = true;
        setLoadingProfile(true);
        try {
          const prof = await fetchDoctorProfile();
          setProfileName(prof.name);
          setProfileEmail(prof.email);
          setProfileSpecialty(prof.specialty || '');
          setProfileImageUrl(prof.profileImageUrl || undefined);
          setProfileExperience(prof.experience || '');
          setProfileConsultationFee(prof.consultationFee ?? 0);
          const loc = prof.location as LocationType | undefined;
          if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
            setProfileLocationData(loc);
            setProfileLocation(loc.address);
          }
          setExistingPayoutAccountId((prof as any).razorpayAccountId || null);
        } catch (err: any) {
          console.error('Profile Load Error:', err);
          setProfileError(err.message || 'Failed to load profile');
        } finally {
          setLoadingProfile(false);
        }
      }
    }
    loadProfile();
  }, [user, fetchDoctorProfile]);

  useEffect(() => {
    async function loadAppointments() {
      if (!token) return;
      try {
        const resp = await axios.get<DoctorAppointment[]>(
          buildUrl('/appointments/doctor'),
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = resp.data || [];
        setAppointments(data);
        setUpcomingCount(
          data.filter((a) => a.status === 'upcoming' && new Date(a.date) > new Date()).length
        );
      } catch (err) {
        console.error('Appointments Error:', err);
      }
    }
    if (['overview', 'appointments', 'earnings'].includes(activeTab)) {
      loadAppointments();
    }
  }, [activeTab, token]);

  useEffect(() => {
    async function loadNotifications() {
      if (!token) return;
      try {
        const resp = await axios.get<NotificationItem[]>(
          buildUrl('/notifications'),
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = resp.data || [];
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      } catch (err) {
        console.error('Notifications Error:', err);
      }
    }
    if (['overview', 'appointments'].includes(activeTab)) {
      loadNotifications();
    }
  }, [activeTab, token]);

  /*** Chart Data ***/
  const weeklyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const day = subDays(now, 6 - i);
      return {
        date: format(day, 'MMM d'),
        count: appointments.filter(
          (a) =>
            format(new Date(a.date), 'yyyy-MM-dd') ===
            format(day, 'yyyy-MM-dd')
        ).length,
      };
    });
  }, [appointments]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }).map((_, i) => {
      const m = subMonths(now, 11 - i);
      return {
        month: format(m, 'MMM yyyy'),
        count: appointments.filter(
          (a) =>
            format(new Date(a.date), 'yyyy-MM') ===
            format(m, 'yyyy-MM')
        ).length,
      };
    });
  }, [appointments]);

  const yearlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 5 }).map((_, i) => {
      const y = subYears(now, 4 - i);
      return {
        year: format(y, 'yyyy'),
        count: appointments.filter(
          (a) =>
            format(new Date(a.date), 'yyyy') ===
            format(y, 'yyyy')
        ).length,
      };
    });
  }, [appointments]);

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-gray-900">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <ThreeBackground activeTab={activeTab} />

      <FloatingNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        upcomingCount={upcomingCount}
        unreadCount={unreadCount}
        onLogout={handleLogout}
      />

      <div className="px-6 pt-24 pb-12 mx-auto max-w-7xl">
        {/* Header Avatar & Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center mb-16 space-y-4"
        >
          <ProfileAvatar3D
            imageUrl={profileImageUrl}
            name={profileName}
            size={150}
          />

          <motion.h1
            className="text-6xl font-bold text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Welcome Back, Dr. {profileName}
          </motion.h1>

          <motion.button
            onClick={() => setShowEditProfile(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center px-4 py-2 text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl"
          >
            <Pencil className="w-5 h-5 mr-2" /> Edit Profile
          </motion.button>
        </motion.div>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {showEditProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="w-full max-w-lg p-8 bg-gray-800 rounded-2xl"
              >
                <EditProfileForm
                  currentName={profileName}
                  currentEmail={profileEmail}
                  currentSpecialty={profileSpecialty}
                  currentProfileImageUrl={profileImageUrl}
                  currentExperience={profileExperience}
                  currentLocation={profileLocationData}
                  currentConsultationFee={profileConsultationFee}
                  onCancel={() => setShowEditProfile(false)}
                  onSave={handleSaveProfile}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-8 mb-16 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Upcoming Appointments"
            value={upcomingCount}
            icon={Calendar}
            gradient="from-blue-500 to-cyan-500"
            delay={0.1}
            glowColor="blue"
          />
          <StatsCard
            title="Total Patients"
            value={new Set(appointments.map((a) => a.patientName)).size}
            icon={Users}
            gradient="from-green-500 to-emerald-500"
            delay={0.2}
            glowColor="green"
          />
          <StatsCard
            title="Monthly Earnings"
            value={`₹${(
              appointments.length * profileConsultationFee
            ).toLocaleString()}`}
            icon={DollarSign}
            gradient="from-yellow-500 to-orange-500"
            delay={0.3}
            glowColor="yellow"
          />
          <StatsCard
            title="Notifications"
            value={unreadCount}
            icon={Bell}
            gradient="from-purple-500 to-pink-500"
            delay={0.4}
            glowColor="purple"
          />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <AnimatedChart
                  data={weeklyData}
                  title="Weekly Appointments"
                  dataKey="count"
                  xAxisKey="date"
                  color="cyan"
                  delay={0.1}
                  type="area"
                />
                <AnimatedChart
                  data={monthlyData}
                  title="Monthly Trends"
                  dataKey="count"
                  xAxisKey="month"
                  color="purple"
                  delay={0.3}
                  type="line"
                />
              </div>
              <AnimatedChart
                data={yearlyData}
                title="Yearly Trends"
                dataKey="count"
                xAxisKey="year"
                color="pink"
                delay={0.5}
                type="line"
              />
            </motion.div>
          )}

          {activeTab === 'appointments' && (
            <motion.div
              key="appointments"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white">Appointments</h2>
              <ul className="space-y-2">
                {appointments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-xl"
                  >
                    <div>
                      <p className="text-white">{a.patientName}</p>
                      <p className="text-gray-400">
                        {format(new Date(a.date), 'PPP p')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        a.status === 'upcoming'
                          ? 'bg-blue-600 text-white'
                          : a.status === 'completed'
                          ? 'bg-green-600 text-white'
                          : a.status === 'pending'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {a.status}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {activeTab === 'patients' && (
            <motion.div
              key="patients"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white">Patients</h2>
              <ul className="space-y-2">
                {Array.from(new Set(appointments.map((a) => a.patientName))).map((name) => (
                  <li
                    key={name}
                    className="p-4 text-white bg-gray-800 rounded-xl"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {activeTab === 'earnings' && (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white">Earnings</h2>
              <p className="text-white">
                Total appointments: {appointments.length}
              </p>
              <p className="text-white">
                Total earnings: ₹{(appointments.length * profileConsultationFee).toLocaleString()}
              </p>
            </motion.div>
          )}

          {activeTab === 'messages' && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
              <ul className="space-y-2"> 
                {notifications.map((n) => (
                  <li
                    key={n._id}
                    className={`p-4 rounded-xl flex justify-between items-center ${
                      n.read ? 'bg-gray-700 text-gray-300' : 'bg-gray-800 text-white'
                    }`}
                  >
                    <span>{n.message}</span>
                    {!n.read && (
                      <button
                        onClick={() => markNotificationRead(n._id)}
                        className="ml-4 text-blue-400 hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="p-8 space-y-4 text-white bg-gray-800 rounded-2xl"
            >
              <h2 className="text-3xl font-bold">My Profile</h2>
              <div className="flex items-center space-x-6">
                <ProfileAvatar3D
                  imageUrl={profileImageUrl}
                  name={profileName}
                  size={100}
                />
                <div className="space-y-2">
                  <p><strong>Name:</strong> {profileName}</p>
                  <p><strong>Email:</strong> {profileEmail}</p>
                  <p><strong>Specialty:</strong> {profileSpecialty}</p>
                  <p><strong>Experience:</strong> {profileExperience} years</p>
                  <p><strong>Location:</strong> {profileLocation}</p>
                  <p><strong>Consultation Fee:</strong> ₹{profileConsultationFee.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'payout' && (
            <motion.div
              key="payout"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white">Payout Account</h2>
              {existingPayoutAccountId ? (
                <p className="text-white">Account ID: {existingPayoutAccountId}</p>
              ) : (
                <form onSubmit={handleAddPayoutAccount} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Account Holder Name"
                    value={bankAccountName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setBankAccountName(e.target.value)
                    }
                    required
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={bankAccountNumber}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setBankAccountNumber(e.target.value)
                    }
                    required
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="IFSC Code"
                    value={bankIFSC}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setBankIFSC(e.target.value)
                    }
                    required
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-xl"
                  />
                  <button
                    type="submit"
                    disabled={payoutLoading}
                    className="px-6 py-2 text-white bg-indigo-600 rounded-xl disabled:opacity-50"
                  >
                    {payoutLoading ? 'Adding...' : 'Add Account'}
                  </button>
                  {payoutStatusMsg && <p className="text-white">{payoutStatusMsg}</p>}
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="w-full max-w-md p-8 border bg-black/80 backdrop-blur-xl border-white/20 rounded-3xl"
            >
              <h3 className="mb-4 text-2xl font-bold text-white">
                Confirm Logout
              </h3>
              <p className="mb-6 text-gray-300">
                Are you sure you want to logout?
              </p>
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 py-3 font-medium text-white bg-gray-600 hover:bg-gray-500 rounded-xl"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmLogout}
                  className="flex-1 py-3 font-medium text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-xl"
                >
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {profileError && (
        <div className="max-w-3xl p-3 mx-auto mt-4 text-white bg-red-600 rounded">
          {profileError}
        </div>
      )}
    </div>
  );
}
