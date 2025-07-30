// src/frontend/components/common/Navbar.tsx

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  User,
  Calendar,
  LogOut,
  Home,
  BookOpen,
  Info,
  Phone,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { Button } from '../../common/Button';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Add shadow/backdrop on scroll
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const openLogout = () => {
    setLogoutModal(true);
    setProfileOpen(false);
  };
  const closeLogout = () => setLogoutModal(false);
  const confirmLogout = () => {
    logout();
    setLogoutModal(false);
    navigate('/login', { replace: true });
  };

  const linkVariants: Variants = {
    initial: { y: 20, opacity: 0 },
    animate: i => ({
      y: 0,
      opacity: 1,
      transition: { delay: i * 0.05, type: 'spring', stiffness: 260 },
    }),
    hover: { scale: 1.1 },
  };
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
  };

  const menuItems = React.useMemo(
    () => [
      { to: '/home', label: 'Home', Icon: Home },
      { to: '/doctors', label: 'Doctors', Icon: BookOpen },
      { to: '/services', label: 'Services', Icon: HeartPulse },
      { to: '/about', label: 'About', Icon: Info },
      { to: '/contact', label: 'Contact', Icon: Phone },
      ...(isAuthenticated
        ? [{ to: '/dashboard', label: 'Dashboard', Icon: User }]
        : []),
    ],
    [isAuthenticated]
  );

  return (
    <>
      {/* Animated decorative blob */}
      <motion.div
        className="fixed top-0 z-0 w-64 h-64 -translate-x-1/2 rounded-full pointer-events-none inset-x-1/2 sm:w-96 sm:h-96 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mix-blend-overlay blur-3xl opacity-30"
        animate={{ scale: [1, 1.05, 1], rotate: [0, 8, 0] }}
        transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror' }}
      />

      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 
                    ${isScrolled ? 'backdrop-blur-md bg-white/30 shadow-md py-2' : 'bg-transparent py-4'}`}
      >
        <div className="flex items-center justify-between w-full max-w-6xl px-4 mx-auto sm:px-6 lg:px-8">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center space-x-2"
          >
            <motion.div
              whileHover={{ rotate: 360, scale: 1.2 }}
              transition={{ type: 'spring', stiffness: 220 }}
              className="relative text-primary-600"
            >
              <HeartPulse size={32} />
              <motion.span
                className="absolute inset-0 bg-pink-400 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </motion.div>
            <motion.span
              className="text-xl font-extrabold text-transparent sm:text-2xl md:text-3xl bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              MedicoX
            </motion.span>
          </motion.div>

          {/* Desktop Menu */}
          <div className="items-center hidden space-x-6 lg:flex lg:space-x-8">
            {menuItems.map((item, i) => {
              const active = location.pathname === item.to;
              return (
                <motion.div
                  key={item.to}
                  custom={i}
                  variants={linkVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                >
                  <Link
                    to={item.to}
                    className={`flex items-center space-x-1 text-base sm:text-lg font-medium transition-colors 
                                ${active ? 'text-pink-500' : 'text-white hover:text-pink-400'}`}
                  >
                    <item.Icon
                      size={20}
                      className={active ? 'text-pink-500' : 'text-white'}
                    />
                    <span>{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center space-x-1 text-white transition hover:text-pink-400"
                >
                  <span className="text-base capitalize">{user?.name}</span>
                  <ChevronDown size={16} />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 w-48 mt-2 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg"
                    >
                      <ProfileItem to="/dashboard" icon={<User size={18} />}>
                        Dashboard
                      </ProfileItem>
                      <ProfileItem to="/appointments" icon={<Calendar size={18} />}>
                        My Appointments
                      </ProfileItem>
                      <ProfileButton onClick={openLogout} icon={<LogOut size={18} />}>
                        Logout
                      </ProfileButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex space-x-2 sm:space-x-4">
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild variant="gradient" size="sm">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="text-white lg:hidden focus:outline-none"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 z-30 bg-black bg-opacity-50"
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                onClick={() => setMobileOpen(false)}
              />

              {/* Drawer Panel */}
              <motion.div
                className="fixed top-0 right-0 z-40 w-full h-full p-6 overflow-y-auto sm:w-4/5 sm:max-w-xs bg-gradient-to-br from-pink-500 to-purple-600"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
              >
                <div className="flex flex-col mt-8 space-y-4">
                  {menuItems.map((item, i) => (
                    <motion.div
                      key={item.to}
                      custom={i}
                      variants={linkVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <Link
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center space-x-3 text-xl sm:text-2xl font-semibold transition-colors 
                                   ${
                                     location.pathname === item.to
                                       ? 'text-white'
                                       : 'text-gray-200 hover:text-white'
                                   }`}
                      >
                        <item.Icon size={24} />
                        <span>{item.label}</span>
                      </Link>
                    </motion.div>
                  ))}

                  {isAuthenticated ? (
                    <motion.button
                      custom={menuItems.length}
                      variants={linkVariants}
                      initial="initial"
                      animate="animate"
                      onClick={() => {
                        openLogout();
                        setMobileOpen(false);
                      }}
                      className="flex items-center space-x-3 text-xl text-white transition-colors sm:text-2xl hover:text-gray-200"
                    >
                      <LogOut size={24} />
                      <span>Logout</span>
                    </motion.button>
                  ) : (
                    <>
                      <Button asChild variant="outline" fullWidth size="md">
                        <Link to="/login">Login</Link>
                      </Button>
                      <Button asChild variant="gradient" fullWidth size="md">
                        <Link to="/signup">Sign Up</Link>
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {logoutModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-60" onClick={closeLogout} />
            <motion.div
              className="relative w-11/12 max-w-sm p-6 text-center bg-white shadow-xl rounded-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <h3 className="mb-2 text-xl font-bold">Confirm Logout</h3>
              <p className="mb-4 text-gray-600">You’ll be redirected to the login page.</p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={closeLogout} size="sm">
                  Cancel
                </Button>
                <Button variant="gradient" onClick={confirmLogout} size="sm">
                  Yes, Log Out
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Profile dropdown link
type ProfileProps = {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};
const ProfileItem: React.FC<ProfileProps> = ({ to, icon, children }) => (
  <Link
    to={to}
    className="flex items-center px-4 py-2 transition-colors rounded-md hover:bg-gray-100"
  >
    <span className="mr-2 text-pink-500">{icon}</span>
    <span className="font-medium text-gray-800">{children}</span>
  </Link>
);

// Profile dropdown button
const ProfileButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ onClick, icon, children }) => (
  <button
    onClick={onClick}
    className="flex items-center w-full px-4 py-2 transition-colors rounded-md hover:bg-gray-100"
  >
    <span className="mr-2 text-pink-500">{icon}</span>
    <span className="font-medium text-gray-800">{children}</span>
  </button>
);
