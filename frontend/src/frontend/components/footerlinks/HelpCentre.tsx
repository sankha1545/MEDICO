// File: src/frontend/components/footerlinks/HelpCentre.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  HelpCircle,
  PhoneCall,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { BackgroundAnimation } from '../animations/BackGroundAnimations';
import { Button } from '../common/Button';

interface Topic {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export const HelpCentre: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const topics: Topic[] = [
    {
      id: 1,
      icon: <HelpCircle size={32} className="text-blue-400" />, 
      title: 'Getting Started',
      description: 'Learn how to sign up, book your first appointment, and set up your profile.',
      link: '/help/getting-started',
    },
    {
      id: 2,
      icon: <PhoneCall size={32} className="text-green-400" />,
      title: 'Contact Doctors',
      description: 'Find out how to message or call your healthcare provider through the platform.',
      link: '/help/contacting-doctors',
    },
    {
      id: 3,
      icon: <Mail size={32} className="text-pink-400" />,
      title: 'Support',
      description: 'Get in touch with our support team for any queries or issues.',
      link: '/help/support',
    },
  ];

  const faqs: FAQ[] = [
    {
      id: 1,
      question: 'How do I book my first appointment?',
      answer: 'To book your first appointment, create an account, browse available doctors, select a time slot, and confirm. You will receive a confirmation email with details.',
      category: 'Appointments',
    },
    {
      id: 2,
      question: 'Can I reschedule or cancel my appointment?',
      answer: 'Yes, you can reschedule or cancel up to 24 hours before. In your dashboard, find the appointment and select reschedule or cancel.',
      category: 'Appointments',
    },
    {
      id: 3,
      question: 'What payment methods do you accept?',
      answer: 'We accept major credit cards (Visa, MasterCard, AmEx), PayPal, and insurance plans. Add payment methods in account settings.',
      category: 'Billing',
    },
    {
      id: 4,
      question: 'Is my information secure?',
      answer: 'Absolutely. We use industry-standard encryption and comply with HIPAA guidelines to protect your data.',
      category: 'Security',
    },
  ];

  useEffect(() => {
    const results = topics.filter(t =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTopics(results);
  }, [searchTerm]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
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
          <motion.h1
            className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Help Center
          </motion.h1>
          <motion.p
            className="text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Find answers to common questions or reach out to our support team for assistance.
          </motion.p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
            <input
              type="text"
              placeholder="Search topics or keywords..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 text-lg"
            />
          </div>
        </motion.div>

        {/* Topics Grid */}
        <motion.div
          className="max-w-6xl mx-auto mb-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h2 className="text-3xl font-bold text-white text-center mb-12" variants={itemVariants}>
            Popular Topics
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTopics.length > 0 ? (
              filteredTopics.map(topic => (
                <motion.div
                  key={topic.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-blue-400/50 transition-all duration-300 cursor-pointer"
                  onClick={() => window.location.href = topic.link}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-white/10 rounded-full group-hover:bg-blue-400/20 transition-colors duration-300">
                      {topic.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{topic.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{topic.description}</p>
                    <span className="text-blue-400 font-medium">Learn More →</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.p className="text-center text-gray-400 mt-8 text-lg" variants={itemVariants}>
                No topics found for "{searchTerm}"
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="max-w-4xl mx-auto mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2 className="text-3xl font-bold text-white text-center mb-12" variants={itemVariants}>
            Frequently Asked Questions
          </motion.h2>
          <div className="space-y-4">
            {faqs.map(faq => (
              <motion.div key={faq.id} variants={itemVariants} className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
                <button
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-white/5 transition-colors duration-300"
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                >
                  <span className="text-white font-medium">{faq.question}</span>
                  <motion.div animate={{ rotate: expandedFAQ === faq.id ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className="text-blue-400" size={20} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedFAQ === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-4"
                    >
                      <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Support Options */}
        <motion.div
          className="max-w-6xl mx-auto mb-20 text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2 className="text-3xl font-bold text-white mb-12" variants={itemVariants}>
            Still Need Help?
          </motion.h2>
          <div className="flex justify-center space-x-6">
            <Button onClick={() => window.location.href = '/support/live-chat'}>
              Live Chat
            </Button>
            <Button onClick={() => window.location.href = 'mailto:support@medico.com'}>
              Email Us
            </Button>
            <Button onClick={() => window.location.href = '/help/contact'}>
              Contact Form
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpCentre;
