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
  Upload,
  Settings as SettingsIcon,
  TrendingUp,
  Heart,
  Shield,
  Award,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../../components/common/Button';
import EditProfileForm from '../../components/common/editprofile/editprofileforms';
import UpdateMedicalInfoForm, { MedicalInfo } from '../../components/common/medicalinfo/UpdateMedicalInfoForm';
import Chatbot from '../../components/common/chatbot/chatbot';
import { BackgroundAnimation } from '../../components/animations/BackGroundAnimations';

// Framer Motion variants
const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};
const fadeInUp = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};
const cardHover = {
  scale: 1.05,
  y: -10,
  boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
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

// Interfaces for appointments / notifications
interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: Date;
  status: 'upcoming' | 'completed' | 'cancelled';
  image: string;
  type?: 'video' | 'in-person';
}
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'reminder' | 'medical' | 'message' | 'achievement';
  priority?: 'low' | 'medium' | 'high';
}

// Mock data (until real APIs are integrated)
const mockAppointments: Appointment[] = [
  {
    id: '1',
    doctorName: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    date: new Date(2025, 4, 15, 10, 30),
    status: 'upcoming',
    type: 'video',
    image:
      'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: '2',
    doctorName: 'Dr. Michael Rodriguez',
    specialty: 'Dermatologist',
    date: new Date(2025, 4, 20, 14, 0),
    status: 'upcoming',
    type: 'in-person',
    image:
      'https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: '3',
    doctorName: 'Dr. Emma Chen',
    specialty: 'Neurologist',
    date: new Date(2025, 3, 30, 9, 0),
    status: 'completed',
    type: 'video',
    image:
      'https://images.pexels.com/photos/5327921/pexels-photo-5327921.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
];

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Appointment Reminder',
    message: 'Your video consultation with Dr. Sarah Johnson is tomorrow at 10:30 AM',
    date: new Date(2025, 4, 14, 9, 0),
    read: false,
    type: 'reminder',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Health Achievement',
    message: "Congratulations! You've completed 5 appointments this month",
    date: new Date(2025, 4, 10, 14, 30),
    read: false,
    type: 'achievement',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'New Message',
    message: 'Dr. Michael Rodriguez has sent you post-consultation notes',
    date: new Date(2025, 4, 8, 11, 45),
    read: false,
    type: 'message',
    priority: 'medium',
  },
];

// Enhanced Tab component
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
    <motion.span
      className={`${isActive ? 'text-white' : 'text-gray-400'}`}
      animate={isActive ? { rotate: [0, 10, 0] } : {}}
      transition={{ duration: 0.5 }}
    >
      {icon}
    </motion.span>
    <span className={`font-medium ${isActive ? 'text-white' : ''}`}>{label}</span>
    {count && count > 0 && (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
      >
        {count}
      </motion.span>
    )}
  </motion.button>
);

const DashboardPage1: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'notifications' | 'profile'>('overview');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showUpdateMedical, setShowUpdateMedical] = useState(false);

  // State for medical info
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>({
    bloodType: '',
    allergies: '',
    currentMedications: '',
    medicalConditions: '',
  });

  // Avatar upload states
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.profileImageUrl || '');
  const [error, setError] = useState<string | null>(null);

  // Fetch medical info on mount
  useEffect(() => {
    const fetchMedical = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const resp = await fetch('http://localhost:4000/api/medical', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          setMedicalInfo(data.medicalInfo);
        }
      } catch (err) {
        console.error('Failed to fetch medical info:', err);
      }
    };
    fetchMedical();
  }, []);

  // Update avatar preview if user.profileImageUrl changes
  useEffect(() => {
    if (user?.profileImageUrl) {
      setAvatarPreview(user.profileImageUrl);
    }
  }, [user?.profileImageUrl]);

  // Handle profile save
  const handleProfileSave = async (updatedValues: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
  }) => {
    try {
      await updateProfile(updatedValues);
      setShowEditProfile(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle medical info save
  const handleMedicalSave = async (updatedMedical: MedicalInfo) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Unable to save: no authentication token found.');
        return;
      }
      const resp = await fetch('http://localhost:4000/api/medical', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedMedical),
      });
      if (resp.ok) {
        const data = await resp.json();
        setMedicalInfo(data.medicalInfo);
        setShowUpdateMedical(false);
      } else if (resp.status === 401) {
        alert('Unauthorized: please log in again.');
      } else {
        alert('Could not save medical info.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Stats counts
  const upcomingCount = mockAppointments.filter((a) => a.status === 'upcoming').length;
  const completedCount = mockAppointments.filter((a) => a.status === 'completed').length;
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  // Avatar click -> file input
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection and upload
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Not authenticated');
        setUploading(false);
        return;
      }
      // Upload avatar
      await axios.put('http://localhost:4000/api/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      // Refresh user in context
      await updateProfile({});
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload profile picture.');
      if (user?.profileImageUrl) {
        setAvatarPreview(user.profileImageUrl);
      }
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const avatarSrc = avatarPreview || '';

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background animations from original DashboardPage */}
      <BackgroundAnimation />

      <main className="relative z-10 min-h-screen text-gray-100 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
            {/* Enhanced Header */}
            <motion.header variants={fadeInUp} className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <motion.h1
                    className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                  >
                    Welcome back, {user?.name}
                  </motion.h1>
                  <motion.p
                    className="text-gray-300 text-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Your health journey continues here
                  </motion.p>
                </div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/settings">
                    <Button
                      variant="outline"
                      size="md"
                      className="flex items-center space-x-2 border-blue-400/30 text-blue-400 hover:bg-blue-400/10 backdrop-blur-sm"
                    >
                      <SettingsIcon className="w-5 h-5" />
                      <span>Settings</span>
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.header>

            {/* Enhanced Stats Cards */}
            <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[
                {
                  title: 'Upcoming Appointments',
                  value: upcomingCount.toString(),
                  icon: <Calendar size={28} className="text-blue-400" />,
                  gradient: 'from-blue-500/20 to-cyan-500/20',
                  border: 'border-blue-400/30',
                  change: '+2 this week',
                },
                {
                  title: 'Completed Visits',
                  value: completedCount.toString(),
                  icon: <CheckCircle size={28} className="text-emerald-400" />,
                  gradient: 'from-emerald-500/20 to-green-500/20',
                  border: 'border-emerald-400/30',
                  change: '+1 this month',
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
                  {/* Background gradient */}
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
                      <p className="text-sm text-gray-300 mb-1">{stat.title}</p>
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

            {/* Enhanced Tabs */}
            <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
              <div className="border-b border-white/10">
                <div className="flex overflow-x-auto p-6 space-x-4">
                  <Tab
                    label="Overview"
                    isActive={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                    icon={<Activity size={20} />}
                  />
                  <Tab
                    label="Appointments"
                    isActive={activeTab === 'appointments'}
                    onClick={() => setActiveTab('appointments')}
                    icon={<Calendar size={20} />}
                    count={upcomingCount}
                  />
                  <Tab
                    label="Notifications"
                    isActive={activeTab === 'notifications'}
                    onClick={() => setActiveTab('notifications')}
                    icon={<Bell size={20} />}
                    count={unreadCount}
                  />
                  <Tab
                    label="Profile"
                    isActive={activeTab === 'profile'}
                    onClick={() => setActiveTab('profile')}
                    icon={<UserIcon size={20} />}
                  />
                </div>
              </div>

              <div className="p-8">
                <AnimatePresence mode="wait" initial={false}>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      variants={tabContentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-10"
                    >
                      {/* Quick Actions */}
                      <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          {
                            title: 'Book Appointment',
                            description: 'Schedule with your preferred doctor',
                            icon: <Calendar size={24} />,
                            color: 'from-blue-500 to-cyan-500',
                            action: '/book-appointment',
                          },
                          {
                            title: 'Health Records',
                            description: 'View your medical history',
                            icon: <FileText size={24} />,
                            color: 'from-emerald-500 to-green-500',
                            action: '/records',
                          },
                          {
                            title: 'Emergency Contact',
                            description: '24/7 medical assistance',
                            icon: <Shield size={24} />,
                            color: 'from-red-500 to-pink-500',
                            action: '/emergency',
                          },
                        ].map((action, idx) => (
                          <motion.div
                            key={idx}
                            variants={fadeInUp}
                            whileHover={{ scale: 1.05, y: -5 }}
                            className={`relative p-6 rounded-2xl bg-gradient-to-br ${action.color} bg-opacity-10 border border-white/10 cursor-pointer group overflow-hidden`}
                            onClick={() => {
                              // navigate to action; assuming React Router's useNavigate or Link:
                              // But since it's a div, use window.location or wrap in Link:
                              window.location.href = action.action;
                            }}
                          >
                            <div
                              className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                            />
                            <div className="relative z-10">
                              <div className="text-white mb-3">{action.icon}</div>
                              <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                              <p className="text-gray-300 text-sm">{action.description}</p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>

                      {/* Upcoming Appointments */}
                      <motion.div variants={fadeInUp}>
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-semibold text-white">Upcoming Appointments</h2>
                          <Link to="/appointments">
                            <Button variant="outline" size="sm" className="border-blue-400/30 text-blue-400 hover:bg-blue-400/10">
                              View All
                            </Button>
                          </Link>
                        </div>
                        <div className="space-y-4">
                          {mockAppointments
                            .filter((a) => a.status === 'upcoming')
                            .map((appt, idx) => (
                              <motion.div
                                key={appt.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={cardHover}
                                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex items-center group"
                              >
                                <motion.img
                                  src={appt.image}
                                  alt={appt.doctorName}
                                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-400/30 mr-6"
                                  whileHover={{ scale: 1.1 }}
                                />
                                <div className="flex-1">
                                  <h3 className="text-lg font-medium text-white mb-1">{appt.doctorName}</h3>
                                  <p className="text-blue-400 mb-2">{appt.specialty}</p>
                                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                                    <span className="flex items-center">
                                      <Calendar size={14} className="mr-1" />
                                      {format(appt.date, 'MMM d, yyyy')}
                                    </span>
                                    <span className="flex items-center">
                                      <Clock size={14} className="mr-1" />
                                      {format(appt.date, 'h:mm a')}
                                    </span>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs ${
                                        appt.type === 'video'
                                          ? 'bg-green-500/20 text-green-400'
                                          : 'bg-blue-500/20 text-blue-400'
                                      }`}
                                    >
                                      {appt.type === 'video' ? 'Video Call' : 'In-Person'}
                                    </span>
                                  </div>
                                </div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button
                                    variant="gradient"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    onClick={() => {
                                      if (appt.type === 'video') {
                                        // join video call logic
                                      } else {
                                        // open directions logic
                                      }
                                    }}
                                  >
                                    {appt.type === 'video' ? 'Join Call' : 'Get Directions'}
                                  </Button>
                                </motion.div>
                              </motion.div>
                            ))}
                          {mockAppointments.filter((a) => a.status === 'upcoming').length === 0 && (
                            <p className="text-gray-300">No upcoming appointments.</p>
                          )}
                        </div>
                      </motion.div>

                      {/* Recent Notifications */}
                      <motion.div variants={fadeInUp}>
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-semibold text-white">Recent Activity</h2>
                          <Link to="/notifications">
                            <Button variant="outline" size="sm" className="border-purple-400/30 text-purple-400 hover:bg-purple-400/10">
                              View All
                            </Button>
                          </Link>
                        </div>
                        <div className="space-y-3">
                          {mockNotifications.slice(0, 3).map((notification, idx) => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              whileHover={{ scale: 1.02, x: 5 }}
                              className={`flex items-center p-4 rounded-xl transition-all duration-300 ${
                                notification.read
                                  ? 'bg-white/5 border border-white/10'
                                  : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30'
                              }`}
                            >
                              <motion.div
                                whileHover={{ rotate: 10, scale: 1.1 }}
                                className={`p-3 rounded-full mr-4 flex-shrink-0 ${
                                  notification.type === 'reminder'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : notification.type === 'achievement'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : notification.type === 'medical'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-purple-500/20 text-purple-400'
                                }`}
                              >
                                {notification.type === 'reminder' ? (
                                  <Bell size={18} />
                                ) : notification.type === 'achievement' ? (
                                  <Award size={18} />
                                ) : notification.type === 'medical' ? (
                                  <FileText size={18} />
                                ) : (
                                  <AlertTriangle size={18} />
                                )}
                              </motion.div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                                  <span className="text-xs text-gray-400">{format(notification.date, 'MMM d')}</span>
                                </div>
                                <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
                              </div>
                              {!notification.read && (
                                <motion.div animate={glowEffect} className="bg-blue-500 rounded-full w-3 h-3 ml-3" />
                              )}
                            </motion.div>
                          ))}
                          {mockNotifications.length === 0 && (
                            <p className="text-gray-300">No recent activity.</p>
                          )}
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
                      <motion.div variants={fadeInUp} className="text-center py-20">
                        <Calendar size={64} className="mx-auto text-blue-400 mb-4" />
                        <h3 className="text-2xl font-semibold mb-2">Appointments</h3>
                        <p className="text-gray-300">Manage your upcoming and past appointments</p>
                      </motion.div>
                      {/* Alternatively could list all with filtering as in DashboardPage1 */}
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
                      className="text-center py-20"
                    >
                      <Bell size={64} className="mx-auto text-purple-400 mb-4" />
                      <h3 className="text-2xl font-semibold text-white mb-2">Notifications</h3>
                      <p className="text-gray-400">Stay updated with your health journey</p>
                      {/* For full list, reuse patterns from Profile/Overview */}
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
                      {/* Profile content similar to DashboardPage1 but animated */}
                      <motion.div variants={fadeInUp} className="flex items-center mb-6">
                        <div className="relative">
                          {avatarSrc ? (
                            <motion.img
                              src={avatarSrc}
                              alt="Profile"
                              onClick={handleAvatarClick}
                              className={`w-24 h-24 rounded-full object-cover border-2 border-gray-700 cursor-pointer ${
                                uploading ? 'opacity-50' : 'opacity-100'
                              }`}
                              whileHover={{ scale: 1.05 }}
                            />
                          ) : (
                            <motion.div
                              onClick={handleAvatarClick}
                              className={`w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center cursor-pointer ${
                                uploading ? 'opacity-50' : 'opacity-100'
                              }`}
                              whileHover={{ scale: 1.05 }}
                            >
                              <UserIcon size={48} className="text-gray-400" />
                            </motion.div>
                          )}

                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          {uploading && (
                            <div className="absolute top-0 left-0 w-24 h-24 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                              <svg
                                className="animate-spin h-6 w-6 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-6">
                          <motion.h2 variants={fadeInUp} className="text-3xl font-semibold text-white">
                            {user?.name}
                          </motion.h2>
                          <motion.p variants={fadeInUp} className="text-gray-400">
                            {user?.email}
                          </motion.p>
                        </div>
                      </motion.div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Personal Info */}
                        <motion.div
                          variants={fadeInUp}
                          whileHover={cardHover}
                          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                        >
                          <h3 className="text-xl font-medium text-white mb-4">Personal Information</h3>
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
                              className="border-blue-400 text-blue-400 hover:bg-blue-400/10"
                              onClick={() => setShowEditProfile(true)}
                            >
                              Edit Profile
                            </Button>
                            {showEditProfile && (
                              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
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
                          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                        >
                          <h3 className="text-xl font-medium text-white mb-4">Medical Information</h3>
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
                              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                                <UpdateMedicalInfoForm
                                  medicalInfo={medicalInfo}
                                  onClose={() => setShowUpdateMedical(false)}
                                  onSave={handleMedicalSave}
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </div>
                      {/* Account Settings */}
                      <motion.div
                        variants={fadeInUp}
                        whileHover={cardHover}
                        className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                      >
                        <h3 className="text-xl font-medium text-white mb-4">Account Settings</h3>
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-gray-300 font-medium">Email Notifications</h4>
                              <p className="text-sm text-gray-400">
                                Receive emails about your appointments, reminders, and updates
                              </p>
                            </div>
                            <div className="relative inline-block w-12 h-6 rounded-full bg-white/10">
                              <input type="checkbox" className="sr-only peer" id="email-notifications" defaultChecked />
                              <span className="absolute inset-0 rounded-full transition-colors peer-checked:bg-blue-500/60"></span>
                              <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-gray-300 font-medium">SMS Notifications</h4>
                              <p className="text-sm text-gray-400">Receive text messages for appointment reminders</p>
                            </div>
                            <div className="relative inline-block w-12 h-6 rounded-full bg-white/10">
                              <input type="checkbox" className="sr-only peer" id="sms-notifications" />
                              <span className="absolute inset-0 rounded-full transition-colors peer-checked:bg-blue-500/60"></span>
                              <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></span>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-white/10">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:bg-red-700 border-red-500"
                            >
                              Settings
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Chatbot Floating Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }} className="fixed bottom-6 right-6 z-50">
        <Chatbot />
      </motion.div>
    </div>
  );
};

export default DashboardPage1;
