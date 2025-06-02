// src/frontend/components/common/footer/Footer.tsx
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Framer Motion variants for sections
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.6, ease: 'easeOut' },
    }),
  };

  const socialVariants = {
    hover: { scale: 1.2, rotate: 10, transition: { duration: 0.3, ease: 'easeInOut' } },
    tap: { scale: 0.9, rotate: 0 },
  };

  const linkVariants = {
    hover: { x: 5, color: '#A78BFA', transition: { duration: 0.3 } },
  };

  return (
    <footer className="relative bg-gradient-to-tr from-gray-900 to-gray-800 text-white overflow-hidden pt-16 pb-12">
      {/* Decorative Floating Blobs */}
      <motion.div
        className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-purple-700 opacity-20"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.05, 0.2] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-indigo-700 opacity-20"
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.05, 0.2] }}
        transition={{ repeat: Infinity, duration: 10, delay: 1, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="space-y-4"
          >
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <motion.div
                className="text-primary-400"
                whileHover={{ scale: 1.2, rotate: 15 }}
                transition={{ duration: 0.4 }}
              >
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
              </motion.div>
              <motion.span
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-secondary-400"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                MedBook
              </motion.span>
            </Link>
            <motion.p
              className="text-gray-300 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Simplifying healthcare access with intuitive online appointment booking and trusted doctor consultations.
            </motion.p>
            <div className="flex space-x-4">
              <SocialLink href="https://facebook.com" icon={<Facebook size={20} />} label="Facebook" />
              <SocialLink href="https://twitter.com" icon={<Twitter size={20} />} label="Twitter" />
              <SocialLink href="https://instagram.com" icon={<Instagram size={20} />} label="Instagram" />
              <SocialLink href="https://linkedin.com" icon={<Linkedin size={20} />} label="LinkedIn" />
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
              }}
            >
              {[
                { to: '/about', label: 'About Us' },
                { to: '/services', label: 'Our Services' },
                { to: '/doctors', label: 'Find Doctors' },
                { to: '/appointments', label: 'Book Appointment' },
                { to: '/blog', label: 'Health Blog' },
              ].map((link, idx) => (
                <motion.li key={idx} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                  <FooterLink to={link.to}>{link.label}</FooterLink>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Support */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } },
              }}
            >
              {[
                { to: '/faq', label: 'FAQs' },
                { to: '/PrivacyPolicy', label: 'Privacy Policy' },
                { to: '/TOS', label: 'Terms of Service' },
                { to: '/contact', label: 'Contact Us' },
                { to: '/helpcentre', label: 'Help Center' },
              ].map((link, idx) => (
                <motion.li key={idx} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                  <FooterLink to={link.to}>{link.label}</FooterLink>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <motion.li
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <MapPin size={18} className="text-primary-400 mr-2 mt-1 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  123 Healthcare Avenue, Medical District, New York, NY 10001
                </span>
              </motion.li>
              <motion.li
                className="flex items-center"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <Phone size={18} className="text-primary-400 mr-2 flex-shrink-0" />
                <span className="text-gray-300 text-sm">+1 (555) 987-6543</span>
              </motion.li>
              <motion.li
                className="flex items-center"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                <Mail size={18} className="text-primary-400 mr-2 flex-shrink-0" />
                <span className="text-gray-300 text-sm">contact@medbook.com</span>
              </motion.li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <p>© {currentYear} MedBook. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <FooterTextLink to="/privacy">Privacy</FooterTextLink>
            <FooterTextLink to="/terms">Terms</FooterTextLink>
            <FooterTextLink to="/cookies">Cookies</FooterTextLink>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

const SocialLink = ({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) => {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-10 h-10 rounded-full bg-gray-700 hover:bg-primary-500 flex items-center justify-center text-white transition-colors"
      variants={{
        hover: { scale: 1.2, rotate: 10, backgroundColor: '#7C3AED' },
        tap: { scale: 0.9 },
      }}
      whileHover="hover"
      whileTap="tap"
    >
      {icon}
    </motion.a>
  );
};

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  return (
    <motion.li
      whileHover="hover"
      variants={{ hover: { x: 5, color: '#A78BFA' } }}
      className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
    >
      <Link to={to}>{children}</Link>
    </motion.li>
  );
};

const FooterTextLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  return (
    <motion.div
      whileHover="hover"
      variants={{ hover: { y: -2, color: '#A78BFA' } }}
      className="hover:text-primary-400 transition-colors cursor-pointer"
    >
      <Link to={to}>{children}</Link>
    </motion.div>
  );
};
