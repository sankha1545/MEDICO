import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

export default function AnimatedToggle({ checked, onChange, label }: AnimatedToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/90 font-medium">{label}</span>
      <motion.button
        onClick={onChange}
        whileTap={{ scale: 0.95 }}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
          checked
            ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-lg shadow-emerald-400/30'
            : 'bg-white/20 border border-white/30'
        }`}
        aria-label={`Toggle ${label}`}
      >
        <motion.div
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full ${
            checked ? 'bg-white shadow-lg' : 'bg-white/70'
          }`}
          animate={{ x: checked ? 24 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </motion.button>
    </div>
  );
}
