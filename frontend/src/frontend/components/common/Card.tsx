import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/**
 * A basic Card wrapper with rounded corners, shadow, and padding.
 */
export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-subtle ${className}`}>{children}</div>
  );
};