// src/frontend/pages/patient/HelpCenter.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageCircle, HelpCircle, PhoneCall, Mail } from 'lucide-react';
import Chatbot from '../../components/common/chatbot/chatbot';

interface Topic {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}

export default function HelpCenter() {
  // Sample topics for help center
  const topics: Topic[] = [
    {
      id: 1,
      icon: <HelpCircle size={28} className="text-purple-600" />,
      title: 'Getting Started',
      description: 'Learn how to sign up, book your first appointment, and set up your profile.',
      link: '/help/getting-started',
    },
    {
      id: 2,
      icon: <MessageCircle size={28} className="text-purple-600" />,
      title: 'Managing Appointments',
      description: 'View, reschedule, or cancel appointments. Understand reminders and notifications.',
      link: '/help/appointments',
    },
    {
      id: 3,
      icon: <PhoneCall size={28} className="text-purple-600" />,
      title: 'Contacting Doctors',
      description: 'Find out how to message or call your healthcare provider through the platform.',
      link: '/help/contacting-doctors',
    },
    {
      id: 4,
      icon: <Mail size={28} className="text-purple-600" />,
      title: 'Billing & Payments',
      description: 'Get details on accepted payment methods, invoices, and refund policies.',
      link: '/help/billing-payments',
    },
  ];

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>(topics);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const results = topics.filter((topic) =>
      topic.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTopics(results);
  }, [searchTerm]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.12, delayChildren: 0.2 },
    },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    hover: { scale: 1.03, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' },
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-100 to-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Background Floating Shapes */}
      <motion.div
        className="absolute top-0 left-[-40px] w-64 h-64 rounded-full bg-purple-200 opacity-20"
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.05, 0.2] }}
        transition={{ repeat: Infinity, duration: 7 }}
      />
      <motion.div
        className="absolute bottom-[-50px] right-[-60px] w-72 h-72 rounded-full bg-pink-200 opacity-20"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.05, 0.2] }}
        transition={{ repeat: Infinity, duration: 8, delay: 1 }}
      />

      {/* Hero Section */}
      <div className="max-w-3xl mx-auto text-center mb-12 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        >
          Help Center
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-4 text-lg text-gray-700"
        >
          Find answers to common questions or reach out to our support team for assistance.
        </motion.p>
      </div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="max-w-2xl mx-auto mb-10 relative z-10"
      >
        <div className="flex items-center bg-white rounded-full shadow-lg overflow-hidden">
          <Search className="w-6 h-6 text-gray-400 mx-3" />
          <input
            type="text"
            placeholder="Search topics or keywords…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 focus:outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
      </motion.div>

      {/* Topics Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10"
      >
        <AnimatePresence>
          {filteredTopics.map((topic, idx) => (
            <motion.div
              key={topic.id}
              variants={cardVariants}
              whileHover="hover"
              initial="hidden"
              animate="visible"
              layout
              className="bg-white rounded-3xl overflow-hidden shadow-lg cursor-pointer"
            >
              <motion.div className="p-6 flex flex-col items-center text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="p-4 bg-purple-50 rounded-full mb-4"
                >
                  {topic.icon}
                </motion.div>
                <motion.h3
                  className="text-xl font-semibold text-gray-800 mb-2"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 + 0.1, duration: 0.5 }}
                >
                  {topic.title}
                </motion.h3>
                <motion.p
                  className="text-gray-600 text-sm mb-4"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 + 0.2, duration: 0.5 }}
                >
                  {topic.description}
                </motion.p>
                <motion.a
                  href={topic.link}
                  whileHover={{ x: 5 }}
                  className="text-purple-600 font-medium hover:underline"
                >
                  Learn More →
                </motion.a>
              </motion.div>
            </motion.div>
          ))}
          {filteredTopics.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="col-span-full text-center text-gray-500 mt-8"
            >
              No topics found for "{searchTerm}"
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Support Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="max-w-4xl mx-auto mt-16 space-y-8 relative z-10"
      >
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-3xl font-semibold text-gray-800 text-center mb-4"
        >
          Still Need Help?
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Live Chat */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl shadow-lg flex flex-col items-center p-6 text-center cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="p-4 bg-indigo-50 rounded-full mb-3"
            >
              <MessageCircle size={32} className="text-indigo-600" />
            </motion.div>
            <h3 className="text-xl font-medium text-gray-800 mb-1">Live Chat</h3>
            <p className="text-gray-600 text-sm mb-4">
              Chat instantly with our support team for real-time assistance.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-full shadow hover:bg-indigo-700 transition-colors"
            >
              Start Chat
            </motion.button>
          </motion.div>
          {/* Email Support */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl shadow-lg flex flex-col items-center p-6 text-center cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="p-4 bg-green-50 rounded-full mb-3"
            >
              <Mail size={32} className="text-green-600" />
            </motion.div>
            <h3 className="text-xl font-medium text-gray-800 mb-1">Email Support</h3>
            <p className="text-gray-600 text-sm mb-4">
              Send us an email and we’ll get back to you within 24 hours.
            </p>
            <motion.a
              href="mailto:support@medbook.com"
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-full shadow hover:bg-green-700 transition-colors"
            >
              Email Us
            </motion.a>
          </motion.div>
          {/* Call Us */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl shadow-lg flex flex-col items-center p-6 text-center cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-4 bg-yellow-50 rounded-full mb-3"
            >
              <PhoneCall size={32} className="text-yellow-600" />
            </motion.div>
            <h3 className="text-xl font-medium text-gray-800 mb-1">Call Us</h3>
            <p className="text-gray-600 text-sm mb-4">
              Speak directly with our support specialists during business hours.
            </p>
            <motion.a
              href="tel:+15559876543"
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-yellow-600 text-white px-6 py-2 rounded-full shadow hover:bg-yellow-700 transition-colors"
            >
              +1 (555) 987-6543
            </motion.a>
          </motion.div>
        </div>
      </motion.div>

      {/* Chatbot at Bottom */}
      <div className="relative z-10 mt-16">
        <Chatbot />
      </div>
    </div>
  );
}
