import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { Button } from '../../common/Button';

export const DoctorNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // scroll effect
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close mobile menu on route change
  useEffect(() => setIsMobileOpen(false), [location]);

  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    setIsMobileOpen(false);
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setIsLogoutModalOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Navbar */}
      <nav
        className={`fixed w-full z-50 transition-all ${
          isScrolled ? 'bg-white shadow py-2' : 'bg-transparent py-4'
        }`}
      >
        <div className="flex items-center justify-between px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/doctor/dashboard" className="flex items-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <motion.span
              className="ml-2 text-xl font-bold text-transparent bg-gradient-to-r from-pink-600 to-primary-500 bg-clip-text"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              MedicoX
            </motion.span>
          </Link>

          {/* Desktop Links */}
          <div className="items-center hidden space-x-8 md:flex">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen((open) => !open)}
                  className="flex items-center space-x-1 text-white hover:text-red-400"
                >
                  <User size={16} />
                  <span>{user?.name}</span>
                  <ChevronDown size={16} />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 w-48 mt-2 overflow-hidden bg-white border border-gray-200 rounded-md shadow-lg"
                    >
                      
                      
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild variant="primary" size="sm">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileOpen((open) => !open)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white shadow-lg md:hidden"
            >
              <div className="px-4 pt-2 pb-3 space-y-1">
                <MobileNavLink to="/doctor/dashboard">Home</MobileNavLink>
                <MobileNavLink to="/doctor/appointments">Appointments</MobileNavLink>
                <MobileNavLink to="/doctor/patients">Patients</MobileNavLink>
                <MobileNavLink to="/doctor/earnings">Earnings</MobileNavLink>
                <MobileNavLink to="/doctor/reports">Reports</MobileNavLink>

                {isAuthenticated ? (
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center w-full px-3 py-2 text-gray-700 rounded-md hover:text-secondary-500 hover:bg-gray-50"
                  >
                    <LogOut size={18} className="mr-2" /> Logout
                  </button>
                ) : (
                  <div className="pt-2 space-y-2">
                    <Button asChild fullWidth variant="outline">
                      <Link to="/login">Login</Link>
                    </Button>
                    <Button asChild fullWidth variant="primary">
                      <Link to="/signup">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm p-6 bg-white shadow-xl rounded-2xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h2 className="mb-4 text-lg font-semibold">Confirm Logout</h2>
              <p className="mb-6">Are you sure you want to logout?</p>
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setIsLogoutModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmLogout}>
                  Logout
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const MobileNavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded-md text-base font-medium ${
        active ? 'text-secondary-500 bg-gray-50' : 'text-gray-700 hover:text-secondary-500 hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  );
};
