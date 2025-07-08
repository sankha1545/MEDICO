// File: frontend/src/pages/doctor/DoctorDashboard.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  subDays,
  subMonths,
  subYears,
  startOfMonth,
  startOfYear,
} from 'date-fns';
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
import EditProfileForm from '../../components/common/editprofile/editprofileformsdoc';

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

type TabKey =
  | 'overview'
  | 'appointments'
  | 'patients'
  | 'earnings'
  | 'messages'
  | 'profile'
  | 'payout';
const tabs: TabKey[] = [
  'overview',
  'appointments',
  'patients',
  'earnings',
  'messages',
  'profile',
  'payout',
];

const DoctorDashboardPage: React.FC = () => {
  const {
    user,
    logout,
    fetchDoctorProfile,
    updateDoctorProfile,
  } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken') || '';
  const API_BASE =
    import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api')
      ? `${API_BASE}${path}`
      : `${API_BASE}/api${path}`;

  // --- Logout modal state + handlers ---
  const [isLogoutModalOpen, setIsLogoutModalOpen] =
    useState(false);
  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };
  const confirmLogout = async () => {
    try {
      await logout();
      setIsLogoutModalOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // --- Profile loading & state ---
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileError, setProfileError] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDoctorProfile();
        setProfile(data);
      } catch (err: any) {
        setProfileError(err.message || 'Failed to load profile.');
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  // --- Appointment stats for graphs ---
  const [appointments, setAppointments] = useState<
    DoctorAppointment[]
  >([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          buildUrl('/appointments/doctor/me'),
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAppointments(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setStatsLoading(false);
      }
    })();
  }, []);

  // Build data for Today / Week / Month / Year charts
  const stats = useMemo(() => {
    const now = new Date();
    const groups = {
      today: [] as DoctorAppointment[],
      week: [] as DoctorAppointment[],
      month: [] as DoctorAppointment[],
      year: [] as DoctorAppointment[],
    };
    appointments.forEach((appt) => {
      const apptDate = new Date(appt.date);
      if (
        format(apptDate, 'yyyy-MM-dd') ===
        format(now, 'yyyy-MM-dd')
      )
        groups.today.push(appt);
      if (apptDate > subDays(now, 7)) groups.week.push(appt);
      if (apptDate > startOfMonth(now)) groups.month.push(appt);
      if (apptDate > startOfYear(now)) groups.year.push(appt);
    });
    const makeSeries = (arr: DoctorAppointment[]) =>
      arr.reduce<Record<string, number>>((acc, cur) => {
        const day = format(new Date(cur.date), 'MMM d');
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});
    return {
      today: makeSeries(groups.today),
      week: makeSeries(groups.week),
      month: makeSeries(groups.month),
      year: makeSeries(groups.year),
    };
  }, [appointments]);

  // --- Notifications ---
  const [unreadNotifications, setUnreadNotifications] =
    useState<NotificationItem[]>([]);
  const [allNotifications, setAllNotifications] =
    useState<NotificationItem[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        buildUrl('/notifications/doctor/me'),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const unread = res.data.filter((n: any) => !n.read);
      setAllNotifications(res.data);
      setUnreadNotifications(unread);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markNotificationRead = async (notifId: string) => {
    try {
      await axios.put(
        buildUrl(`/notifications/${notifId}/read`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadNotifications((prev) =>
        prev.filter((n) => n._id !== notifId)
      );
      setAllNotifications((prev) =>
        prev.map((n) =>
          n._id === notifId ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // --- Tab handling ---
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-gray-900">
        Loading profile...
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-900">
        <div className="px-6 py-10 mx-auto max-w-7xl">
          <FadeIn>
            <header className="flex flex-col items-start justify-between mb-10 md:flex-row md:items-center">
              <div>
                <h1 className="text-3xl font-semibold text-white">
                  Welcome, Dr. {profile.name}
                </h1>
                <p className="text-gray-400">
                  {profile.specialty}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogoutClick}
                className="mt-4 md:mt-0"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </header>
          </FadeIn>

          {/* Tabs */}
          <StaggeredContainer
            className="grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-4"
            variants={staggeredItemVariants}
          >
            {tabs.map((tab) => (
              <Link
                key={tab}
                to="#"
                onClick={() => setActiveTab(tab)}
                className={`p-6 bg-gray-800 rounded-xl transition ${
                  activeTab === tab
                    ? 'ring-2 ring-secondary-500'
                    : 'hover:bg-gray-700'
                }`}
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggeredItemVariants}
                >
                  {/* icon + label */}
                  <div className="flex items-center mb-2 space-x-3">
                    {{
                      overview: (
                        <Activity className="w-6 h-6 text-secondary-400" />
                      ),
                      appointments: (
                        <Calendar className="w-6 h-6 text-secondary-400" />
                      ),
                      patients: (
                        <Users className="w-6 h-6 text-secondary-400" />
                      ),
                      earnings: (
                        <DollarSign className="w-6 h-6 text-secondary-400" />
                      ),
                      messages: (
                        <Bell className="w-6 h-6 text-secondary-400" />
                      ),
                      profile: (
                        <UserIcon className="w-6 h-6 text-secondary-400" />
                      ),
                      payout: (
                        <SettingsIcon className="w-6 h-6 text-secondary-400" />
                      ),
                    }[tab]}
                    <span className="font-medium text-white capitalize">
                      {tab}
                    </span>
                  </div>
                  {/* count / summary */}
                  <p className="text-2xl font-bold text-white">
                    {{
                      overview: appointments.length,
                      appointments: appointments.length,
                      patients: profile.patientCount,
                      earnings: `$${profile.totalEarnings}`,
                      messages: unreadNotifications.length,
                      profile: '—',
                      payout: '—',
                    }[tab]}
                  </p>
                </motion.div>
              </Link>
            ))}
          </StaggeredContainer>

          {/* Content */}
          <div className="p-6 bg-gray-800 rounded-xl">
            {activeTab === 'overview' && (
              <StaggeredContainer>
                {/* Today’s Chart */}
                <SlideIn direction="up">
                  <h2 className="mb-4 text-xl font-semibold text-white">
                    Today’s Appointments
                  </h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={Object.entries(stats.today).map(([day, count]) => ({ day, count }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#4ade80"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                        isAnimationActive
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </SlideIn>
                {/* Monthly & Yearly similarly... */}
              </StaggeredContainer>
            )}

            {activeTab === 'appointments' && (
              <SlideIn direction="up">
                <h2 className="mb-4 text-xl font-semibold text-white">
                  Recent Appointments
                </h2>
                <div className="space-y-4">
                  {appointments.slice(0, 5).map((appt) => (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="text-white">
                          {appt.patientName}
                        </p>
                        <p className="text-sm text-gray-400">
                          {format(new Date(appt.date), 'PPpp')}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          {
                            upcoming: 'bg-blue-600',
                            completed: 'bg-green-600',
                            pending: 'bg-yellow-600',
                            cancelled: 'bg-red-600',
                          }[appt.status]
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </SlideIn>
            )}

            {/* Other tabs’ content omitted for brevity but remain unchanged: patients, earnings, messages, profile (with <EditProfileForm>), payout. */}
          </div>
        </div>
      </div>

      {profileError && (
        <div className="p-3 mt-4 text-white bg-red-600 rounded">
          {profileError}
        </div>
      )}

      {/* --- Logout Confirmation Modal --- */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm p-6 bg-white shadow-xl rounded-2xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h2 className="mb-4 text-lg font-semibold">
                Confirm Logout
              </h2>
              <p className="mb-6">
                Are you sure you want to logout?
              </p>
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    setIsLogoutModalOpen(false)
                  }
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmLogout}
                >
                  Logout
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DoctorDashboardPage;
