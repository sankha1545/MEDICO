// src/pages/dashboard/DashboardPage.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  User as UserIcon,
  Activity,
  FileText,
  Bell,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import EditProfileForm from '../../components/common/editprofile/editprofileforms';
import UpdateMedicalInfoForm from '../../components/common/medicalinfo/UpdateMedicalInfoForm';
import {
  FadeIn,
  SlideIn,
  StaggeredContainer,
  staggeredItemVariants,
} from '../../components/animations/Transitions';
import Chatbot from '../../components/common/chatbot/chatbot';

// Interfaces
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

interface MedicalInfo {
  bloodType: string;
  allergies: string;
  currentMedications: string;
  medicalConditions: string;
}

// Mock data
const mockAppointments: Appointment[] = [
  {
    id: '1',
    doctorName: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    date: new Date(2025, 4, 15, 10, 30),
    status: 'upcoming',
    image: 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg',
  },
  {
    id: '2',
    doctorName: 'Dr. Michael Rodriguez',
    specialty: 'Dermatologist',
    date: new Date(2025, 4, 20, 14, 0),
    status: 'upcoming',
    image: 'https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg',
  },
  {
    id: '3',
    doctorName: 'Dr. Emma Chen',
    specialty: 'Neurologist',
    date: new Date(2025, 3, 30, 9, 0),
    status: 'completed',
    image: 'https://images.pexels.com/photos/5327921/pexels-photo-5327921.jpeg',
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
  <button
    type="button"
    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
      isActive
        ? 'bg-primary-50 text-primary-700 font-medium'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
    onClick={onClick}
  >
    <span className={isActive ? 'text-primary-500' : 'text-gray-500'}>{icon}</span>
    <span>{label}</span>
  </button>
);

const DashboardPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'appointments' | 'notifications' | 'profile'
  >('overview');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showUpdateMedical, setShowUpdateMedical] = useState(false);
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>({
    bloodType: 'O+',
    allergies: 'Penicillin, Peanuts',
    currentMedications: 'Lisinopril, Metformin',
    medicalConditions: 'Hypertension, Type 2 Diabetes',
  });

  const upcomingCount = mockAppointments.filter((a) => a.status === 'upcoming').length;
  const completedCount = mockAppointments.filter((a) => a.status === 'completed').length;
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const handleProfileSave = async (updatedValues: { name?: string; email?: string }) => {
    try {
      const updated = await updateProfile(updatedValues);
      console.log('Profile updated', updated);
      setShowEditProfile(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMedicalSave = (updatedMedical: MedicalInfo) => {
    // TODO: send to backend when ready
    console.log('Medical info saved', updatedMedical);
    setMedicalInfo(updatedMedical);
    setShowUpdateMedical(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn>
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome {user?.name},
            </h1>
            <p className="text-gray-600 mt-2">
              Here&apos;s an overview of your health and appointments.
            </p>
          </header>
        </FadeIn>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Upcoming Appointments',
              value: String(upcomingCount),
              icon: <Calendar className="text-primary-500" />,
              iconBg: 'bg-primary-100',
            },
            {
              title: 'Completed Visits',
              value: String(completedCount),
              icon: <CheckCircle className="text-green-500" />,
              iconBg: 'bg-green-100',
            },
            {
              title: 'Pending Reports',
              value: '3',
              icon: <FileText className="text-amber-500" />,
              iconBg: 'bg-amber-100',
            },
            {
              title: 'Unread Notifications',
              value: String(unreadCount),
              icon: <Bell className="text-purple-500" />,
              iconBg: 'bg-purple-100',
            },
          ].map((stat, i) => (
            <SlideIn key={i} direction="up" delay={i * 0.1}>
              <div className="bg-white rounded-xl shadow-subtle border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${stat.iconBg} mr-4`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            </SlideIn>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-subtle border border-gray-100 mb-8">
          <div className="border-b border-gray-200">
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
            {activeTab === 'overview' && (
              <>
                {/* Upcoming */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Upcoming Appointments
                  </h2>
                  <Link to="/book-appointment">
                    <Button variant="outline" size="sm">
                      Book New Appointment
                    </Button>
                  </Link>
                </div>
                <StaggeredContainer>
                  <div className="space-y-4">
                    {mockAppointments
                      .filter((a) => a.status === 'upcoming')
                      .map((appt) => (
                        <motion.div
                          key={appt.id}
                          variants={staggeredItemVariants}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center">
                            <img
                              src={appt.image}
                              alt={appt.doctorName}
                              className="w-12 h-12 rounded-full object-cover mr-4"
                            />
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900">
                                {appt.doctorName}
                              </h3>
                              <p className="text-gray-500">{appt.specialty}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-gray-700 mb-1">
                                <Calendar size={14} className="mr-1" />
                                <span>{format(appt.date, 'MMM d, yyyy')}</span>
                              </div>
                              <div className="flex items-center text-gray-700">
                                <Clock size={14} className="mr-1" />
                                <span>{format(appt.date, 'h:mm a')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex justify-end space-x-3">
                            <Button variant="outline" size="sm">
                              Reschedule
                            </Button>
                            <Button variant="primary" size="sm">
                              Join Call
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </StaggeredContainer>

                {/* Recent notifications */}
                <div className="mt-10">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Recent Notifications
                    </h2>
                    <Link to="/notifications">
                      <Button variant="ghost" size="sm">
                        View All
                      </Button>
                    </Link>
                  </div>
                  <StaggeredContainer>
                    <div className="space-y-3">
                      {mockNotifications.slice(0, 3).map((n) => (
                        <motion.div
                          key={n.id}
                          variants={staggeredItemVariants}
                          className={`flex items-start p-3 rounded-md ${
                            n.read ? 'bg-white' : 'bg-primary-50'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-full mr-3 ${
                              n.type === 'reminder'
                                ? 'bg-primary-100 text-primary-600'
                                : n.type === 'medical'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-amber-100 text-amber-600'
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
                              <h4 className="text-sm font-medium text-gray-900">
                                {n.title}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {format(n.date, 'MMM d')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {n.message}
                            </p>
                          </div>
                          {!n.read && (
                            <div className="bg-primary-500 rounded-full w-2 h-2"></div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </StaggeredContainer>
                </div>
              </>
            )}

            {activeTab === 'appointments' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    All Appointments
                  </h2>
                  <Link to="/book-appointment">
                    <Button variant="primary" size="sm">
                      Book New Appointment
                    </Button>
                  </Link>
                </div>
                <div className="flex space-x-2 mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-primary-50 border-primary-200 text-primary-700"
                  >
                    Upcoming
                  </Button>
                  <Button variant="outline" size="sm">
                    Completed
                  </Button>
                  <Button variant="outline" size="sm">
                    Cancelled
                  </Button>
                </div>
                <StaggeredContainer>
                  <div className="space-y-6">
                    {mockAppointments.map((a) => (
                      <motion.div
                        key={a.id}
                        variants={staggeredItemVariants}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-subtle"
                      >
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-1/4">
                            <img
                              src={a.image}
                              alt={a.doctorName}
                              className="w-full h-32 md:h-full object-cover"
                            />
                          </div>
                          <div className="p-6 md:w-3/4">
                            <div className="flex flex-col md:flex-row justify-between">
                              <div>
                                <h3 className="text-xl font-medium text-gray-900">
                                  {a.doctorName}
                                </h3>
                                <p className="text-gray-500">{a.specialty}</p>
                              </div>
                              <div className="mt-4 md:mt-0 flex items-start">
                                <span
                                  className={`px-3 py-1 text-xs rounded-full ${
                                    a.status === 'upcoming'
                                      ? 'bg-blue-100 text-blue-800'
                                      : a.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {a.status.charAt(0).toUpperCase() +
                                    a.status.slice(1)}
                                </span>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center text-gray-700">
                              <Calendar size={16} className="mr-2" />
                              <span className="mr-6">
                                {format(a.date, 'MMMM d, yyyy')}
                              </span>
                              <Clock size={16} className="mr-2" />
                              <span>{format(a.date, 'h:mm a')}</span>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-3">
                              {a.status === 'upcoming' ? (
                                <>
                                  <Button variant="primary" size="sm">
                                    Join Video Call
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    Reschedule
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-error-600 hover:bg-error-50"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="outline" size="sm">
                                    View Details
                                  </Button>
                                  <Button variant="outline" size="sm">
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
                </StaggeredContainer>
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    All Notifications
                  </h2>
                  <Button variant="outline" size="sm">
                    Mark All as Read
                  </Button>
                </div>
                <StaggeredContainer>
                  <div className="space-y-4">
                    {mockNotifications.map((n) => (
                      <motion.div
                        key={n.id}
                        variants={staggeredItemVariants}
                        className={`flex items-start p-4 rounded-lg border ${
                          n.read
                            ? 'bg-white border-gray-200'
                            : 'bg-primary-50 border-primary-200'
                        }`}
                      >
                        <div
                          className={`p-3 rounded-full mr-4 ${
                            n.type === 'reminder'
                              ? 'bg-primary-100 text-primary-600'
                              : n.type === 'medical'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-amber-100 text-amber-600'
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
                            <h4 className="font-medium text-gray-900">{n.title}</h4>
                            <span className="text-sm text-gray-500">
                              {format(n.date, 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1">{n.message}</p>
                          <div className="mt-3 flex space-x-3">
                            <Button variant="outline" size="sm">
                              {n.type === 'reminder'
                                ? 'View Appointment'
                                : n.type === 'medical'
                                ? 'View Prescription'
                                : 'Read Message'}
                            </Button>
                            {!n.read && (
                              <Button variant="ghost" size="sm">
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </StaggeredContainer>
              </>
            )}

            {activeTab === 'profile' && (
              <>
                <div className="flex items-center mb-8">
                  <div className="bg-gray-200 rounded-full w-24 h-24 flex items-center justify-center mr-6">
                    <UserIcon size={40} className="text-gray-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {user?.name}
                    </h2>
                    <p className="text-gray-600">{user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-subtle relative">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Personal Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="text-gray-900">{user?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email Address</p>
                        <p className="text-gray-900">{user?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="text-gray-900">+1 (555) 123-4567</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date of Birth</p>
                        <p className="text-gray-900">January 15, 1985</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEditProfile(true)}
                      >
                        Edit Profile
                      </Button>
                      {showEditProfile && (
                        <EditProfileForm
                          user={user!}
                          onClose={() => setShowEditProfile(false)}
                          onSave={handleProfileSave}
                        />
                      )}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-subtle">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Medical Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Blood Type</p>
                        <p className="text-gray-900">{medicalInfo.bloodType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Allergies</p>
                        <p className="text-gray-900">{medicalInfo.allergies}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Current Medications</p>
                        <p className="text-gray-900">
                          {medicalInfo.currentMedications}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Medical Conditions</p>
                        <p className="text-gray-900">
                          {medicalInfo.medicalConditions}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUpdateMedical(true)}
                      >
                        Update Medical Info
                      </Button>
                      {showUpdateMedical && (
                        <UpdateMedicalInfoForm
                          medicalInfo={medicalInfo}
                          onClose={() => setShowUpdateMedical(false)}
                          onSave={handleMedicalSave}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 shadow-subtle">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Account Settings
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-gray-900 font-medium">
                          Email Notifications
                        </h4>
                        <p className="text-sm text-gray-500">
                          Receive emails about your appointments, reminders, and updates
                        </p>
                      </div>
                      <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          id="email-notifications"
                          defaultChecked
                        />
                        <span className="absolute inset-0 rounded-full transition-colors peer-checked:bg-primary-500"></span>
                        <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-gray-900 font-medium">
                          SMS Notifications
                        </h4>
                        <p className="text-sm text-gray-500">
                          Receive text messages for appointment reminders
                        </p>
                      </div>
                      <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          id="sms-notifications"
                        />
                        <span className="absolute inset-0 rounded-full transition-colors peer-checked:bg-primary-500"></span>
                        <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-error-600 hover:bg-error-50"
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Chatbot />
    </div>
  );
};

export default DashboardPage;
