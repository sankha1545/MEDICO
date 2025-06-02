// src/frontend/pages/patient/FAQ.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown } from 'lucide-react';
import Chatbot from '../../components/common/chatbot/chatbot';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  // FAQ data
  const faqs: FAQItem[] = [
    {
      question: 'How do I book an appointment?',
      answer:
        'To book an appointment, first create an account or log in. Then browse available doctors or clinics, select a time slot that suits you, and confirm. You’ll receive a confirmation email and a reminder before your visit.',
    },
    {
      question: 'Can I reschedule or cancel my appointment?',
      answer:
        'Yes. Simply head to your appointment history/dashboard, click the “Reschedule” or “Cancel” button next to the booking, and follow the prompts. You can reschedule up to 24 hours before your appointment without any extra charge.',
    },
    {
      question: 'What payment methods are accepted?',
      answer:
        'We accept all major credit/debit cards (Visa, MasterCard, American Express), as well as UPI and net-banking. Payment is collected securely at the time of booking.',
    },
    {
      question: 'Do you offer telehealth consultations?',
      answer:
        'Absolutely! Telehealth appointments are available for eligible healthcare professionals. When you choose a provider, look for the “Video” icon next to their profile to book a virtual visit.',
    },
    {
      question: 'How do I access my medical records?',
      answer:
        'After logging in, go to “My Profile” → “Medical Records.” You can view/download lab reports, prescriptions, and past visit summaries uploaded by your doctor.',
    },
    {
      question: 'Is my personal data secure?',
      answer:
        'Yes. We use industry-standard encryption to protect your data, and we never share your personal information with third parties without your consent.',
    },
  ];

  // State for which FAQ is open
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // State for search query
  const [searchTerm, setSearchTerm] = useState<string>('');
  // Filtered FAQs based on search
  const filteredFaqs = faqs.filter((item) =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Variants for FAQ cards
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1 },
    },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const toggleFAQ = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Decorative Floating Shapes */}
      <motion.div
        className="absolute top-10 left-[-50px] w-60 h-60 rounded-full bg-purple-200 opacity-30"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ repeat: Infinity, duration: 7 }}
      />
      <motion.div
        className="absolute bottom-20 right-[-60px] w-48 h-48 rounded-full bg-pink-200 opacity-25"
        animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.1, 0.25] }}
        transition={{ repeat: Infinity, duration: 6, delay: 1 }}
      />

      {/* Hero Section */}
      <div className="max-w-3xl mx-auto text-center mb-12 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        >
          Frequently Asked Questions
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-4 text-lg text-gray-700"
        >
          Find quick answers to common queries about MedBook’s booking process, payments, and more.
        </motion.p>
      </div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="max-w-2xl mx-auto mb-8 relative z-10"
      >
        <div className="flex items-center bg-white rounded-full shadow-md overflow-hidden">
          <Search className="w-6 h-6 text-gray-400 mx-3" />
          <input
            type="text"
            placeholder="Search FAQs…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 focus:outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
      </motion.div>

      {/* FAQ Accordion */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl mx-auto space-y-4 relative z-10"
      >
        <AnimatePresence>
          {filteredFaqs.map((item, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              className="bg-white rounded-3xl shadow-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full flex justify-between items-center px-6 py-5 focus:outline-none group"
              >
                <motion.span
                  className="text-left text-lg font-medium text-gray-800"
                  whileHover={{ x: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {item.question}
                </motion.span>
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: openIndex === idx ? 180 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-gray-500"
                >
                  <ChevronDown size={24} />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === idx && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="px-6 pb-5 text-gray-600 text-sm"
                  >
                    {item.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          {filteredFaqs.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-center text-gray-500 mt-8"
            >
              No FAQs match your search.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-12 text-center relative z-10"
      >
        <motion.a
          href="/contact"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="inline-block bg-indigo-600 text-white text-lg font-medium px-8 py-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        >
          Still have questions? Contact Us
        </motion.a>
      </motion.div>

      {/* Chatbot at Bottom */}
      <div className="relative z-10 mt-16">
        <Chatbot />
      </div>
    </div>
  );
}
