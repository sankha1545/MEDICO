import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  fullWidth?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  isLoading = false,
  fullWidth = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
}) => {
  const baseClasses = `
    relative overflow-hidden font-semibold rounded-xl transition-all duration-300
    transform-gpu perspective-1000 hover:scale-105 active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    focus:outline-none focus:ring-4 focus:ring-primary-500/30
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-primary-600 to-secondary-600 text-white
      hover:from-primary-700 hover:to-secondary-700
      shadow-lg hover:shadow-xl hover:shadow-primary-500/25
      before:absolute before:inset-0 before:bg-gradient-to-r 
      before:from-white/20 before:to-transparent before:opacity-0
      hover:before:opacity-100 before:transition-opacity before:duration-300
    `,
    secondary: `
      bg-gray-100 text-gray-900 hover:bg-gray-200
      shadow-md hover:shadow-lg
    `,
    outline: `
      border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white
      shadow-md hover:shadow-lg hover:shadow-primary-500/25
    `,
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {children}
    </motion.button>
  );
};