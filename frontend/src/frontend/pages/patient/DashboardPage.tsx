// File: frontend/src/pages/patient/DashboardPage.tsx

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
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
  Settings as SettingsIcon, // ← import the Settings (cog) icon
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../../components/common/Button';
import EditProfileForm from '../../components/common/editprofile/editprofileforms';
import UpdateMedicalInfoForm, { MedicalInfo } from '../../components/common/medicalinfo/UpdateMedicalInfoForm';
import Chatbot from '../../components/common/chatbot/chatbot';

// Framer Motion variants
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};
const cardHover = { scale: 1.03, boxShadow: '0 10px 20px rgba(0,0,0,0.5)' };

// Mock data for appointments / notifications
interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: Date;
  status: 'upcoming' | 'completed' | 'cancelled';
  image: string;
}
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'reminder' | 'medical' | 'message';
}

const mockAppointments: Appointment[] = [
  {
    id: '1',
    doctorName: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    date: new Date(2025, 4, 15, 10, 30),
    status: 'upcoming',
    image:
      'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: '2',
    doctorName: 'Dr. Michael Rodriguez',
    specialty: 'Dermatologist',
    date: new Date(2025, 4, 20, 14, 0),
    status: 'upcoming',
    image:
      'https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: '3',
    doctorName: 'Dr. Emma Chen',
    specialty: 'Neurologist',
    date: new Date(2025, 3, 30, 9, 0),
    status: 'completed',
    image:
      'https://images.pexels.com/photos/5327921/pexels-photo-5327921.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
];

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Appointment Reminder',
    message: 'Your appointment with Dr. Sarah Johnson is tomorrow at 10:30 AM',
    date: new Date(2025, 4, 14, 9, 0),
    read: false,
    type: 'reminder',
  },
  {
    id: '2',
    title: 'Prescription Renewal',
    message: 'Your prescription for Lisinopril is due for renewal',
    date: new Date(2025, 4, 10, 14, 30),
    read: true,
    type: 'medical',
  },
  {
    id: '3',
    title: 'New Message',
    message: 'Dr. Michael Rodriguez has sent you a message regarding your last visit',
    date: new Date(2025, 4, 8, 11, 45),
    read: false,
    type: 'message',
  },
];

// Tab component
interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}
const Tab: React.FC<TabProps> = ({ label, isActive, onClick, icon }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`flex items-center space-x-2 px-5 py-2 rounded-full transition-colors duration-200 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-lg'
        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
    }`}
  >
    <span className={`${isActive ? 'text-white' : 'text-gray-400'}`}>{icon}</span>
    <span className={`${isActive ? 'font-semibold' : ''}`}>{label}</span>
  </motion.button>
);

const DashboardPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'notifications' | 'profile'>(
    'overview'
  );
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showUpdateMedical, setShowUpdateMedical] = useState(false);

  // State to hold medical info
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>({
    bloodType: '',
    allergies: '',
    currentMedications: '',
    medicalConditions: '',
  });

  // States for avatar upload
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.profileImageUrl || '');
  const [error, setError] = useState<string | null>(null);

  // On mount, fetch real medical info from backend
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
          // Expecting { medicalInfo: { bloodType, allergies, ... } }
          setMedicalInfo(data.medicalInfo);
        }
      } catch (err) {
        console.error('Failed to fetch medical info:', err);
      }
    };

    fetchMedical();
  }, []);

  // Update avatarPreview whenever user.profileImageUrl changes
  useEffect(() => {
    if (user?.profileImageUrl) {
      setAvatarPreview(user.profileImageUrl);
    }
  }, [user?.profileImageUrl]);

  // Handle saving profile changes
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

  // Handle saving medical info from the form
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
        // Expect backend returns { medicalInfo: { ... } }
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

  // Avatar click opens file picker
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // When a file is selected, upload immediately
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    // Show local preview immediately
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

      // Send to correct endpoint for avatar upload
      const res = await axios.put(
        'http://localhost:4000/api/users/me/avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // After successful upload, fetch updated user to get new profileImageUrl
      const userRes = await axios.get('http://localhost:4000/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      updateProfile({}); // trigger context refresh; assumes updateProfile causes refetch
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload profile picture.');
      // Revert preview to old URL if upload fails
      if (user?.profileImageUrl) {
        setAvatarPreview(user.profileImageUrl);
      }
    } finally {
      setUploading(false);
    }
  };

  // Determine which avatar to show: either preview or placeholder
  const avatarSrc = avatarPreview || '';

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-gray-100 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
          {/* Header */}
          <motion.header variants={fadeInUp}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white">Welcome, {user?.name}</h1>
                <p className="text-gray-400 mt-2">Here’s an overview of your health and appointments.</p>
              </div>

              {/* ─── Settings Button ─── */}
              <Link to="/settings">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 border-gray-600 text-gray-200 hover:border-gray-500 hover:text-gray-100"
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
              </Link>
            </div>
          </motion.header>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              {
                title: 'Upcoming Appointments',
                value: upcomingCount.toString(),
                icon: <Calendar size={24} className="text-teal-300 animate-pulse" />,
                iconBg: 'bg-teal-800',
              },
              {
                title: 'Completed Visits',
                value: completedCount.toString(),
                icon: <CheckCircle size={24} className="text-emerald-300 animate-pulse" />,
                iconBg: 'bg-emerald-800',
              },
              {
                title: 'Pending Reports',
                value: '3',
                icon: <FileText size={24} className="text-amber-300 animate-pulse" />,
                iconBg: 'bg-amber-800',
              },
              {
                title: 'Unread Notifications',
                value: unreadCount.toString(),
                icon: <Bell size={24} className="text-indigo-300 animate-pulse" />,
                iconBg: 'bg-indigo-800',
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={cardHover}
                className="bg-gray-800 rounded-2xl border border-gray-700 p-6"
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${stat.iconBg} mr-4 flex-shrink-0`}>{stat.icon}</div>
                  <div>
                    <p className="text-sm text-gray-400">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <motion.div variants={fadeInUp} className="bg-gray-800 rounded-2xl border border-gray-700">
            <div className="border-b border-gray-700">
              <div className="flex overflow-x-auto p-4 space-x-4">
                <Tab
                  label="Overview"
                  isActive={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                  icon={<Activity size={18} />}
                />
                <Tab
                  label="Appointments"
                  isActive={activeTab === 'appointments'}
                  onClick={() => setActiveTab('appointments')}
                  icon={<Calendar size={18} />}
                />
                <Tab
                  label="Notifications"
                  isActive={activeTab === 'notifications'}
                  onClick={() => setActiveTab('notifications')}
                  icon={<Bell size={18} />}
                />
                <Tab
                  label="Profile"
                  isActive={activeTab === 'profile'}
                  onClick={() => setActiveTab('profile')}
                  icon={<UserIcon size={18} />}
                />
              </div>
            </div>

            <div className="p-6">
              {/* ─── Overview Tab ─── */}
              {activeTab === 'overview' && (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-10">
                  {/* Upcoming Appointments */}
                  <motion.div variants={fadeInUp}>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold text-white">Upcoming Appointments</h2>
                      <Link to="/book-appointment">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-teal-400 text-teal-400 hover:bg-teal-700"
                        >
                          Book New
                        </Button>
                      </Link>
                    </div>
                    <div className="space-y-4">
                      {mockAppointments
                        .filter((a) => a.status === 'upcoming')
                        .map((appt) => (
                          <motion.div
                            key={appt.id}
                            variants={fadeInUp}
                            whileHover={cardHover}
                            className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center hover:shadow-xl transition-shadow"
                          >
                            <img
                              src={appt.image}
                              alt={appt.doctorName}
                              className="w-14 h-14 rounded-full object-cover border-2 border-gray-700 mr-4"
                            />
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-white">{appt.doctorName}</h3>
                              <p className="text-gray-400">{appt.specialty}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-gray-400 mb-1">
                                <Calendar size={14} className="mr-1" />
                                <span>{format(appt.date, 'MMM d, yyyy')}</span>
                              </div>
                              <div className="flex items-center text-gray-400">
                                <Clock size={14} className="mr-1" />
                                <span>{format(appt.date, 'h:mm a')}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>

                  {/* Recent Notifications */}
                  <motion.div variants={fadeInUp}>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold text-white">Recent Notifications</h2>
                      <Link to="/notifications">
                        <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                          View All
                        </Button>
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {mockNotifications.slice(0, 3).map((n) => (
                        <motion.div
                          key={n.id}
                          variants={fadeInUp}
                          whileHover={cardHover}
                          className={`flex items-center p-4 rounded-xl transition-colors ${
                            n.read ? 'bg-gray-800 border border-gray-700' : 'bg-indigo-900 border-indigo-700'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-full mr-3 flex-shrink-0 ${
                              n.type === 'reminder'
                                ? 'bg-indigo-600 text-white'
                                : n.type === 'medical'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-600 text-white'
                            }`}
                          >
                            {n.type === 'reminder' ? (
                              <Bell size={16} />
                            ) : n.type === 'medical' ? (
                              <FileText size={16} />
                            ) : (
                              <AlertTriangle size={16} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="text-sm font-medium text-white">{n.title}</h4>
                              <span className="text-xs text-gray-400">{format(n.date, 'MMM d')}</span>
                            </div>
                            <p className="text-sm text-gray-300 mt-1">{n.message}</p>
                          </div>
                          {!n.read && <div className="bg-indigo-500 rounded-full w-2 h-2 ml-3" />}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* ─── Appointments Tab ─── */}
              {activeTab === 'appointments' && (
                <motion.div variants={fadeInUp} className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-white">All Appointments</h2>
                    <Link to="/book-appointment">
                      <Button variant="primary" size="sm" className="bg-teal-500 hover:bg-teal-600">
                        Book New
                      </Button>
                    </Link>
                  </div>
                  <div className="flex space-x-3 mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-teal-400 text-teal-400 hover:bg-teal-700"
                    >
                      Upcoming
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-400 text-emerald-400 hover:bg-emerald-700"
                    >
                      Completed
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-400 text-red-400 hover:bg-red-700"
                    >
                      Cancelled
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {mockAppointments.map((a) => (
                      <motion.div
                        key={a.id}
                        variants={fadeInUp}
                        whileHover={cardHover}
                        className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden"
                      >
                        <div className="md:flex">
                          <div className="md:w-1/4">
                            <img
                              src={a.image}
                              alt={a.doctorName}
                              className="w-full h-32 md:h-full object-cover border-b border-gray-700 md:border-b-0 md:border-r border-gray-700"
                            />
                          </div>
                          <div className="p-6 md:w-3/4">
                            <div className="flex flex-col md:flex-row justify-between">
                              <div>
                                <h3 className="text-2xl font-medium text-white">{a.doctorName}</h3>
                                <p className="text-gray-400">{a.specialty}</p>
                              </div>
                              <div className="mt-4 md:mt-0 flex items-center">
                                <span
                                  className={`px-3 py-1 text-xs rounded-full ${
                                    a.status === 'upcoming'
                                      ? 'bg-teal-600 text-white'
                                      : a.status === 'completed'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-red-600 text-white'
                                  }`}
                                >
                                  {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                </span>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center text-gray-400">
                              <Calendar size={16} className="mr-2" />
                              <span className="mr-6">{format(a.date, 'MMMM d, yyyy')}</span>
                              <Clock size={16} className="mr-2" />
                              <span>{format(a.date, 'h:mm a')}</span>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-3">
                              {a.status === 'upcoming' ? (
                                <>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="bg-emerald-500 hover:bg-emerald-600"
                                  >
                                    Join Video Call
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-indigo-400 text-indigo-400 hover:bg-indigo-700"
                                  >
                                    Reschedule
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-700">
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-400 text-gray-400 hover:bg-gray-700"
                                  >
                                    View Details
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-400 text-gray-400 hover:bg-gray-700"
                                  >
                                    Download Report
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ─── Notifications Tab ─── */}
              {activeTab === 'notifications' && (
                <motion.div variants={fadeInUp} className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-white">All Notifications</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-indigo-400 text-indigo-400 hover:bg-indigo-700"
                    >
                      Mark All as Read
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {mockNotifications.map((n) => (
                      <motion.div
                        key={n.id}
                        variants={fadeInUp}
                        whileHover={cardHover}
                        className={`flex items-start p-4 rounded-xl transition-colors ${
                          n.read ? 'bg-gray-800 border border-gray-700' : 'bg-indigo-900 border-indigo-700'
                        }`}
                      >
                        <div
                          className={`p-3 rounded-full mr-4 flex-shrink-0 ${
                            n.type === 'reminder'
                              ? 'bg-indigo-600 text-white'
                              : n.type === 'medical'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {n.type === 'reminder' ? (
                            <Bell size={20} />
                          ) : n.type === 'medical' ? (
                            <FileText size={20} />
                          ) : (
                            <AlertTriangle size={20} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium text-white">{n.title}</h4>
                            <span className="text-sm text-gray-400">{format(n.date, 'MMM d, h:mm a')}</span>
                          </div>
                          <p className="text-gray-300 mt-1">{n.message}</p>
                          <div className="mt-3 flex space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-400 text-gray-400 hover:bg-gray-700"
                            >
                              {n.type === 'reminder'
                                ? 'View Appointment'
                                : n.type === 'medical'
                                ? 'View Prescription'
                                : 'Read Message'}
                            </Button>
                            {!n.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-indigo-400 hover:bg-indigo-700"
                              >
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ─── Profile Tab ─── */}
              {activeTab === 'profile' && (
                <motion.div variants={fadeInUp} className="space-y-8">
                  <div className="flex items-center mb-6">
                    <div className="relative">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt="Profile"
                          onClick={handleAvatarClick}
                          className={`w-24 h-24 rounded-full object-cover border-2 border-gray-700 cursor-pointer ${
                            uploading ? 'opacity-50' : 'opacity-100'
                          }`}
                        />
                      ) : (
                        <div
                          onClick={handleAvatarClick}
                          className={`w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mr-6 cursor-pointer ${
                            uploading ? 'opacity-50' : 'opacity-100'
                          }`}
                        >
                          <UserIcon size={48} className="text-gray-400" />
                        </div>
                      )}

                      {/* Hidden file input */}
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
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="ml-6">
                      <h2 className="text-3xl font-semibold text-white">{user?.name}</h2>
                      <p className="text-gray-400">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Personal Info */}
                    <motion.div
                      variants={fadeInUp}
                      whileHover={cardHover}
                      className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg"
                    >
                      <h3 className="text-xl font-medium text-white mb-4">Personal Information</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-400">Full Name</p>
                          <p className="text-gray-200">{user?.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Email Address</p>
                          <p className="text-gray-200">{user?.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Phone Number</p>
                          <p className="text-gray-200">{user?.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Date of Birth</p>
                          <p className="text-gray-200">
                            {user?.dob ? format(new Date(user.dob), 'MMMM d, yyyy') : 'Not provided'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-indigo-400 text-indigo-400 hover:bg-indigo-700"
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
                      className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg"
                    >
                      <h3 className="text-xl font-medium text-white mb-4">Medical Information</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-400">Blood Type</p>
                          <p className="text-gray-200">{medicalInfo.bloodType || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Allergies</p>
                          <p className="text-gray-200">{medicalInfo.allergies || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Current Medications</p>
                          <p className="text-gray-200">{medicalInfo.currentMedications || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Medical Conditions</p>
                          <p className="text-gray-200">{medicalInfo.medicalConditions || 'Not provided'}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-teal-400 text-teal-400 hover:bg-teal-700"
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
                    className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg"
                  >
                    <h3 className="text-xl font-medium text-white mb-4">Account Settings</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-gray-200 font-medium">Email Notifications</h4>
                          <p className="text-sm text-gray-400">
                            Receive emails about your appointments, reminders, and updates
                          </p>
                        </div>
                        <div className="relative inline-block w-12 h-6 rounded-full bg-gray-700">
                          <input type="checkbox" className="sr-only peer" id="email-notifications" defaultChecked />
                          <span className="absolute inset-0 rounded-full transition-colors peer-checked:bg-indigo-600"></span>
                          <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-gray-200 font-medium">SMS Notifications</h4>
                          <p className="text-sm text-gray-400">
                            Receive text messages for appointment reminders
                          </p>
                        </div>
                        <div className="relative inline-block w-12 h-6 rounded-full bg-gray-700">
                          <input type="checkbox" className="sr-only peer" id="sms-notifications" />
                          <span className="absolute inset-0 rounded-full transition-colors peer-checked:bg-indigo-600"></span>
                          <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-700">
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
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Chatbot Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Chatbot />
      </div>
    </main>
  );
};

export default DashboardPage;
