// src/components/common/loading/Loading.tsx

import React from 'react';
import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center z-50">
      {/* Slightly blurred radial overlay */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-800/10 to-black opacity-30 blur-2xl"
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* Pulsing circles */}
      <div className="relative w-24 h-24">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-teal-500 opacity-75"
          animate={{ scale: [0.8, 1.4, 0.8], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-teal-400 opacity-50"
          animate={{ scale: [1.2, 0.6, 1.2], opacity: [0.7, 0.3, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-teal-300 opacity-25"
          animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: 0.8, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}
