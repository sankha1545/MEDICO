import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Users, FileText, Phone, Mail, MapPin } from 'lucide-react';
import { BackgroundAnimation } from '../animations/BackGroundAnimations';

export const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);  
  }, []);

  const sections = [
    {
      id: 1,
      icon: <FileText className="text-blue-400" size={24} />,
      title: 'Introduction',
      content: 'Welcome to MedicoX. We\'re committed to keeping your personal information safe and secure. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data.',
    },
    {
      id: 2,
      icon: <Eye className="text-green-400" size={24} />,
      title: 'Information We Collect',
      content: 'We collect various types of information to provide and improve our services:',
      list: [
        'Account Data: Name, email address, phone number, and password when you create an account.',
        'Profile Information: Medical history, insurance details, and appointment preferences you provide.',
        'Usage Data: Browsing patterns, pages visited, and features used on our platform.',
        'Device & Log Data: IP address, browser type, device identifiers, and server logs collected automatically.',
      ],
    },
    {
      id: 3,
      icon: <Users className="text-purple-400" size={24} />,
      title: 'How We Use Your Information',
      content: 'We use collected information for:',
      list: [
        'Providing and improving our services (e.g., booking appointments, telehealth visits).',
        'Communicating with you (e.g., appointment reminders, account notifications).',
        'Personalizing your experience (e.g., recommending doctors, health tips).',
        'Ensuring security and preventing fraud (e.g., verifying identity, monitoring unauthorized activity).',
      ],
    },
    {
      id: 4,
      icon: <Lock className="text-pink-400" size={24} />,
      title: 'Data Security',
      content: 'We implement appropriate technical and organizational measures to protect your data:',
      list: [
        'Encrypted connections (HTTPS) for data in transit.',
        'Secure storage with encryption at rest.',
        'Regular security audits and vulnerability assessments.',
        'Restricted access to personal data based on "need-to-know."',
      ],
    },
    {
      id: 5,
      icon: <Shield className="text-cyan-400" size={24} />,
      title: 'Your Rights',
      content: 'Depending on your jurisdiction, you may have the right to:',
      list: [
        'Access and obtain a copy of your personal data.',
        'Request correction or deletion of inaccurate data.',
        'Opt out of certain processing activities (e.g., marketing).',
        'Lodge a complaint with a supervisory authority.',
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundAnimation />
      
      <div className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          className="max-w-4xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Shield size={48} className="text-blue-400" />
            </div>
          </motion.div>
          <motion.h1
            className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            className="text-xl text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Your privacy is critically important to us. This policy explains how we collect, use, and protect your information.
          </motion.p>
          <motion.p
            className="text-sm text-gray-400 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Last Updated: January 15, 2025
          </motion.p>
        </motion.div>

        {/* Content Sections */}
        <motion.div
          className="max-w-4xl mx-auto space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {sections.map((section, idx) => (
            <motion.div
              key={section.id}
              variants={sectionVariants}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-blue-400/30 transition-all duration-300"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="flex items-center space-x-4 mb-6">
                <motion.div
                  className="p-3 bg-white/10 rounded-full"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  {section.icon}
                </motion.div>
                <h2 className="text-2xl font-bold text-white">
                  {section.id}. {section.title}
                </h2>
              </div>
              <motion.p
                className="text-gray-300 leading-relaxed mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                {section.content}
              </motion.p>
              {section.list && (
                <motion.ul
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  {section.list.map((item, itemIdx) => (
                    <motion.li
                      key={itemIdx}
                      className="flex items-start space-x-3 text-gray-300"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: itemIdx * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </motion.div>
          ))}

          {/* Contact Section */}
          <motion.div
            variants={sectionVariants}
            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/30"
          >
            <div className="flex items-center space-x-4 mb-6">
              <motion.div
                className="p-3 bg-blue-400/20 rounded-full"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Phone className="text-blue-400" size={24} />
              </motion.div>
              <h2 className="text-2xl font-bold text-white">Contact Us</h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-6">
              If you have questions or concerns about this Privacy Policy, please reach out:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Mail size={20} />, label: 'Email', value: 'privacy@medicox.com' },
                { icon: <Phone size={20} />, label: 'Phone', value: '+1 (555) 987-6543' },
                { icon: <MapPin size={20} />, label: 'Address', value: '123 Healthcare Avenue, Medical District, New York, NY 10001' },
              ].map((contact, idx) => (
                <motion.div
                  key={contact.label}
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ x: 5 }}
                >
                  <div className="text-blue-400 mt-1">{contact.icon}</div>
                  <div>
                    <p className="text-white font-medium">{contact.label}</p>
                    <p className="text-gray-300 text-sm">{contact.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
export default PrivacyPolicy