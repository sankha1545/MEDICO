import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, User, Calendar, CreditCard, FileText, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { Button } from '../../common/Button';

export const DoctorNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  // scroll effect
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close mobile menu on route change
  useEffect(() => setIsMobileOpen(false), [location]);

  return (
    <nav className={`fixed w-full z-50 transition-all ${isScrolled ? 'bg-white shadow py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to="/doctor/dashboard" className="flex items-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary-500">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <motion.span
            className="ml-2 text-xl font-bold bg-gradient-to-r from-secondary-500 to-primary-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            MedBook
          </motion.span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-8 items-center">
          <NavLink to="/dashboard1">Dashboard</NavLink>
          <NavLink to="/doctor/appointments">Appointments</NavLink>
          <NavLink to="/doctor/patients">Patients</NavLink>
          <NavLink to="/doctor/earnings">Earnings</NavLink>
          <NavLink to="/doctor/reports">Reports</NavLink>

          {isAuthenticated ? (
            <div className="relative">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-1 text-gray-700 hover:text-secondary-500">
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
                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden"
                  >
                    <Link to="/doctor/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                      <Settings size={16} className="mr-2" />Settings
                    </Link>
                    <button onClick={() => { logout(); setIsProfileOpen(false);} } className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100">
                      <LogOut size={16} className="mr-2" />Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex space-x-4">
              <Button asChild variant="outline" size="sm"><Link to="/login">Login</Link></Button>
              <Button asChild variant="primary" size="sm"><Link to="/signup">Sign Up</Link></Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-gray-500 hover:text-gray-700">
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
            className="md:hidden bg-white shadow-lg"
          >
            <div className="px-4 pt-2 pb-3 space-y-1">
              <MobileNavLink to="/doctor/dashboard">Dashboard</MobileNavLink>
              <MobileNavLink to="/doctor/appointments">Appointments</MobileNavLink>
              <MobileNavLink to="/doctor/patients">Patients</MobileNavLink>
              <MobileNavLink to="/doctor/earnings">Earnings</MobileNavLink>
              <MobileNavLink to="/doctor/reports">Reports</MobileNavLink>

              {isAuthenticated ? (
                <button onClick={logout} className="w-full flex items-center px-3 py-2 text-gray-700 hover:text-secondary-500 hover:bg-gray-50 rounded-md">
                  <LogOut size={18} className="mr-2" /> Logout
                </button>
              ) : (
                <div className="space-y-2 pt-2">
                  <Button asChild fullWidth variant="outline"><Link to="/login">Login</Link></Button>
                  <Button asChild fullWidth variant="primary"><Link to="/signup">Sign Up</Link></Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`text-sm font-medium transition ${active ? 'text-secondary-500' : 'text-gray-700 hover:text-secondary-500'}`}>
      {children}
      {active && <motion.div layoutId="underline-doctor" className="h-0.5 bg-secondary-500 mt-1" />}
    </Link>
  );
};

const MobileNavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`block px-3 py-2 rounded-md text-base font-medium ${active ? 'text-secondary-500 bg-gray-50' : 'text-gray-700 hover:text-secondary-500 hover:bg-gray-50'}`}>
      {children}
    </Link>
  );
};
