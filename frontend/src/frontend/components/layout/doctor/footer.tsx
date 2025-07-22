import React from 'react';
import { motion } from 'framer-motion';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  HeartPulse,
} from 'lucide-react';

export const DoctorFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  ];



  const supportLinks = [
    { label: 'FAQs', href: '/faq' },
    { label: 'Privacy Policy', href: '/privacypolicy' },
    { label: 'Terms of Service', href: '/tos' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Help Center', href: '/helpcentre' },
  ];

  return (
    <footer className="relative overflow-hidden text-white">
      {/* Animated background elements */}
      <motion.div
        className="absolute rounded-full -top-20 -left-20 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute rounded-full -bottom-20 -right-20 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      <div className="relative z-10 px-6 py-16 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <HeartPulse size={32} className="text-blue-400" />
              </motion.div>
              <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
                MedicoX
              </span>
            </div>
            <p className="leading-relaxed text-gray-300">
              Revolutionizing healthcare access with cutting-edge technology and compassionate care. Your health, our priority.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, idx) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 text-gray-300 transition-all duration-300 rounded-full bg-white/10 backdrop-blur-sm hover:text-white hover:bg-blue-500/20"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </motion.div>

       

          {/* Support */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-semibold text-white">Support</h3>
            <ul className="space-y-3">
              {supportLinks.map((link, idx) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <motion.a
                    href={link.href}
                    className="flex items-center text-gray-300 transition-colors duration-300 hover:text-blue-400 group"
                    whileHover={{ x: 5 }}
                  >
                    <span className="w-2 h-2 mr-3 transition-opacity duration-300 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100" />
                    {link.label}
                  </motion.a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-semibold text-white">Contact Us</h3>
            <div className="space-y-4">
              <motion.div
                className="flex items-start space-x-3"
                whileHover={{ x: 5 }}
                transition={{ duration: 0.3 }}
              >
                <MapPin size={20} className="flex-shrink-0 mt-1 text-blue-400" />
                <span className="text-sm text-gray-300">
                  123 Healthcare Avenue, Medical District, New York, NY 10001
                </span>
              </motion.div>
              <motion.div
                className="flex items-center space-x-3"
                whileHover={{ x: 5 }}
                transition={{ duration: 0.3 }}
              >
                <Phone size={20} className="flex-shrink-0 text-blue-400" />
                <span className="text-sm text-gray-300">+1 (555) 987-6543</span>
              </motion.div>
              <motion.div
                className="flex items-center space-x-3"
                whileHover={{ x: 5 }}
                transition={{ duration: 0.3 }}
              >
                <Mail size={20} className="flex-shrink-0 text-blue-400" />
                <span className="text-sm text-gray-300">medicox271@gmail.com</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="flex flex-col items-center justify-between pt-8 mt-12 border-t border-gray-700 md:flex-row"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <p className="text-sm text-gray-400">
            © {currentYear} MedicoX. All rights reserved.
          </p>
        
        </motion.div>
      </div>
    </footer>
  );
};