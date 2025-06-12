import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, Shield, AlertTriangle, Scale, Globe, Phone, Mail } from 'lucide-react';
import { BackgroundAnimation } from '../animations/BackGroundAnimations';

export const TermsOfService: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      id: 1,
      icon: <FileText className="text-blue-400" size={24} />,
      title: 'Acceptance of Terms',
      content: 'By accessing or using MedicoX (the "Service"), you agree to comply with and be bound by these Terms of Service ("Terms"). If you disagree with any part of the Terms, you may not use the Service.',
    },
    {
      id: 2,
      icon: <Users className="text-green-400" size={24} />,
      title: 'Eligibility',
      content: 'You must be at least 18 years old to create an account and use the Service. By registering, you represent and warrant that you meet these eligibility requirements.',
    },
    {
      id: 3,
      icon: <Shield className="text-purple-400" size={24} />,
      title: 'User Accounts & Conduct',
      content: 'When you create an account, you agree to provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your login credentials. You agree not to:',
      list: [
        'Use the Service for any unlawful purpose.',
        'Harass, threaten, or violate the rights of others.',
        'Upload malicious content or viruses.',
        'Share your password or account with unauthorized users.',
      ],
    },
    {
      id: 4,
      icon: <Scale className="text-pink-400" size={24} />,
      title: 'Intellectual Property',
      content: 'All content provided on MedicoX, including text, graphics, logos, and software, is our property or licensed to us and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce or distribute our content without express written permission.',
    },
    {
      id: 5,
      icon: <AlertTriangle className="text-red-400" size={24} />,
      title: 'Disclaimers & Warranties',
      content: 'The Service is provided "as is" without any warranties. We do not guarantee uninterrupted or error-free service. Information on MedicoX is for general informational purposes only and should not replace professional medical advice.',
    },
    {
      id: 6,
      icon: <Globe className="text-cyan-400" size={24} />,
      title: 'Governing Law',
      content: 'These Terms are governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions. Any dispute shall be resolved in the state or federal courts located in New York County, NY.',
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
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
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
              <Scale size={48} className="text-purple-400" />
            </div>
          </motion.div>
          <motion.h1
            className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            Terms of Service
          </motion.h1>
          <motion.p
            className="text-xl text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Please read these terms carefully before using MedicoX. By accessing or using our services, you agree to be bound by these terms.
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
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-purple-400/30 transition-all duration-300"
              whileHover={{ scale: 1.02, x: 10 }}
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
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </motion.div>
          ))}

          {/* Important Notice */}
          <motion.div
            variants={sectionVariants}
            className="bg-gradient-to-r from-red-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-8 border border-red-400/30"
          >
            <div className="flex items-center space-x-4 mb-6">
              <motion.div
                className="p-3 bg-red-400/20 rounded-full"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <AlertTriangle className="text-red-400" size={24} />
              </motion.div>
              <h2 className="text-2xl font-bold text-white">Important Medical Disclaimer</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              <strong className="text-red-400">Medical Disclaimer:</strong> The information provided on MedicoX is for general informational purposes only and should not be considered as medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this platform.
            </p>
          </motion.div>

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
              <h2 className="text-2xl font-bold text-white">Contact Information</h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-6">
              If you have questions about these Terms, please contact us at:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: <Mail size={20} />, label: 'Email', value: 'legal@medicox.com' },
                { icon: <Phone size={20} />, label: 'Phone', value: '+1 (555) 987-6543' },
              ].map((contact, idx) => (
                <motion.div
                  key={contact.label}
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ x: 5 }}
                >
                  <div className="text-blue-400">{contact.icon}</div>
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
export default  TermsOfService