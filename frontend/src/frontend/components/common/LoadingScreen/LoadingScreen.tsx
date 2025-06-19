// File: src/components/common/LoadingScreen.tsx

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { HeartPulse } from 'lucide-react';

/**
 * Props:
 * - isLoading?: whether to show the loading screen (default: true)
 * - message?: custom loading message
 */
interface LoadingScreenProps {
  isLoading?: boolean;
  message?: string;
}

/**
 * Variants for the backdrop fade in/out
 */
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

/**
 * Variants for the central icon pulse animation
 */
const iconVariants: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Variants for floating background shapes
 */
const floatVariants: Variants = {
  animate: (custom: { xRange: number; yRange: number; delay: number }) => ({
    x: [0, custom.xRange, 0, -custom.xRange, 0],
    y: [0, custom.yRange, 0, -custom.yRange, 0],
    transition: {
      duration: 10 + Math.random() * 5,
      repeat: Infinity,
      delay: custom.delay,
      ease: 'easeInOut',
    },
  }),
};

/**
 * LoadingScreen component: full-screen overlay with animated background and central element.
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading = true,
  message,
}) => {
  // Floating shape configurations: positions, sizes, animation ranges
  const floatingShapes = [
    { size: 200, top: '10%', left: '20%', xRange: 20, yRange: 15, delay: 0 },
    { size: 150, top: '70%', left: '80%', xRange: -15, yRange: 25, delay: 2 },
    { size: 250, top: '40%', left: '50%', xRange: 30, yRange: -20, delay: 4 },
    // Add or adjust more shapes if desired
  ];

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          aria-live="assertive"
          aria-busy="true"
        >
          {/* Gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"></div>

          {/* Floating abstract shapes */}
          {floatingShapes.map((shape, idx) => (
            <motion.div
              key={idx}
              custom={{ xRange: shape.xRange, yRange: shape.yRange, delay: shape.delay }}
              variants={floatVariants}
              animate="animate"
              className="absolute rounded-full bg-white/10"
              style={{
                top: shape.top,
                left: shape.left,
                width: shape.size,
                height: shape.size,
              }}
            />
          ))}

          {/* Central content */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }}
            exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.4 } }}
          >
            {/* Pulsating medical icon */}
            <motion.div
              variants={iconVariants}
              animate="animate"
              className="p-4 rounded-full bg-white/20"
              aria-hidden="true"
            >
              {/* Use HeartPulse icon to reflect medical theme */}
              <HeartPulse className="w-16 h-16 text-white" />
            </motion.div>

            {/* Loading text */}
            <motion.p
              className="mt-4 text-white font-semibold text-lg"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              {message || 'Loading...'}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
