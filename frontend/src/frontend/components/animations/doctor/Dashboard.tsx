import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  Stethoscope,
  Heart,
  Activity
} from 'lucide-react';

// Import our custom components
import ThreeBackground from './ThreeBackground';
import FloatingNavbar from './FloatingNavbar';
import StatsCard from './StatsCard';
import AnimatedChart from './AnimatedChart';
import ProfileAvatar3D from './ProfileAvatar3D';

// Mock data - replace with your actual data fetching
const mockAppointments = [
  { id: '1', patientName: 'John Doe', date: '2024-01-15T10:00:00Z', status: 'upcoming' },
  { id: '2', patientName: 'Jane Smith', date: '2024-01-14T14:30:00Z', status: 'completed' },
  { id: '3', patientName: 'Bob Johnson', date: '2024-01-13T09:15:00Z', status: 'completed' },
  { id: '4', patientName: 'Alice Brown', date: '2024-01-16T11:00:00Z', status: 'upcoming' },
  { id: '5', patientName: 'Charlie Wilson', date: '2024-01-12T16:45:00Z', status: 'completed' },
];

const mockNotifications = [
  { _id: '1', type: 'appointment_requested', message: 'New appointment request from Sarah Connor', read: false, createdAt: '2024-01-15T08:00:00Z' },
  { _id: '2', type: 'appointment_confirmed', message: 'Appointment confirmed with John Doe', read: true, createdAt: '2024-01-14T12:00:00Z' },
];

const DoctorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Mock profile data
  const profileData = {
    name: 'Sarah Johnson',
    email: 'dr.sarah@hospital.com',
    specialty: 'Cardiology',
    imageUrl: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
    consultationFee: 500,
    experience: '10 years',
    location: 'New York Medical Center'
  };

  // Calculate stats
  const upcomingCount = mockAppointments.filter(a => a.status === 'upcoming').length;
  const unreadCount = mockNotifications.filter(n => !n.read).length;
  const totalPatients = [...new Set(mockAppointments.map(a => a.patientName))].length;
  const monthlyEarnings = mockAppointments.length * profileData.consultationFee;

  // Chart data
  const weeklyData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i);
      const key = format(day, 'yyyy-MM-dd');
      data.push({ 
        date: format(day, 'MMM d'), 
        count: mockAppointments.filter(a => 
          format(new Date(a.date), 'yyyy-MM-dd') === key
        ).length 
      });
    }
    return data;
  }, []);

  const monthlyData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const m = subMonths(now, i);
      const key = format(startOfMonth(m), 'yyyy-MM');
      data.push({ 
        month: format(m, 'MMM yyyy'), 
        count: Math.floor(Math.random() * 20) + 5 // Mock data
      });
    }
    return data;
  }, []);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    // Handle logout logic here
    console.log('Logging out...');
    setIsLogoutModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden">
      {/* Three.js Background */}
      <ThreeBackground activeTab={activeTab} />
      
      {/* Floating Navbar */}
      <FloatingNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        upcomingCount={upcomingCount}
        unreadCount={unreadCount}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="pt-24 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center mb-8">
              <ProfileAvatar3D
                imageUrl={profileData.imageUrl}
                name={profileData.name}
                size={150}
              />
            </div>
            
            <motion.h1
              className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Welcome Back, Dr. {profileData.name}
            </motion.h1>
            
            <motion.p
              className="text-xl text-gray-300 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {profileData.specialty} • {profileData.experience} Experience
            </motion.p>
            
            <motion.p
              className="text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {profileData.location}
            </motion.p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
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
              value={totalPatients}
              icon={Users}
              gradient="from-green-500 to-emerald-500"
              delay={0.2}
              glowColor="green"
            />
            <StatsCard
              title="Monthly Earnings"
              value={`₹${monthlyEarnings.toLocaleString()}`}
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
                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {[
                    { icon: Stethoscope, title: 'Start Consultation', color: 'from-blue-500 to-cyan-500' },
                    { icon: Heart, title: 'Patient Records', color: 'from-red-500 to-pink-500' },
                    { icon: Activity, title: 'Health Analytics', color: 'from-green-500 to-emerald-500' }
                  ].map((action, index) => (
                    <motion.button
                      key={action.title}
                      className={`relative group bg-gradient-to-r ${action.color} rounded-2xl p-6 text-white font-semibold text-lg shadow-2xl overflow-hidden`}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10 flex items-center space-x-3">
                        <action.icon className="w-8 h-8" />
                        <span>{action.title}</span>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'appointments' && (
              <motion.div
                key="appointments"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Unread Notifications */}
                {mockNotifications.filter(n => !n.read).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-6"
                  >
                    <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center">
                      <AlertCircle className="w-6 h-6 mr-2" />
                      New Appointment Requests
                    </h3>
                    {mockNotifications.filter(n => !n.read).map((notif, index) => (
                      <motion.div
                        key={notif._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-yellow-500/10 rounded-2xl p-4 mb-3 last:mb-0"
                      >
                        <p className="text-yellow-100">{notif.message}</p>
                        <p className="text-yellow-300/70 text-sm mt-1">
                          {format(new Date(notif.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Appointments List */}
                <div className="space-y-4">
                  {mockAppointments.map((appointment, index) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 10 }}
                      className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-semibold text-lg">
                              {appointment.patientName}
                            </h4>
                            <p className="text-gray-300">
                              {format(new Date(appointment.date), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            appointment.status === 'upcoming' 
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              : 'bg-green-500/20 text-green-300 border border-green-500/30'
                          }`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl font-medium"
                          >
                            View Details
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Other tabs content can be added here */}
            {activeTab !== 'overview' && activeTab !== 'appointments' && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center py-20"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Activity className="w-12 h-12 text-white" />
                </motion.div>
                <h2 className="text-4xl font-bold text-white mb-4 capitalize">
                  {activeTab} Section
                </h2>
                <p className="text-gray-300 text-xl">
                  This section is coming soon with amazing 3D features!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Logout Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Confirm Logout</h3>
              <p className="text-gray-300 mb-6">Are you sure you want to logout?</p>
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmLogout}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-xl font-medium"
                >
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorDashboard;