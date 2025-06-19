import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
      >
        <div className="w-16 h-16 border-4 border-white border-dashed rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl font-semibold tracking-wide animate-pulse">MedicoX is loading...</p>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
