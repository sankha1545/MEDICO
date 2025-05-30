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

// Mock data types
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

// Mock data
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

const tabs = ['overview', 'appointments', 'patients', 'earnings', 'messages', 'profile'] as const;

type TabKey = typeof tabs[number];

const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Computed stats
  const upcomingCount = mockAppointments.filter(a => a.status === 'upcoming').length;
  const totalPatients = mockPatients.length;
  const earningsThisMonth = 5200; // mock value
  const unreadMessages = mockMessages.filter(m => !m.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn>
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dr. {user?.name}</h1>
              <p className="text-gray-600 mt-1">Manage your practice and appointments</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="mr-2" /> Logout
            </Button>
          </header>
        </FadeIn>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Upcoming Appointments', value: upcomingCount, icon: <Calendar />, bg: 'bg-primary-100' },
            { title: 'Total Patients', value: totalPatients, icon: <Users />, bg: 'bg-secondary-100' },
            { title: 'Earnings This Month', value: `$${earningsThisMonth}`, icon: <DollarSign />, bg: 'bg-green-100' },
            { title: 'Unread Messages', value: unreadMessages, icon: <Bell />, bg: 'bg-purple-100' },
          ].map((stat, idx) => (
            <SlideIn key={idx} direction="up" delay={idx * 0.1}>
              <div className="bg-white rounded-xl shadow-subtle p-6 flex items-center">
                <div className={`${stat.bg} p-3 rounded-full mr-4 text-gray-700`}>{stat.icon}</div>
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </SlideIn>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-subtle border border-gray-100 mb-8">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto p-4 space-x-4">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    activeTab === tab ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className={activeTab === tab ? 'text-primary-500' : 'text-gray-500'}>
                    {{ overview: <Activity />, appointments: <Calendar />, patients: <Users />, earnings: <DollarSign />, messages: <Bell />, profile: <User /> }[tab]}
                  </span>
                  <span className="capitalize">{tab}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="p-6">
            {activeTab === 'overview' && (
              <StaggeredContainer>
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Today's Summary</h2>
                  {/* Show today's appointments */}
                  {mockAppointments.filter(a => format(a.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length ? (
                    mockAppointments
                      .filter(a => format(a.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
                      .map(a => (
                        <motion.div
                          key={a.id}
                          variants={staggeredItemVariants}
                          className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{a.patientName}</p>
                            <p className="text-gray-500">{format(a.date, 'h:mm a')}</p>
                          </div>
                          <Link to={`/doctor/appointments/${a.id}`}>
                            <Button variant="outline" size="sm">
                              Details
                            </Button>
                          </Link>
                        </motion.div>
                      ))
                  ) : (
                    <p className="text-gray-500">No appointments scheduled for today.</p>
                  )}
                </div>
              </StaggeredContainer>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-6">
                {mockAppointments.map(a => (
                  <motion.div
                    key={a.id}
                    variants={staggeredItemVariants}
                    className="bg-white rounded-xl border border-gray-200 p-6 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{a.patientName}</p>
                      <p className="text-gray-500">{format(a.date, 'MMMM d, yyyy h:mm a')}</p>
                    </div>
                    <div className="flex space-x-2">
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

            {activeTab === 'patients' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockPatients.map(p => (
                  <motion.div
                    key={p.id}
                    variants={staggeredItemVariants}
                    className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col"
                  >
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-sm text-gray-500">Last visit: {format(p.lastVisit, 'MMM d, yyyy')}</p>
                    <p className="mt-2 text-gray-700 flex-1">Condition: {p.condition}</p>
                    <Link to={`/doctor/patients/${p.id}`}> 
                      <Button variant="link" size="sm">
                        View Record
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Earnings Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div variants={staggeredItemVariants} className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-500">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">${earningsThisMonth}</p>
                  </motion.div>
                  <motion.div variants={staggeredItemVariants} className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-500">Total to Date</p>
                    <p className="text-2xl font-bold text-gray-900">$32,450</p>
                  </motion.div>
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-4">
                {mockMessages.map(m => (
                  <motion.div
                    key={m.id}
                    variants={staggeredItemVariants}
                    className={`bg-white border rounded-lg p-4 flex justify-between items-start ${m.read ? 'border-gray-200' : 'border-primary-200 bg-primary-50'}`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{m.from}</p>
                      <p className="text-sm text-gray-600 mt-1">{m.content}</p>
                      <p className="text-xs text-gray-500 mt-1">{format(m.date, 'MMM d, h:mm a')}</p>
                    </div>
                    {!m.read && <span className="w-2 h-2 bg-primary-500 rounded-full mt-3"></span>}
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={staggeredItemVariants} className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Details</h3>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-gray-900 mb-3">Dr. {user?.name}</p>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900 mb-3">{user?.email}</p>
                  <p className="text-sm text-gray-500">Specialty</p>
                  <p className="text-gray-900 mb-3">Cardiology</p>
                  <Button variant="outline" size="sm" onClick={() => setShowEditProfile(true)}>
                    Edit Profile
                  </Button>
                  {showEditProfile && (
                    <EditDoctorProfileForm user={user!} onClose={() => setShowEditProfile(false)} />
                  )}
                </motion.div>
                <motion.div variants={staggeredItemVariants} className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
                  <Link to="/doctor/settings">
                    <Button variant="primary" size="sm">
                      <Settings className="mr-2" /> Go to Settings
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
