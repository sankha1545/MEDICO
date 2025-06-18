// src/frontend/components/common/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) => {
  // Base styles
  const baseStyles =
    'inline-flex items-center justify-center rounded-2xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Size classes
  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'h-7 px-2 text-xs',
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-5 text-base',
    lg: 'h-12 px-6 text-lg',
    xl: 'h-14 px-8 text-xl',
  };

  // Variant classes (ensure these align with your Tailwind config)
  const variantStyles: Record<ButtonVariant, string> = {
    primary: `
      bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg
      hover:from-indigo-600 hover:to-purple-600 active:from-purple-600 active:to-indigo-700
      focus:ring-blue-400
    `,
    secondary: `
      bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md
      hover:from-teal-500 hover:to-emerald-500 active:from-emerald-500 active:to-teal-600
      focus:ring-green-400
    `,
    outline: `
      border-2 border-gray-300 bg-white text-gray-800 shadow-sm
      hover:bg-gray-50 active:bg-gray-100 active:shadow-inner
      focus:ring-gray-300
    `,
    ghost: `
      bg-transparent text-gray-800 hover:bg-gray-100 active:bg-gray-200 shadow-none
      focus:ring-gray-200
    `,
    link: `
      bg-transparent text-indigo-600 hover:text-indigo-800 underline-offset-4
      hover:underline active:text-indigo-900
    `,
  };

  // Width handling
  const widthStyles = fullWidth ? 'w-full' : '';

  // Framer Motion variants
  const motionVariants = {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    hover: { scale: 1.03, boxShadow: '0px 8px 20px rgba(0,0,0,0.12)' },
    tap: { scale: 0.97 },
  };

  return (
    <motion.button
      type={type}
      {...props}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyles} ${className}`}
      disabled={isLoading || props.disabled}
      aria-busy={isLoading ? true : undefined}
      variants={motionVariants}
      initial="initial"
      animate="animate"
      whileHover={!isLoading ? 'hover' : undefined}
      whileTap={!isLoading ? 'tap' : undefined}
    >
      {isLoading && (
        <motion.svg
          className="animate-spin -ml-1 mr-2 h-5 w-5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 
               7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </motion.svg>
      )}

      {/* Left icon, shown only when not loading */}
      {icon && iconPosition === 'left' && !isLoading && (
        <motion.span
          className="mr-2 flex items-center"
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {icon}
        </motion.span>
      )}

      {/* Button content */}
      <span className={`flex items-center ${isLoading ? 'opacity-50' : ''}`}>
        {children}
      </span>

      {/* Right icon, shown only when not loading */}
      {icon && iconPosition === 'right' && !isLoading && (
        <motion.span
          className="ml-2 flex items-center"
          initial={{ opacity: 0, x: 5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {icon}
        </motion.span>
      )}
    </motion.button>
  );
};
