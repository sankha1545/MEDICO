
// File: frontend/src/pages/patient/DashboardPage1.tsx

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Activity,
  FileText,
  Bell,
  CheckCircle,
  AlertTriangle,
  User as UserIcon,
  TrendingUp,
  Heart,
  
  Award,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../../components/common/Button';
import EditProfileForm from '../../components/common/editprofile/editprofileforms';
import UpdateMedicalInfoForm, {
  MedicalInfo,
} from '../../components/common/medicalinfo/UpdateMedicalInfoForm';
import Chatbot from '../../components/common/chatbot/chatbot';
import { BackgroundAnimation } from '../../components/animations/BackGroundAnimations';

// Framer Motion variants
const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};
const fadeInUp = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};
const cardHover = {
  scale: 1.05, y: -10, boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
  transition: { duration: 0.3, ease: 'easeOut' },
};
const glowEffect = {
  boxShadow: [
    '0 0 20px rgba(59, 130, 246, 0.3)',
    '0 0 40px rgba(59, 130, 246, 0.5)',
    '0 0 20px rgba(59, 130, 246, 0.3)',
  ],
  transition: { duration: 2, repeat: Infinity },
};
const tabContentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.4 } },
};

interface AppointmentItem {
  _id: string;
  doctor: {
    _id: string;
    name: string;
    specialty?: string;
    profileImageUrl?: string;
  };
  datetime: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  type?: 'video' | 'in-person';
}

interface NotificationItem {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  fileUrl?: string;    // NEW field for prescription PDF URL
}

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  count?: number;
}

const Tab: React.FC<TabProps> = ({ label, isActive, onClick, icon, count }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.98 }}
    className={`relative flex items-center space-x-3 px-6 py-3 rounded-2xl transition-all duration-300 ${
      isActive
        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
        : 'text-gray-400 hover:bg-white/10 hover:text-white backdrop-blur-sm'
    }`}
  >
    <motion.span animate={isActive ? { rotate: [0, 10, 0] } : {}} transition={{ duration: 0.5 }} className={isActive ? 'text-white' : 'text-gray-400'}>
      {icon}
    </motion.span>
    <span className={isActive ? 'text-white font-medium' : 'font-medium'}>{label}</span>
    {count && count > 0 && (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full -top-2 -right-2"
      >
        {count}
      </motion.span>
    )}
  </motion.button>
);

const DashboardPage1: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken') || '';
  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api') ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;

  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'notifications' | 'profile'>('overview');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showUpdateMedical, setShowUpdateMedical] = useState(false);
 const [showAllNotifications, setShowAllNotifications] = useState(false);
const [draggedId, setDraggedId] = useState<string | null>(null);
const [draggedPositions, setDraggedPositions] = useState<Record<string, number>>({});
  // Medical info state
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>({
    bloodType: '',
    allergies: '',
    currentMedications: '',
    medicalConditions: '',
  });




  // Data
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
 const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedAppt, setSelectedAppt] = useState<AppointmentItem | null>(null);
const [modalStatus, setModalStatus] = useState<AppointmentItem['status']>('pending');
const [completedVisits, setCompletedVisits] = useState<number>(0);


  const api = axios.create({
  baseURL: '/api',              // Vite will proxy /api → http://localhost:4000/api
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('authToken');
  if (t && cfg.headers) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

  // Fetch medical info
    useEffect(() => {
  if (!token) return;
  (async () => {
    try {
      const res = await api.get<MedicalInfo>('/medicalinfo/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMedicalInfo(res.data);
    } catch {
      setMedicalInfo({ user: user?.id || '', bloodType: '', allergies: '', currentMedications: '', medicalConditions: '' });
    }
  })();
}, [token]);

  


  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!token) return;
      setLoadingAppointments(true);
      try {
        const resp = await axios.get(buildUrl('/appointments'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(resp.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAppointments(false);
      }
    };
    if (['overview', 'appointments'].includes(activeTab)) {
      fetchAppointments();
    }
  }, [activeTab, token]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;
      setLoadingNotifications(true);
      try {
        const resp = await axios.get(buildUrl('/notifications'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const nots: NotificationItem[] = resp.data;
        nots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(nots);
        setUnreadCount(nots.filter((n) => !n.read).length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingNotifications(false);
      }
    };
    if (['overview', 'notifications'].includes(activeTab)) {
      fetchNotifications();
    }
  }, [activeTab, token]);

  useEffect(() => {
  document.body.style.overflow = isModalOpen ? 'hidden' : 'auto';
  return () => { document.body.style.overflow = 'auto'; };
}, [isModalOpen]);

// 2️⃣ Handler to send status update & bump completed‐visits
const handleStatusSubmit = async () => {
  if (!selectedAppt) return;

  try {
    // Use api (baseURL '/api') so this becomes PUT /api/appointments/:id/status
    const res = await api.put<{ appointment: AppointmentItem }>(
      `/appointments/${selectedAppt._id}/status`,
      { status: modalStatus }
    );

    // Update local list
    setAppointments((prev) =>
      prev.map((a) =>
        a._id === selectedAppt._id ? { ...a, status: modalStatus } : a
      )
    );

    // Bump completedVisits if appropriate
    if (modalStatus === 'completed') {
      setCompletedVisits((c) => c + 1);
    }

    closeModal();
  } catch (err) {
    console.error('Status update failed', err);
    // You can also show a toast here
  }
};

  // Profile save
  const handleProfileSave = async (updated: { name?: string; email?: string; phone?: string; dob?: string }) => {
    try {
      await updateProfile(updated);
      setShowEditProfile(false);
    } catch (err: any) {
      alert(err.message);
    }
  };
const handleDeleteNotification = async (id: string) => {
  try {
    await axios.delete(buildUrl(`/notifications/${id}`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(prev => prev.filter(n => n._id !== id));
    setDraggedId(null);
  } catch (err) {
    console.error('Failed to delete notification', err);
  }
};
function openDetails(appt: AppointmentItem) {
  setSelectedAppt(appt);
  setModalStatus(appt.status);
  setIsModalOpen(true);
}

function closeModal() {
  setIsModalOpen(false);
  setSelectedAppt(null);
}

function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
  setModalStatus(e.target.value as AppointmentItem['status']);
  // TODO: sync status back to server if needed
}

  // Medical save
 const handleMedicalSave = async (updated: MedicalInfo) => {
    if (!token) {
      alert('Not authenticated');
      return;
    }
    try {
      const res = await api.put<MedicalInfo>('/medicalinfo/me', updated);
      setMedicalInfo(res.data);
      setShowUpdateMedical(false);
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // Upcoming/completed counts
  const now = new Date();
  const upcomingAppointments = appointments.filter((a) => new Date(a.datetime) > now && a.status === 'scheduled');
  const completedAppointments = appointments.filter((a) => a.status === 'completed');
  const upcomingCount = upcomingAppointments.length;
  const completedCount = completedAppointments.length;

 
 



  // Mark notification read
  const markAsRead = async (id: string) => {
    try {
      await axios.put(buildUrl(`/notifications/${id}/read`), {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(c - 1, 0));
    } catch (err) {
      console.error(err);
    }
  };



  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundAnimation />
      <main className="relative z-10 min-h-screen overflow-y-auto text-gray-100">
        <div className="px-6 py-10 mx-auto max-w-7xl sm:px-8 lg:px-10">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
            {/* Header */}
            <motion.header variants={fadeInUp} className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <motion.h1
                    className="mb-2 text-5xl font-bold text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text"
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                    transition={{ duration: 5, repeat: Infinity }}
                  >
                    Welcome back, {user?.name}
                  </motion.h1>
                  <motion.p className="text-lg text-gray-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    Your health journey continues here
                  </motion.p>
                </div>
               
              </div>
            </motion.header>

            {/* Stats Cards */}
            <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: 'Upcoming Appointments',
                  value: upcomingCount.toString(),
                  icon: <Calendar size={28} className="text-blue-400" />,
                  gradient: 'from-blue-500/20 to-cyan-500/20',
                  border: 'border-blue-400/30',
                  change: `${upcomingCount} upcoming`,
                },
                {
                  title: 'Completed Visits',
                  value: completedCount.toString(),
                  icon: <CheckCircle size={28} className="text-emerald-400" />,
                  gradient: 'from-emerald-500/20 to-green-500/20',
                  border: 'border-emerald-400/30',
                  change: `${completedCount} completed`,
                },
                {
                  title: 'Health Score',
                  value: '94%',
                  icon: <Heart size={28} className="text-pink-400" />,
                  gradient: 'from-pink-500/20 to-rose-500/20',
                  border: 'border-pink-400/30',
                  change: '+5% improved',
                },
                {
                  title: 'Active Notifications',
                  value: unreadCount.toString(),
                  icon: <Bell size={28} className="text-purple-400" />,
                  gradient: 'from-purple-500/20 to-indigo-500/20',
                  border: 'border-purple-400/30',
                  change: `${unreadCount} unread`,
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileHover={cardHover}
                  className={`relative bg-white/5 backdrop-blur-xl rounded-3xl border ${stat.border} p-6 overflow-hidden group`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`}
                  />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                        {stat.icon}
                      </motion.div>
                      <motion.div
                        className="flex items-center text-xs text-gray-300"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        <TrendingUp size={12} className="mr-1" />
                        {stat.change}
                      </motion.div>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-gray-300">{stat.title}</p>
                      <motion.p
                        className="text-3xl font-bold text-white"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 200 }}
                      >
                        {stat.value}
                      </motion.p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Tabs */}
            <motion.div variants={fadeInUp} className="overflow-hidden border bg-white/5 backdrop-blur-xl rounded-2xl border-white/10">
              <div className="border-b border-white/10">
                <div className="flex p-6 space-x-4 overflow-x-auto">
                  <Tab label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Activity size={20} />} />
                 <Tab label = "Appointments" isActive={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} icon ={<Calendar size={20} />} />
                  <Tab label="Notifications" isActive={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={<Bell size={20} />} count={unreadCount} />
                  <Tab label="Profile" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon size={20} />} />
                </div>
              </div>

              <div className="p-8">
                <AnimatePresence mode="wait" initial={false}>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <motion.div key="overview" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-10">
                      {/* Quick Actions */}
                      <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {[/* ... same quick actions ... */].map((action, idx) => (
                          <motion.div
                            key={idx}
                            variants={fadeInUp}
                            whileHover={{ scale: 1.05, y: -5 }}
                            className={`relative p-6 rounded-2xl bg-gradient-to-br ${action.color} bg-opacity-10 border border-white/10 cursor-pointer group overflow-hidden`}
                            onClick={() => navigate(action.action)}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                            <div className="relative z-10">
                              <div className="mb-3 text-white">{action.icon}</div>
                              <h3 className="mb-2 text-lg font-semibold text-white">{action.title}</h3>
                              <p className="text-sm text-gray-300">{action.description}</p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>

                      {/* Upcoming Appointments */}
                      <motion.div variants={fadeInUp}>
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-2xl font-semibold text-white">Upcoming Appointments</h2>
                          
                        </div>
                        <div className="space-y-4">
                          {loadingAppointments ? (
                            <p className="text-gray-300">Loading...</p>
                          ) : upcomingAppointments.length > 0 ? (
                            upcomingAppointments.map((appt, idx) => {
                              const dt = new Date(appt.datetime);
                              const imgUrl = appt.doctor.profileImageUrl || '';
                              return (
                                <motion.div
                                  key={appt._id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  whileHover={cardHover}
                                  className="flex items-center p-6 border bg-white/5 backdrop-blur-sm border-white/10 rounded-2xl group"
                                >
                                  {imgUrl ? (
                                    <motion.img
                                      src={imgUrl}
                                      alt={appt.doctor.name}
                                      className="object-cover w-16 h-16 mr-6 border-2 rounded-full border-blue-400/30"
                                      whileHover={{ scale: 1.1 }}
                                    />
                                  ) : (
                                    <motion.div className="flex items-center justify-center w-16 h-16 mr-6 bg-gray-700 rounded-full">
                                      <UserIcon className="text-gray-400" />
                                    </motion.div>
                                  )}
                                  <div className="flex-1">
                                    <h3 className="mb-1 text-lg font-medium text-white">{appt.doctor.name}</h3>
                                    {appt.doctor.specialty && <p className="mb-2 text-blue-400">{appt.doctor.specialty}</p>}
                                    <div className="flex items-center space-x-4 text-sm text-gray-300">
                                      <span className="flex items-center"><Calendar size={14} className="mr-1" />{format(dt, 'MMM d, yyyy')}</span>
                                      <span className="flex items-center"><Clock size={14} className="mr-1" />{format(dt, 'h:mm a')}</span>
                                      {appt.type && (
                                        <span className={`px-2 py-1 rounded-full text-xs ${appt.type === 'video' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                          {appt.type === 'video' ? 'Video Call' : 'In-Person'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="gradient"
                                    size="sm"
                                    onClick={() => {
                                      if (appt.type === 'video') navigate(`/appointments/${appt._id}/join`);
                                      else navigate(`/appointments/${appt._id}`);
                                    }}
                                  >
                                    {appt.type === 'video' ? 'Join Call' : ''}
                                  </Button>
                                </motion.div>
                              );
                            })
                          ) : (
                            <p className="text-gray-300">No upcoming appointments.</p>
                          )}
                        </div>
                      </motion.div>

                      {/* Recent Notifications */}
                      <motion.div variants={fadeInUp}>
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-2xl font-semibold text-white">Recent Activity</h2>
                          
                        </div>
                        <div className="space-y-3">
                          {loadingNotifications ? (
                            <p className="text-gray-300">Loading...</p>
                          ) : notifications.slice(0, 3).map((notification, idx) => {
                            const dateObj = new Date(notification.createdAt);
                            let iconNode: React.ReactNode = <AlertTriangle size={18} />;
                            let bgClass = 'bg-purple-500/20 text-purple-400';
                            if (notification.type === 'appointment_requested') {
                              iconNode = <Calendar size={18} />;
                              bgClass = 'bg-blue-500/20 text-blue-400';
                            } else if (notification.type === 'payment_received' || notification.type === 'reminder') {
                              iconNode = <Bell size={18} />;
                              bgClass = 'bg-blue-500/20 text-blue-400';
                            } else if (notification.type === 'achievement') {
                              iconNode = <Award size={18} />;
                              bgClass = 'bg-yellow-500/20 text-yellow-400';
                            } else if (notification.type === 'prescription') {
                              // NEW: prescription notification
                              iconNode = <FileText size={18} />;
                              bgClass = 'bg-emerald-500/20 text-emerald-400';
                            } else if (notification.type === 'payment_success' || notification.type === 'medical') {
                              iconNode = <FileText size={18} />;
                              bgClass = 'bg-emerald-500/20 text-emerald-400';
                            }
                            return (
                              <motion.div
                                key={notification._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ scale: 1.02, x: 5 }}
                                className={`flex items-center p-4 rounded-xl transition-all duration-300 ${
                                  notification.read ? 'bg-white/5 border border-white/10' : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30'
                                }`}
                              >
                                <motion.div whileHover={{ rotate: 10, scale: 1.1 }} className={`p-3 rounded-full mr-4 flex-shrink-0 ${bgClass}`}>
                                  {iconNode}
                                </motion.div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <h4 className="text-sm font-medium text-white">
                                      {notification.type === 'appointment_requested'
                                        ? 'Appointment Requested'
                                        : notification.type === 'payment_received'
                                        ? 'Payment Received'
                                        : notification.type === 'prescription'
                                        ? 'New Prescription'
                                        : notification.type === 'achievement'
                                        ? 'Achievement'
                                        : notification.type === 'reminder'
                                        ? 'Reminder'
                                        : 'Notification'}
                                    </h4>
                                    <span className="text-xs text-gray-400">{format(dateObj, 'MMM d, yyyy')}</span>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-300">{notification.message}</p>
                                  {/* NEW: download link for prescription */}
                                  {notification.fileUrl && notification.type === 'prescription' && (
                                    <a
                                      href={notification.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block mt-2 text-sm text-emerald-400 hover:underline"
                                    >
                                      Download Prescription
                                    </a>
                                  )}
                                </div>
                                {!notification.read && (
                                  <motion.div animate={glowEffect} className="w-3 h-3 ml-3 bg-blue-500 rounded-full" />
                                )}
                              </motion.div>
                            );
                          })}
                          {notifications.length === 0 && <p className="text-gray-300">No recent activity.</p>}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Appointments Tab */}
                  {activeTab === 'appointments' && (
  <motion.div
    key="appointments"
    variants={tabContentVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="text-white"
  >
    {/* Header */}
    <motion.div variants={fadeInUp} className="py-20 text-center">
      <Calendar size={64} className="mx-auto mb-4 text-blue-400" />
      <h3 className="mb-2 text-2xl font-semibold">Appointments</h3>
      <p className="text-gray-300">Manage your upcoming and past appointments</p>
    </motion.div>

    {/* List */}
    <motion.div variants={fadeInUp} className="space-y-6">
      {loadingAppointments ? (
        <p className="text-gray-300">Loading appointments...</p>
      ) : appointments.length > 0 ? (
        appointments.map((appt) => {
          const dt = new Date(appt.datetime);
          const imgUrl = appt.doctor.profileImageUrl || '';
          const statusLabel = appt.status.charAt(0).toUpperCase() + appt.status.slice(1);

          return (
            <motion.div
              key={appt._id}
              variants={fadeInUp}
              whileHover={cardHover}
              className="flex items-center p-6 border bg-white/5 backdrop-blur-sm border-white/10 rounded-2xl"
            >
              {/* Avatar */}
              {imgUrl ? (
                <motion.img
                  src={imgUrl}
                  alt={appt.doctor.name}
                  className="object-cover w-16 h-16 mr-6 border-2 rounded-full border-blue-400/30"
                />
              ) : (
                <motion.div className="flex items-center justify-center w-16 h-16 mr-6 bg-gray-700 rounded-full">
                  <UserIcon className="text-gray-400" />
                </motion.div>
              )}

              {/* Summary */}
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-medium text-white">{appt.doctor.name}</h3>
                {appt.doctor.specialty && (
                  <p className="mb-2 text-blue-400">{appt.doctor.specialty}</p>
                )}
                <div className="mb-1 text-xs text-gray-400">Status: {statusLabel}</div>
              </div>

              {/* Actions */}
              <Button
                variant="gradient"
                size="sm"
                onClick={() => openDetails(appt)}
              >
                Details
              </Button>
            </motion.div>
          );
        })
      ) : (
        <p className="text-gray-300">No appointments found.</p>
      )}
    </motion.div>

    {/* Centered Details Modal */}
<AnimatePresence>
      {isModalOpen && selectedAppt && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md p-8 bg-white shadow-2xl bg-opacity-20 backdrop-blur-md rounded-2xl perspective-1000 transform-style-preserve-3d"
            style={{ transformStyle: 'preserve-3d' }}
            initial={{ rotateX: 90, scale: 0.5, opacity: 0 }}
            animate={{ rotateX: 0, scale: 1, opacity: 1 }}
            exit={{ rotateX: 90, scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <h3 className="mb-6 text-2xl font-extrabold tracking-wide text-center text-white">
              Appointment Details
            </h3>
            <div className="space-y-4 text-white">
              <div>
                <span className="font-semibold">Doctor:</span>{' '}
                {selectedAppt.doctor.name}
              </div>
              {selectedAppt.doctor.specialty && (
                <div>
                  <span className="font-semibold">Field:</span>{' '}
                  {selectedAppt.doctor.specialty}
                </div>
              )}
              <div>
                <span className="font-semibold">Date:</span>{' '}
                {format(new Date(selectedAppt.datetime), 'PPP')}
              </div>
              <div>
                <span className="font-semibold">Time:</span>{' '}
                {format(new Date(selectedAppt.datetime), 'h:mm a')}
              </div>
              <div>
                <label className="block mb-1 font-medium">Status</label>
                <select
                  value={modalStatus}
                  onChange={handleStatusChange}
                  className="w-full px-4 py-2 text-white transition border-2 rounded-lg border-white/30 bg-white/10 focus:outline-none focus:border-blue-400"
                >
                  <option className="text-black bg-white/90" value="pending">
                    Pending
                  </option>
                  <option className="text-black bg-white/90" value="scheduled">
                    Upcoming
                  </option>
                  <option className="text-black bg-white/90" value="cancelled">
                    Cancelled
                  </option>
                  <option className="text-black bg-white/90" value="completed">
                    Completed
                  </option>
                </select>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={closeModal}
                className="px-6 py-2 font-semibold text-white transition transform bg-gray-300 bg-opacity-50 rounded-full shadow hover:scale-105"
              >
                Close
              </button>
              <button
                onClick={handleStatusSubmit}
                className="px-6 py-2 font-semibold text-white transition transform bg-blue-500 rounded-full shadow bg-opacity-80 hover:scale-105"
              >
                Submit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
)}



                  {/* Notifications Tab */}
{activeTab === 'notifications' && (
  <motion.div
    key="notifications"
    variants={tabContentVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="text-white"
  >
    {/* Header with View All toggle */}
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-semibold text-white">Notifications</h2>
      {notifications.length > 10 && (
        <Button
          variant="outline"
          size="sm"
          className="text-purple-400 border-purple-400/30 hover:bg-purple-400/10"
          onClick={() => setShowAllNotifications(prev => !prev)}
        >
          {showAllNotifications ? 'Show Less' : 'View All'}
        </Button>
      )}
    </div>

    {/* Notification List */}
    <div className="space-y-3">
      {loadingNotifications ? (
        <p className="text-gray-300">Loading notifications...</p>
      ) : notifications.length > 0 ? (
        (showAllNotifications ? notifications : notifications.slice(0, 10)).map(notification => {
          const dateObj = new Date(notification.createdAt);
          let iconNode: React.ReactNode = <AlertTriangle size={18} />;
          let bgClass = 'bg-purple-500/20 text-purple-400';

          if (notification.type === 'appointment_requested') {
            iconNode = <Calendar size={18} />;
            bgClass = 'bg-blue-500/20 text-blue-400';
          } else if (notification.type === 'payment_received' || notification.type === 'reminder') {
            iconNode = <Bell size={18} />;
            bgClass = 'bg-blue-500/20 text-blue-400';
          } else if (notification.type === 'achievement') {
            iconNode = <Award size={18} />;
            bgClass = 'bg-yellow-500/20 text-yellow-400';
          } else if (notification.type === 'payment_success' || notification.type === 'medical') {
            iconNode = <FileText size={18} />;
            bgClass = 'bg-emerald-500/20 text-emerald-400';
          }

          // current x pos for this card (default 0)
          const posX = draggedPositions[notification._id] ?? 0;

          return (
            <div key={notification._id} className="relative group">
              {/* Delete + Cancel Buttons */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotateY: 45 }}
                animate={{
                  opacity: draggedId === notification._id ? 1 : 0,
                  scale: draggedId === notification._id ? 1 : 0.8,
                  rotateY: draggedId === notification._id ? 0 : 45
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute z-10 flex items-center space-x-2 -translate-y-1/2 pointer-events-none right-4 top-1/2 sm:pointer-events-auto"
              >
                <Button
                  variant="destructive"
                  size="sm"
                  className="px-4 py-2 text-white bg-red-600 shadow-2xl pointer-events-auto rounded-2xl transform-gpu"
                  onClick={() => handleDeleteNotification(notification._id)}
                >
                  <motion.span
                    whileHover={{ scale: 1.2, rotateY: 20 }}
                    whileTap={{ scale: 0.9, rotateY: -10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    Delete
                  </motion.span>
                </Button>
                <motion.button
                  onClick={() => {
                    setDraggedId(null);
                    setDraggedPositions(prev => ({ ...prev, [notification._id]: 0 }));
                  }}
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  whileTap={{ scale: 0.8, rotate: -15 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex items-center justify-center w-8 h-8 rounded-full shadow-lg pointer-events-auto bg-white/10"
                >
                  <X size={16} className="text-white" />
                </motion.button>
              </motion.div>

              {/* Draggable Notification Card */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -80) {
                    setDraggedId(notification._id);
                    setDraggedPositions(prev => ({ ...prev, [notification._id]: -80 }));
                  } else {
                    setDraggedId(null);
                    setDraggedPositions(prev => ({ ...prev, [notification._id]: 0 }));
                  }
                }}
                style={{ x: posX }}
                animate={{ x: posX }}
                whileTap={{ scale: 0.97 }}
                variants={fadeInUp}
                whileHover={{ scale: 1.02, x: 5 }}
                className={`flex items-center p-4 rounded-xl transition-all duration-300 ${
                  notification.read
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30'
                }`}
              >
                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className={`p-3 rounded-full mr-4 flex-shrink-0 ${bgClass}`}
                >
                  {iconNode}
                </motion.div>

                {/* Message Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-medium text-white">
                      {notification.type === 'appointment_requested'
                        ? 'Appointment Requested'
                        : notification.type === 'payment_received'
                        ? 'Payment Received'
                        : notification.type === 'payment_success'
                        ? 'Payment Successful'
                        : notification.type === 'achievement'
                        ? 'Achievement'
                        : notification.type === 'reminder'
                        ? 'Reminder'
                        : 'Notification'}
                    </h4>
                    <span className="text-xs text-gray-400">
                      {format(dateObj, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-300">{notification.message}</p>
                </div>

                {/* Mark as Read */}
                {!notification.read && (
                  <Button
                    variant="outline"
                    size="xs"
                    className="ml-3 text-black border-white/30 hover:bg-white/10"
                    onClick={() => markAsRead(notification._id)}
                  >
                    Mark read
                  </Button>
                )}
              </motion.div>
            </div>
          );
        })
      ) : (
        <p className="text-gray-300">No notifications.</p>
      )}
    </div>
  </motion.div>
)}






                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <motion.div
                      key="profile"
                      variants={tabContentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="text-white"
                    >
                      
                      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        {/* Personal Info */}
                        <motion.div
                          variants={fadeInUp}
                          whileHover={cardHover}
                          className="p-6 border bg-white/5 backdrop-blur-xl rounded-2xl border-white/10"
                        >
                          <h3 className="mb-4 text-xl font-medium text-white">Personal Information</h3>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-300">Full Name</p>
                              <p className="text-white">{user?.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-300">Email Address</p>
                              <p className="text-white">{user?.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-300">Phone Number</p>
                              <p className="text-white">{user?.phone || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-300">Date of Birth</p>
                              <p className="text-white">
                                {user?.dob ? format(new Date(user.dob), 'MMMM d, yyyy') : 'Not provided'}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                              onClick={() => setShowEditProfile(true)}
                            >
                              Edit Profile
                            </Button>
                            {showEditProfile && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                                <EditProfileForm
                                  user={{
                                    name: user?.name || '',
                                    email: user?.email || '',
                                    phone: user?.phone || '',
                                    dob: user?.dob || '',
                                  }}
                                  onClose={() => setShowEditProfile(false)}
                                  onSave={handleProfileSave}
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                        {/* Medical Info */}
                        <motion.div
                          variants={fadeInUp}
                          whileHover={cardHover}
                          className="p-6 border bg-white/5 backdrop-blur-xl rounded-2xl border-white/10"
                          >
                          <h3 className="mb-4 text-xl font-medium text-white">Medical Information</h3>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-300">Blood Type</p>
                              <p className="text-white">{medicalInfo.bloodType || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-300">Allergies</p>
                              <p className="text-white">{medicalInfo.allergies || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-300">Current Medications</p>
                              <p className="text-white">{medicalInfo.currentMedications || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-300">Medical Conditions</p>
                              <p className="text-white">{medicalInfo.medicalConditions || 'Not provided'}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-cyan-400 text-cyan-400 hover:bg-cyan-500/10"
                              onClick={() => setShowUpdateMedical(true)}
                            >
                              Update Medical Info
                            </Button>
                            {showUpdateMedical && (
                              <motion.div
                              initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] overflow-auto bg-black bg-opacity-60 flex items-start justify-center pt-20"
                              >
                              <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-auto shadow-lg">
                                <UpdateMedicalInfoForm
                                  medicalInfo={medicalInfo}
                                  onClose={() => setShowUpdateMedical(false)}
                                  onSave={handleMedicalSave}
                                />
                              </div>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      </div>
                   <br/>
                   <br/>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Chatbot Floating Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
        className="fixed z-50 bottom-6 right-6"
      >
        <Chatbot />
      </motion.div>
    </div>
  );
};

export default DashboardPage1;
