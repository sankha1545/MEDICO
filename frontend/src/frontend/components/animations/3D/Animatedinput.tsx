import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedInputProps {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  className?: string;
}

export default function AnimatedInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  className = ''
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const focusVariants = {
    focused: { scale: 1.02, opacity: 1 },
    blurred: { scale: 1, opacity: 0.5 }
  };

  return (
    <div className="relative">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl -z-10"
        variants={focusVariants}
        initial="blurred"
        animate={isFocused ? 'focused' : 'blurred'}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 ${className}`}
      />
    </div>
  );
}
