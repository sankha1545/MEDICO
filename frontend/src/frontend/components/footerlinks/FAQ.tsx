import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, HelpCircle, MessageCircle, Phone, Mail, Clock, Users } from 'lucide-react';
import { BackgroundAnimation } from '../../components/animations/BackGroundAnimations';
import { Button } from '../../components/common/Button';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  popularity: number;
}

interface FAQCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
}

export default function FAQ() {
  // Enhanced FAQ data with categories
  const faqs: FAQItem[] = [
    {
      id: 1,
      question: 'How do I book an appointment?',
      answer: 'To book an appointment, first create an account or log in. Then browse available doctors or clinics, select a time slot that suits you, and confirm. You\'ll receive a confirmation email and a reminder before your visit.',
      category: 'booking',
      popularity: 95,
    },
    {
      id: 2,
      question: 'Can I reschedule or cancel my appointment?',
      answer: 'Yes. Simply head to your appointment history/dashboard, click the "Reschedule" or "Cancel" button next to the booking, and follow the prompts. You can reschedule up to 24 hours before your appointment without any extra charge.',
      category: 'booking',
      popularity: 88,
    },
    {
      id: 3,
      question: 'What payment methods are accepted?',
      answer: 'We accept all major credit/debit cards (Visa, MasterCard, American Express), as well as UPI and net-banking. Payment is collected securely at the time of booking.',
      category: 'payment',
      popularity: 92,
    },
    {
      id: 4,
      question: 'Do you offer telehealth consultations?',
      answer: 'Absolutely! Telehealth appointments are available for eligible healthcare professionals. When you choose a provider, look for the "Video" icon next to their profile to book a virtual visit.',
      category: 'services',
      popularity: 85,
    },
    {
      id: 5,
      question: 'How do I access my medical records?',
      answer: 'After logging in, go to "My Profile" → "Medical Records." You can view/download lab reports, prescriptions, and past visit summaries uploaded by your doctor.',
      category: 'account',
      popularity: 78,
    },
    {
      id: 6,
      question: 'Is my personal data secure?',
      answer: 'Yes. We use industry-standard encryption to protect your data, and we never share your personal information with third parties without your consent.',
      category: 'security',
      popularity: 90,
    },
    {
      id: 7,
      question: 'What if I need emergency medical care?',
      answer: 'For medical emergencies, please call 911 immediately. Our platform is designed for scheduled consultations and non-emergency medical care.',
      category: 'emergency',
      popularity: 82,
    },
    {
      id: 8,
      question: 'How do I update my insurance information?',
      answer: 'Go to your profile settings and select "Insurance Information." You can add, edit, or remove insurance plans. Make sure to verify coverage with your provider.',
      category: 'account',
      popularity: 75,
    },
  ];

  const categories: FAQCategory[] = [
    { id: 'all', name: 'All Questions', icon: <HelpCircle size={20} />, count: faqs.length },
    { id: 'booking', name: 'Booking & Appointments', icon: <Clock size={20} />, count: faqs.filter(f => f.category === 'booking').length },
    { id: 'payment', name: 'Payment & Billing', icon: <MessageCircle size={20} />, count: faqs.filter(f => f.category === 'payment').length },
    { id: 'services', name: 'Services', icon: <Users size={20} />, count: faqs.filter(f => f.category === 'services').length },
    { id: 'account', name: 'Account & Profile', icon: <Users size={20} />, count: faqs.filter(f => f.category === 'account').length },
    { id: 'security', name: 'Security & Privacy', icon: <Users size={20} />, count: faqs.filter(f => f.category === 'security').length },
  ];

  // State management
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Filtered FAQs based on search and category
  const filteredFaqs = faqs.filter((item) => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => b.popularity - a.popularity);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Enhanced Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' }
    },
  };

  const cardHover = {
    scale: 1.02,
    y: -5,
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    transition: { duration: 0.3 }
  };

  const toggleFAQ = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundAnimation />
      
      <main className="relative z-10 min-h-screen text-gray-100 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 py-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12"
          >
            {/* Enhanced Hero Section */}
            <motion.div variants={itemVariants} className="text-center mb-16">
              <motion.h1
                className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                Frequently Asked Questions
              </motion.h1>
              <motion.p
                className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Find quick answers to common queries about MedicoX's booking process, payments, and more.
              </motion.p>

              {/* Quick Stats */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {[
                  { label: 'Total Questions', value: faqs.length.toString(), icon: <HelpCircle size={24} /> },
                  { label: 'Categories', value: (categories.length - 1).toString(), icon: <MessageCircle size={24} /> },
                  { label: 'Avg. Response Time', value: '< 2 min', icon: <Clock size={24} /> },
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + idx * 0.1, type: 'spring', stiffness: 200 }}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                  >
                    <div className="text-blue-400 mb-2 flex justify-center">{stat.icon}</div>
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Enhanced Search Bar */}
            <motion.div variants={itemVariants} className="max-w-2xl mx-auto mb-12">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
              >
                <div className="flex items-center">
                  <Search className="w-6 h-6 text-gray-400 mx-4" />
                  <input
                    type="text"
                    placeholder="Search FAQs, topics, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-4 bg-transparent focus:outline-none text-white placeholder-gray-400 text-lg"
                  />
                  {searchTerm && (
                    <motion.button
                      onClick={() => setSearchTerm('')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="mr-4 text-gray-400 hover:text-white transition-colors"
                    >
                      ×
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Category Filter */}
            <motion.div variants={itemVariants} className="mb-12">
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {category.icon}
                    <span className="font-medium">{category.name}</span>
                    <span className="text-xs opacity-70">({category.count})</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* FAQ Accordion */}
            <motion.div variants={containerVariants} className="max-w-4xl mx-auto space-y-4">
              <AnimatePresence>
                {filteredFaqs.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    whileHover={cardHover}
                    layout
                    className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden group"
                  >
                    <motion.button
                      className="w-full flex justify-between items-center px-8 py-6 focus:outline-none text-left"
                      onClick={() => toggleFAQ(idx)}
                      whileHover={{ x: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="flex-1">
                        <motion.h3
                          className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors"
                        >
                          {item.question}
                        </motion.h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="capitalize">{item.category.replace('-', ' ')}</span>
                          <span>•</span>
                          <span>{item.popularity}% helpful</span>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: openIndex === idx ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-blue-400 ml-4"
                      >
                        <ChevronDown size={24} />
                      </motion.div>
                    </motion.button>
                    
                    <AnimatePresence initial={false}>
                      {openIndex === idx && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-8 pb-6">
                            <motion.div
                              initial={{ y: -10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="border-t border-white/10 pt-6"
                            >
                              <p className="text-gray-300 leading-relaxed text-base">
                                {item.answer}
                              </p>
                              <div className="mt-4 flex items-center space-x-4">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  Was this helpful?
                                </motion.button>
                                <span className="text-gray-500">•</span>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                                >
                                  Contact Support
                                </motion.button>
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
                
                {filteredFaqs.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="text-center py-16 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10"
                  >
                    <HelpCircle size={64} className="mx-auto text-gray-500 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No FAQs found</h3>
                    <p className="text-gray-400 mb-6">
                      No questions match your search criteria. Try different keywords or browse all categories.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                      }}
                      className="border-blue-400/30 text-blue-400 hover:bg-blue-400/10"
                    >
                      Clear Filters
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Enhanced Support Section */}
            <motion.div variants={itemVariants} className="mt-20">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-3xl border border-blue-400/30 p-12">
                <motion.h2
                  className="text-4xl font-bold text-white text-center mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  Still Need Help?
                </motion.h2>
                <motion.p
                  className="text-xl text-gray-300 text-center mb-12 max-w-3xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  Our support team is here to help you 24/7. Choose the best way to reach us.
                </motion.p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: <MessageCircle size={32} className="text-blue-400" />,
                      title: 'Live Chat',
                      description: 'Chat instantly with our support team for real-time assistance.',
                      action: 'Start Chat',
                      color: 'blue',
                      availability: 'Available 24/7',
                    },
                    {
                      icon: <Mail size={32} className="text-green-400" />,
                      title: 'Email Support',
                      description: 'Send us an email and we\'ll get back to you within 2 hours.',
                      action: 'Email Us',
                      color: 'green',
                      availability: 'Response in 2 hours',
                    },
                    {
                      icon: <Phone size={32} className="text-purple-400" />,
                      title: 'Call Us',
                      description: 'Speak directly with our support specialists.',
                      action: '+1 (555) 987-6543',
                      color: 'purple',
                      availability: 'Mon-Fri 9AM-6PM',
                    },
                  ].map((option, idx) => (
                    <motion.div
                      key={option.title}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.05, y: -10 }}
                      className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center group cursor-pointer"
                    >
                      <motion.div
                        className="flex justify-center mb-6"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-4 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors duration-300">
                          {option.icon}
                        </div>
                      </motion.div>
                      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">
                        {option.title}
                      </h3>
                      <p className="text-gray-300 mb-4 leading-relaxed">
                        {option.description}
                      </p>
                      <p className="text-sm text-gray-400 mb-6">
                        {option.availability}
                      </p>
                      <Button 
                        variant="gradient" 
                        size="md"
                        className="w-full"
                      >
                        {option.action}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}