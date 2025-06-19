import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export interface ToastProps {
  id?: number;
  title: string;
  description?: string;
  status: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

const statusColors = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
  warning: 'bg-yellow-500',
};

const AnimatedToast: React.FC<ToastProps> = ({ title, description, status }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.4 }}
      className={`flex items-start max-w-sm shadow-lg rounded-lg overflow-hidden ${statusColors[status]}`}
    >
      <div className="p-4 flex-1 text-white">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-lg">{title}</h4>
          <button onClick={() => { /* handled by auto removal */ }}>
            <X size={18} />
          </button>
        </div>
        {description && <p className="mt-1 opacity-90">{description}</p>}
      </div>
    </motion.div>
  );
};

export default AnimatedToast;
