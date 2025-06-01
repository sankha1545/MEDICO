import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, User, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { Button } from '../../common/Button';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Open the logout confirmation dialog
  const openLogoutConfirm = () => {
    setIsLogoutConfirmOpen(true);
    setIsProfileMenuOpen(false);
  };

  // Close the logout confirmation dialog
  const closeLogoutConfirm = () => {
    setIsLogoutConfirmOpen(false);
  };

  // Perform actual logout and redirect to login
  const confirmLogout = () => {
    console.log('confirmLogout called'); // debug log
    // 1) Navigate first
    navigate('/login');
    // 2) Then call logout
    logout();
    // 3) Close the modal
    setIsLogoutConfirmOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-soft py-2' : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo and brand */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-primary-500 mr-2">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                  </div>
                </motion.div>
                <motion.span
                  className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  MedBook
                </motion.span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/doctors">Doctors</NavLink>
              <NavLink to="/services">Services</NavLink>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/contact">Contact</NavLink>
              <NavLink to="/dashboard">Dashboard</NavLink>
              {isAuthenticated ? (
                <div className="relative ml-3">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors"
                  >
                    <span>{user?.name}</span>
                    <ChevronDown size={16} />
                  </button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-10 border border-gray-200"
                      >
                        <div className="py-1">
                          <Link
                            to="/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <User size={16} className="mr-2" />
                            Dashboard
                          </Link>
                          <Link
                            to="/appointments"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <Calendar size={16} className="mr-2" />
                            My Appointments
                          </Link>
                          <button
                            onClick={openLogoutConfirm}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <LogOut size={16} className="mr-2" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild variant="primary" size="sm">
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white shadow-lg overflow-hidden"
            >
              <div className="px-4 pt-2 pb-3 space-y-1 sm:px-3">
                <MobileNavLink to="/">Home</MobileNavLink>
                <MobileNavLink to="/doctors">Doctors</MobileNavLink>
                <MobileNavLink to="/services">Services</MobileNavLink>
                <MobileNavLink to="/about">About</MobileNavLink>
                <MobileNavLink to="/contact">Contact</MobileNavLink>

                {isAuthenticated ? (
                  <>
                    <MobileNavLink to="/dashboard">Dashboard</MobileNavLink>
                    <MobileNavLink to="/appointments">My Appointments</MobileNavLink>
                    <button
                      onClick={openLogoutConfirm}
                      className="w-full flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-500 hover:bg-gray-50 rounded-md"
                    >
                      <LogOut size={18} className="mr-2" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2 pt-2">
                    <Button as={Link} to="/login" variant="outline" fullWidth>
                      Login
                    </Button>
                    <Button as={Link} to="/signup" variant="primary" fullWidth>
                      Sign Up
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
        {isLogoutConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            {/* Semi-transparent overlay */}
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={closeLogoutConfirm}
            />

            {/* Dialog box */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white rounded-lg shadow-lg p-6 max-w-sm w-full z-10"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Confirm Logout
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to log out?
              </p>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={closeLogoutConfirm}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={confirmLogout}>
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

// Desktop navigation link
const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`relative text-sm font-medium transition-colors ${
        isActive ? 'text-primary-500' : 'text-gray-700 hover:text-primary-500'
      }`}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="navigation-underline"
          className="absolute left-0 right-0 h-0.5 bg-primary-500 bottom-[-5px]"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );
};

// Mobile navigation link
const MobileNavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded-md text-base font-medium ${
        isActive
          ? 'text-primary-500 bg-gray-50'
          : 'text-gray-700 hover:text-primary-500 hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  );
};
