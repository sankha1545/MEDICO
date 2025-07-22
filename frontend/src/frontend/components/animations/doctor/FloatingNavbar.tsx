import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Calendar,
  Users,
  DollarSign,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'overview', icon: Activity, label: 'Overview', color: 'from-cyan-400 to-blue-500' },
    { id: 'appointments', icon: Calendar, label: 'Appointments', color: 'from-orange-400 to-red-500', badge: upcomingCount },
    { id: 'patients', icon: Users, label: 'Patients', color: 'from-green-400 to-emerald-500' },
    { id: 'earnings', icon: DollarSign, label: 'Earnings', color: 'from-yellow-400 to-orange-500' },
    { id: 'messages', icon: Bell, label: 'Messages', color: 'from-purple-400 to-pink-500', badge: unreadCount },
    { id: 'profile', icon: UserIcon, label: 'Profile', color: 'from-pink-400 to-rose-500' },
    { id: 'logout', icon: LogOut, label: 'Logout', color: 'from-red-400 to-rose-500', isLogout: true }
  ];

  const handleTabClick = (tabId: string, isLogout?: boolean) => {
    if (isLogout) {
      onLogout();
    } else {
      setActiveTab(tabId);
    }
    setMobileMenuOpen(false);
  };

  const renderTabs = () => (
    tabs.map(tab => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;

      return (
        <motion.button
          key={tab.id}
          onClick={() => handleTabClick(tab.id, tab.isLogout)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={tab.label}
          className={`
            relative shrink-0 flex items-center justify-center
            w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14
            rounded-2xl transition-all duration-300
            ${isActive ? `bg-gradient-to-r ${tab.color} shadow-lg` : 'hover:bg-white/10'}
          `}
        >
          <Icon
            className={`w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 ${
              isActive ? 'text-white' : tab.isLogout ? 'text-red-400' : 'text-gray-300'
            }`}
          />
          {tab.badge && tab.badge > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 sm:w-5 h-5 flex items-center justify-center font-bold"
            >
              {tab.badge}
            </motion.div>
          )}
          {isActive && !tab.isLogout && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 border-2 rounded-2xl border-white/30"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </motion.button>
      );
    })
  );

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
      className="fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[95vw] sm:max-w-sm md:max-w-md lg:max-w-lg px-2 sm:px-0"
     style={{marginLeft:"-220px"}}
    >
      {/* Desktop Navbar */}
      <div className="items-center justify-between hidden p-2 overflow-x-auto border shadow-2xl sm:flex bg-black/20 backdrop-blur-xl border-white/10 rounded-3xl scrollbar-hide">
      
  {renderTabs()}

      </div>

      {/* Mobile Toggle Button */}
      
    </motion.div>
  );
};

export default FloatingNavbar;
