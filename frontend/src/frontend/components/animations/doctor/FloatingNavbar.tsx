import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Calendar,
  Users,
  DollarSign,
  Bell,
  User as UserIcon,
  LogOut
} from 'lucide-react';

interface FloatingNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  upcomingCount: number;
  unreadCount: number;
  onLogout: () => void;
}

const FloatingNavbar: React.FC<FloatingNavbarProps> = ({
  activeTab,
  setActiveTab,
  upcomingCount,
  unreadCount,
  onLogout
}) => {
  const tabs = [
    { id: 'overview', icon: Activity, label: 'Overview', color: 'from-cyan-400 to-blue-500' },
    { id: 'appointments', icon: Calendar, label: 'Appointments', color: 'from-orange-400 to-red-500', badge: upcomingCount },
    { id: 'patients', icon: Users, label: 'Patients', color: 'from-green-400 to-emerald-500' },
    { id: 'earnings', icon: DollarSign, label: 'Earnings', color: 'from-yellow-400 to-orange-500' },
    { id: 'messages', icon: Bell, label: 'Messages', color: 'from-purple-400 to-pink-500', badge: unreadCount },
    { id: 'profile', icon: UserIcon, label: 'Profile', color: 'from-pink-400 to-rose-500' },
    { id: 'payout', icon: DollarSign, label: 'Payout', color: 'from-teal-400 to-cyan-500' }
  ];

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
      className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50"
    >
      <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-2xl">
        <div className="flex items-center space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-r ${tab.color} shadow-lg shadow-${tab.color.split('-')[1]}-500/50` 
                    : 'hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                title={tab.label}
              >
                <Icon 
                  className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-300'}`} 
                />
                {tab.badge && tab.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  >
                    {tab.badge}
                  </motion.div>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-2xl border-2 border-white/30"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
          
          <div className="w-px h-8 bg-white/20 mx-2" />
          
          <motion.button
            onClick={onLogout}
            className="flex items-center justify-center w-12 h-12 rounded-2xl hover:bg-red-500/20 transition-all duration-300"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            title="Logout"
          >
            <LogOut className="w-6 h-6 text-red-400" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default FloatingNavbar;