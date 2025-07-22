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
          isScrolled ? 'bg-transparent shadow py-2' : 'bg-transparent py-4'
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

       
       
      </nav>

     
    </>
  );
};


