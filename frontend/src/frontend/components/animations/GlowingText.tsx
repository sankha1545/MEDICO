import React from 'react';
import { motion } from 'framer-motion';

interface GlowingTextProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  delay?: number;
}

export const GlowingText: React.FC<GlowingTextProps> = ({ 
  children, 
  className = "", 
  glowColor = "#00d4ff",
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className={`relative ${className}`}
    >
      <motion.div
        animate={{
          textShadow: [
            `0 0 20px ${glowColor}40`,
            `0 0 40px ${glowColor}60`,
            `0 0 20px ${glowColor}40`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};