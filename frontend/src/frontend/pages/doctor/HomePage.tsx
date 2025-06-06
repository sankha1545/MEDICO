import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Calendar,
  Users,
  DollarSign,
  Bell,
  User,
  Activity,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/common/Button';

import {
  FadeIn,
  SlideIn,
  StaggeredContainer,
  staggeredItemVariants,
} from '../../components/animations/Transitions';

// -----------------------------------------------------------------------------
// Data Types
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Mock Data
// -----------------------------------------------------------------------------
const mockAppointments: DoctorAppointment[] = [
  { id: 'a1', patientName: 'John Doe', date: new Date(2025, 4, 20, 10, 0), status: 'upcoming' },
  { id: 'a2', patientName: 'Jane Smith', date: new Date(2025, 4, 21, 14, 30), status: 'upcoming' },
  { id: 'a3', patientName: 'Mike Johnson', date: new Date(2025, 3, 15, 9, 0), status: 'completed' },
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

// -----------------------------------------------------------------------------
// Tabs
// -----------------------------------------------------------------------------
const tabs = ['overview', 'appointments', 'patients', 'earnings', 'messages', 'profile'] as const;
type TabKey = typeof tabs[number];

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------
const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Computed Stats
  const upcomingCount = mockAppointments.filter(a => a.status === 'upcoming').length;
  const totalPatients = mockPatients.length;
  const earningsThisMonth = 5200; // mock value
  const unreadMessages = mockMessages.filter(m => !m.read).length;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <FadeIn>
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-100 tracking-tight">Dr. {user?.name}</h1>
              <p className="text-gray-400 mt-2">Welcome back! Here’s your practice at a glance.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 md:mt-0 border-gray-600 hover:border-gray-500 text-gray-200 hover:text-gray-100"
              onClick={logout}
            >
              <LogOut className="mr-2 w-4 h-4" /> Logout
            </Button>
          </header>
        </FadeIn>

        {/* Stats Overview */}
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
              value: totalPatients,
              icon: <Users className="w-6 h-6 text-white" />,
              gradient: 'bg-gradient-to-br from-indigo-700 to-indigo-900',
            },
            {
              title: 'Earnings This Month',
              value: `$${earningsThisMonth}`,
              icon: <DollarSign className="w-6 h-6 text-white" />,
              gradient: 'bg-gradient-to-br from-green-700 to-green-900',
            },
            {
              title: 'Unread Messages',
              value: unreadMessages,
              icon: <Bell className="w-6 h-6 text-white" />,
              gradient: 'bg-gradient-to-br from-purple-700 to-purple-900',
            },
          ].map((stat, idx) => (
            <SlideIn key={idx} direction="up" delay={idx * 0.1}>
              <div className={`rounded-2xl shadow-lg overflow-hidden ${stat.gradient} text-white`}>
                <div className="p-6 flex items-center">
                  <div className="p-3 rounded-full bg-white bg-opacity-25 mr-4">{stat.icon}</div>
                  <div>
                    <p className="text-sm uppercase tracking-wide">{stat.title}</p>
                    <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </div>
            </SlideIn>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-800 rounded-xl shadow-md border border-gray-900 mb-12 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-700">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center space-x-2 px-5 py-3 ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-500'
                    : 'text-gray-400 hover:text-gray-200'
                } transition-colors duration-150`}
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
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <StaggeredContainer>
                <div className="space-y-8">
                  <h2 className="text-2xl font-semibold text-gray-100">Today's Summary</h2>
                  {mockAppointments.filter(a => format(a.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
                    .length ? (
                    mockAppointments
                      .filter(a => format(a.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
                      .map(a => (
                        <motion.div
                          key={a.id}
                          variants={staggeredItemVariants}
                          className="bg-gray-800 rounded-lg shadow-sm p-5 flex justify-between items-center hover:shadow-md transition-shadow"
                        >
                          <div>
                            <p className="font-semibold text-gray-100">{a.patientName}</p>
                            <p className="text-gray-400 mt-1">{format(a.date, 'h:mm a')}</p>
                          </div>
                          <Link to={`/doctor/appointments/${a.id}`}>
                            <Button variant="primary" size="sm">
                              Details
                            </Button>
                          </Link>
                        </motion.div>
                      ))
                  ) : (
                    <p className="text-gray-400">No appointments scheduled for today.</p>
                  )}
                </div>
              </StaggeredContainer>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                {mockAppointments.map(a => (
                  <motion.div
                    key={a.id}
                    variants={staggeredItemVariants}
                    className="bg-gray-800 rounded-lg shadow-sm p-6 flex justify-between items-center hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="font-semibold text-gray-100">{a.patientName}</p>
                      <p className="text-gray-400 mt-1">{format(a.date, 'MMMM d, yyyy h:mm a')}</p>
                      <span
                        className={`mt-2 inline-block text-xs font-medium px-2 py-1 rounded-full ${
                          a.status === 'upcoming'
                            ? 'bg-yellow-600 text-yellow-100'
                            : a.status === 'completed'
                            ? 'bg-green-600 text-green-100'
                            : 'bg-red-600 text-red-100'
                        }`}
                      >
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      {a.status === 'upcoming' ? (
                        <>
                          <Button variant="outline" size="sm">
                            Reschedule
                          </Button>
                          <Button variant="primary" size="sm">
                            Start Visit
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm">
                          View Notes
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Patients Tab */}
            {activeTab === 'patients' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockPatients.map(p => (
                  <motion.div
                    key={p.id}
                    variants={staggeredItemVariants}
                    className="bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col"
                  >
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
                    <Link to={`/doctor/patients/${p.id}`} className="mt-4 inline-block">
                      <Button variant="link" size="sm">
                        View Record
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold text-gray-100">Earnings Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <motion.div
                    variants={staggeredItemVariants}
                    className="bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <p className="text-sm text-gray-400 uppercase tracking-wide">This Month</p>
                    <p className="mt-2 text-3xl font-bold text-gray-100">${earningsThisMonth}</p>
                  </motion.div>
                  <motion.div
                    variants={staggeredItemVariants}
                    className="bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Total to Date</p>
                    <p className="mt-2 text-3xl font-bold text-gray-100">$32,450</p>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="space-y-4">
                {mockMessages.map(m => (
                  <motion.div
                    key={m.id}
                    variants={staggeredItemVariants}
                    className={`bg-gray-800 rounded-lg shadow-sm p-5 flex justify-between hover:shadow-md transition-shadow ${
                      m.read ? 'border border-gray-700' : 'border-2 border-blue-600 bg-blue-900'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-gray-100">{m.from}</p>
                      <p className="text-sm text-gray-400 mt-1">{m.content}</p>
                      <p className="text-xs text-gray-500 mt-1">{format(m.date, 'MMM d, h:mm a')}</p>
                    </div>
                    {!m.read && (
                      <span className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-2"></span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                  variants={staggeredItemVariants}
                  className="bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-gray-100 mb-5">Profile Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400">Name</p>
                      <p className="text-gray-100 font-medium">Dr. {user?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-gray-100 font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Specialty</p>
                      <p className="text-gray-100 font-medium">Cardiology</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-6 border-gray-600 hover:border-gray-500 text-gray-200 hover:text-gray-100"
                    onClick={() => setShowEditProfile(true)}
                  >
                    Edit Profile
                  </Button>
                  {showEditProfile && (
                    <EditDoctorProfileForm user={user!} onClose={() => setShowEditProfile(false)} />
                  )}
                </motion.div>
                <motion.div
                  variants={staggeredItemVariants}
                  className="bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-gray-100 mb-5">Account Settings</h3>
                  <Link to="/doctor/settings">
                    <Button variant="primary" size="sm">
                      <Settings className="mr-2 w-4 h-4" /> Go to Settings
                    </Button>
                  </Link>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
