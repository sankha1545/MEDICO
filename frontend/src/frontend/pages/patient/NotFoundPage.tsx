// src/pages/NotFoundPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen px-4 text-white bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Blending Background Elements */}
      <motion.div
        className="absolute inset-0 bg-center bg-cover opacity-20"
        initial={{ opacity: 0.2, scale: 1.1 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 10, ease: 'easeOut', repeat: Infinity, repeatType: 'reverse' }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center space-y-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Animated Icon */}
        <motion.div
          className="mb-6"
          initial={{ rotate: -15, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-teal-400"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </motion.div>

        {/* Message */}
        <motion.h1
          className="text-5xl font-extrabold tracking-tight text-white md:text-6xl"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        >
          Oops! Page Not Found
        </motion.h1>
        <motion.p
          className="max-w-lg text-lg text-gray-300 md:text-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
        >
          Sorry, we couldn’t find the page you’re looking for. It might have been moved or no longer exists.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col items-center justify-center mt-8 space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.6 }}
        >
          <Button
            as={Link}
            to="/home"
            variant="primary"
            size="lg"
            icon={<Home size={20} />}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Back to Home
          </Button>

          <Button
            as={Link}
            to="/contact"
            variant="outline"
            size="lg"
            iconPosition="right"
            icon={<ArrowRight size={20} />}
            className="text-gray-200 border-gray-500 hover:border-teal-400 hover:text-teal-400"
          >
            Contact Support
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
