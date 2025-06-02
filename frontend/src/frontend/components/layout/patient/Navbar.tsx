// src/frontend/components/common/Navbar.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useCycle } from 'framer-motion';
import { Menu, X, ChevronDown, User, Calendar, LogOut, Home, BookOpen, Info, Phone, HeartPulse } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { Button } from '../../common/Button';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModal, setIsLogoutModal] = useState(false);
  const [isMobileOpen, toggleMobile] = useCycle(false, true);

  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll effect: blur & backdrop
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    if (isMobileOpen) toggleMobile();
  }, [location.pathname]);

  const openLogout = () => {
    setIsLogoutModal(true);
    setIsProfileOpen(false);
  };
  const closeLogout = () => setIsLogoutModal(false);
  const confirmLogout = () => {
    logout();
    navigate('/login');
    setIsLogoutModal(false);
  };

  return (
    <>
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/70 backdrop-blur-md shadow-md py-2'
            : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo + Brand */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center"
          >
            <Link to="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="text-primary-600"
              >
                <HeartPulse size={32} />
              </motion.div>
              <motion.span
                className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-secondary-500 to-indigo-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                MedBook
              </motion.span>
            </Link>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <DesktopLink to="/" Icon={Home}>Home</DesktopLink>
            <DesktopLink to="/doctors" Icon={BookOpen}>Doctors</DesktopLink>
            <DesktopLink to="/services" Icon={HeartPulse}>Services</DesktopLink>
            <DesktopLink to="/about" Icon={Info}>About</DesktopLink>
            <DesktopLink to="/contact" Icon={Phone}>Contact</DesktopLink>
            {isAuthenticated && <DesktopLink to="/dashboard" Icon={User}>Dashboard</DesktopLink>}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(open => !open)}
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <motion.span whileHover={{ scale: 1.05 }} className="capitalize">
                    {user?.name}
                  </motion.span>
                  <ChevronDown size={16} />
                </button>
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
                    >
                      <ProfileItem to="/dashboard" icon={<User size={16} />}>Dashboard</ProfileItem>
                      <ProfileItem to="/appointments" icon={<Calendar size={16} />}>My Appointments</ProfileItem>
                      <ProfileButton onClick={openLogout} icon={<LogOut size={16} />}>Logout</ProfileButton>
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

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <motion.button
              onClick={() => toggleMobile()}
              className="text-gray-600"
              whileTap={{ scale: 0.9 }}
            >
              {isMobileOpen ? (
                <X size={28} className="stroke-primary-600" />
              ) : (
                <Menu size={28} className="stroke-primary-600" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Overlay Menu */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black z-40"
                onClick={() => toggleMobile()}
              />

              {/* Menu Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.4 }}
                className="fixed top-0 right-0 w-4/5 h-full bg-white shadow-2xl z-50 p-6 flex flex-col"
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
                  }}
                  className="mt-10 space-y-6"
                >
                  <MobileLink to="/" Icon={Home}>Home</MobileLink>
                  <MobileLink to="/doctors" Icon={BookOpen}>Doctors</MobileLink>
                  <MobileLink to="/services" Icon={HeartPulse}>Services</MobileLink>
                  <MobileLink to="/about" Icon={Info}>About</MobileLink>
                  <MobileLink to="/contact" Icon={Phone}>Contact</MobileLink>
                  {isAuthenticated && (
                    <>
                      <MobileLink to="/dashboard" Icon={User}>Dashboard</MobileLink>
                      <MobileLink to="/appointments" Icon={Calendar}>My Appointments</MobileLink>
                      <motion.button
                        onClick={openLogout}
                        className="flex items-center space-x-2 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                        whileHover={{ x: 5 }}
                      >
                        <LogOut size={18} />
                        <span>Logout</span>
                      </motion.button>
                    </>
                  )}
                  {!isAuthenticated && (
                    <>
                      <Button as={Link} to="/login" variant="outline" fullWidth>Login</Button>
                      <Button as={Link} to="/signup" variant="primary" fullWidth>Sign Up</Button>
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
            className="fixed inset-0 flex items-center justify-center z-60"
          >
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={closeLogout}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full z-10"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Logout</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={closeLogout}>Cancel</Button>
                <Button variant="primary" onClick={confirmLogout}>Yes, Log Out</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

type LinkProps = {
  to: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
};

// Desktop link with gradient underline on active
const DesktopLink = ({ to, Icon, children }: LinkProps) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <motion.div className="relative flex items-center space-x-1">
      <Icon size={18} className={active ? 'text-primary-600' : 'text-gray-600'} />
      <Link
        to={to}
        className={`text-base font-medium transition-colors ${
          active ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
        }`}
      >
        {children}
      </Link>
      {active && (
        <motion.div
          layoutId="nav-underline"
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.div>
  );
};

// Mobile link with fade-in
const MobileLink = ({ to, Icon, children }: LinkProps) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        to={to}
        className={`flex items-center space-x-2 text-lg font-medium px-3 py-2 rounded-lg transition-colors ${
          active
            ? 'text-primary-600 bg-gray-100'
            : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
        }`}
      >
        <Icon size={20} />
        <span>{children}</span>
      </Link>
    </motion.div>
  );
};

type ProfileProps = {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

const ProfileItem = ({ to, icon, children }: ProfileProps) => (
  <Link
    to={to}
    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
  >
    <span className="mr-2">{icon}</span>
    {children}
  </Link>
);

const ProfileButton = ({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode; }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
  >
    <span className="mr-2">{icon}</span>
    {children}
  </button>
);
