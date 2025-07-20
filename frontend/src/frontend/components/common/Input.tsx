import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface InputProps {
  type?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  icon,
  fullWidth = false,
  className = '',
  disabled = false,
  error,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div 
      className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <motion.label
          className={`
            absolute left-3 transition-all duration-300 pointer-events-none
            ${isFocused || value ? 
              'text-xs text-primary-600 -top-2 bg-white/90 px-2 backdrop-blur-sm' : 
              'text-sm text-gray-500 top-3'
            }
          `}
          animate={{
            y: isFocused || value ? -8 : 0,
            scale: isFocused || value ? 0.85 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <motion.input
          type={type}
          placeholder={isFocused ? placeholder : ''}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full px-4 py-3 ${icon ? 'pl-10' : ''} 
            bg-white/80 backdrop-blur-md border-2 border-gray-200
            rounded-xl transition-all duration-300
            focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20
            focus:bg-white/90 hover:bg-white/85
            disabled:opacity-50 disabled:cursor-not-allowed
            placeholder:text-gray-400
            transform-gpu hover:scale-[1.02] focus:scale-[1.02]
          `}
          whileFocus={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/20 to-secondary-500/20 opacity-0 pointer-events-none"
          animate={{ opacity: isFocused ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-xs text-red-500"
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );
};