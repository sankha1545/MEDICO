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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModal, setIsLogoutModal] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Change navbar style on scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // 3. Open/close logout modal
  const openLogout = () => {
    setIsLogoutModal(true);
    setIsProfileOpen(false);
  };
  const closeLogout = () => setIsLogoutModal(false);

  // 4. Logout → navigate to "/login"
  const confirmLogout = () => {
    logout();
    setIsLogoutModal(false);
    navigate('/login', { replace: true });
  };

  // Framer Motion variants
  const linkVariants: Variants = {
    initial: { y: 20, opacity: 0 },
    animate: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: { delay: i * 0.08, type: 'spring', stiffness: 300 },
    }),
    hover: { scale: 1.1, color: '#FF6B6B' },
  };

  const mobileBgVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <>
      {/* 🌈 Animated Decorative Blob Behind the Navbar */}
      <motion.div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mix-blend-overlay filter blur-3xl opacity-30 z-0"
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 10, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror' }}
      />

      <nav
        className={`fixed w-full z-50 transition-all duration-500 ${
          isScrolled
            ? 'backdrop-blur-lg bg-white/30 shadow-lg py-2'
            : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center relative z-10">
          {/* Logo & Brand */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center space-x-2"
          >
            <motion.div
              className="relative flex items-center justify-center text-primary-600"
              whileHover={{ rotate: 360, scale: 1.2 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <HeartPulse size={36} />
              {/* Pulsating circle behind the heart */}
              <motion.span
                className="absolute inset-0 rounded-full bg-pink-400"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <motion.span
              className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-indigo-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              MedBook
            </motion.span>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-10">
            {[
              { to: '/home', label: 'Home', Icon: Home },
              { to: '/doctors', label: 'Doctors', Icon: BookOpen },
              { to: '/services', label: 'Services', Icon: HeartPulse },
              { to: '/about', label: 'About', Icon: Info },
              { to: '/contact', label: 'Contact', Icon: Phone },
              ...(isAuthenticated
                ? [{ to: '/dashboard', label: 'Dashboard', Icon: User }]
                : []),
            ].map((item, idx) => {
              const active = location.pathname === item.to;
              return (
                <motion.div
                  key={item.to}
                  custom={idx}
                  variants={linkVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                  className="relative"
                >
                  <Link
                    to={item.to}
                    className={`flex items-center space-x-1 text-lg font-medium transition-colors ${
                      active
                        ? 'text-pink-500'
                        : 'text-white hover:text-pink-500'
                    }`}
                  >
                    <item.Icon
                      size={20}
                      className={active ? 'text-pink-500' : 'text-white'}
                    />
                    <span>{item.label}</span>
                  </Link>
                  {active && (
                    <motion.div
                      layoutId="underline"
                      className="absolute bottom-[-4px] left-0 right-0 h-1 bg-pink-500 rounded-full"
                    />
                  )}
                </motion.div>
              );
            })}

            {/* Profile Dropdown or Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <motion.button
                  onClick={() => setIsProfileOpen((p) => !p)}
                  className="flex items-center space-x-1 text-white hover:text-pink-500 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.span
                    className="capitalize"
                    animate={{ x: [0, -3, 0], opacity: [1, 0.8, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {user?.name}
                  </motion.span>
                  <ChevronDown size={18} />
                </motion.button>
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
                    >
                      <ProfileItem
                        to="/dashboard"
                        icon={<User size={18} />}
                      >
                        Dashboard
                      </ProfileItem>
                      <ProfileItem
                        to="/appointments"
                        icon={<Calendar size={18} />}
                      >
                        My Appointments
                      </ProfileItem>
                      <ProfileButton
                        onClick={openLogout}
                        icon={<LogOut size={18} />}
                      >
                        Logout
                      </ProfileButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex space-x-4">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button asChild variant="outline" size="md">
                    <Link to="/login">Login</Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button asChild variant="gradient" size="md">
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </motion.div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="lg:hidden z-20">
            <motion.button
              onClick={() => setIsMobileOpen((p) => !p)}
              className="text-gray-800"
              whileTap={{ scale: 0.9 }}
            >
              {isMobileOpen ? (
                <X size={28} className="stroke-pink-500" />
              ) : (
                <Menu size={28} className="stroke-pink-500" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Overlay Menu */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              {/* Semi-transparent backdrop */}
              <motion.div
                variants={mobileBgVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="fixed inset-0 bg-black bg-opacity-50 z-30"
                onClick={() => setIsMobileOpen(false)}
              />

              {/* Sliding Menu Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.4 }}
                className="fixed top-0 right-0 w-4/5 h-full bg-gradient-to-br from-pink-500 to-purple-600 z-40 p-8 flex flex-col"
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: {
                      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
                    },
                  }}
                  className="mt-12 space-y-6"
                >
                  {[
                    { to: '/', label: 'Home', Icon: Home },
                    { to: '/doctors', label: 'Doctors', Icon: BookOpen },
                    { to: '/services', label: 'Services', Icon: HeartPulse },
                    { to: '/about', label: 'About', Icon: Info },
                    { to: '/contact', label: 'Contact', Icon: Phone },
                    ...(isAuthenticated
                      ? [{ to: '/dashboard', label: 'Dashboard', Icon: User }]
                      : []),
                  ].map((item, idx) => {
                    const active = location.pathname === item.to;
                    return (
                      <motion.div
                        key={item.to}
                        custom={idx}
                        variants={linkVariants}
                        initial="initial"
                        animate="animate"
                      >
                        <Link
                          to={item.to}
                          className={`flex items-center space-x-3 text-2xl font-semibold transition-colors ${
                            active
                              ? 'text-white'
                              : 'text-gray-200 hover:text-white'
                          }`}
                          onClick={() => setIsMobileOpen(false)}
                        >
                          <item.Icon
                            size={26}
                            className={active ? 'text-white' : 'text-gray-200'}
                          />
                          <span>{item.label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}

                  {isAuthenticated ? (
                    <motion.button
                      custom={6}
                      variants={linkVariants}
                      initial="initial"
                      animate="animate"
                      onClick={() => {
                        openLogout();
                        setIsMobileOpen(false);
                      }}
                      className="flex items-center space-x-3 text-2xl font-semibold text-white hover:text-white"
                    >
                      <LogOut size={26} />
                      <span>Logout</span>
                    </motion.button>
                  ) : (
                    <>
                      <motion.div
                        custom={6}
                        variants={linkVariants}
                        initial="initial"
                        animate="animate"
                        className="mt-4"
                      >
                        <Button asChild variant="outline" fullWidth>
                          <Link to="/login" onClick={() => setIsMobileOpen(false)}>
                            Login
                          </Link>
                        </Button>
                      </motion.div>
                      <motion.div
                        custom={7}
                        variants={linkVariants}
                        initial="initial"
                        animate="animate"
                        className="mt-4"
                      >
                        <Button asChild variant="gradient" fullWidth>
                          <Link to="/signup" onClick={() => setIsMobileOpen(false)}>
                            Sign Up
                          </Link>
                        </Button>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div
              className="absolute inset-0 bg-black bg-opacity-60"
              onClick={closeLogout}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full z-10"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Confirm Logout
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to log out? You’ll be redirected to the login page.
              </p>
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={closeLogout}>
                  Cancel
                </Button>
                <Button variant="gradient" onClick={confirmLogout}>
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

// Reusable link for the profile dropdown (desktop)
type ProfileProps = {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};
const ProfileItem: React.FC<ProfileProps> = ({ to, icon, children }) => (
  <Link
    to={to}
    className="flex items-center px-4 py-3 hover:bg-gray-100 transition-colors"
  >
    <span className="mr-2 text-pink-500">{icon}</span>
    <span className="text-gray-800 font-medium">{children}</span>
  </Link>
);

// Reusable button for the profile dropdown
const ProfileButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ onClick, icon, children }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors"
  >
    <span className="mr-2 text-pink-500">{icon}</span>
    <span className="font-medium">{children}</span>
  </button>
);
