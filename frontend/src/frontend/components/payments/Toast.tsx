import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  onClose: () => void;
  duration?: number; // visible duration before auto-close, in ms
}

const Toast: React.FC<ToastProps> = ({
  type,
  message,
  onClose,
  duration = 3000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const removeTimer = useRef<NodeJS.Timeout | null>(null);

  // Entry and exit durations in ms
  const ENTRY_DURATION = 500;
  const EXIT_DURATION = 300;

  useEffect(() => {
    // Trigger entry animation on next tick
    const entryTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    // After `duration`, start exit animation
    autoCloseTimer.current = setTimeout(() => {
      setIsVisible(false);
      // After exit animation ends, call onClose
      removeTimer.current = setTimeout(() => {
        onClose();
      }, EXIT_DURATION);
    }, duration + ENTRY_DURATION); 
    // Note: we delay the auto-close start by ENTRY_DURATION so that the total visible time is roughly `duration`

    return () => {
      clearTimeout(entryTimer);
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
      if (removeTimer.current) clearTimeout(removeTimer.current);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    // If already closing, do nothing
    if (!isVisible) return;
    // Clear pending auto-close
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
    // Start exit animation
    setIsVisible(false);
    // After exit animation ends, call onClose
    if (removeTimer.current) {
      clearTimeout(removeTimer.current);
    }
    removeTimer.current = setTimeout(() => {
      onClose();
    }, EXIT_DURATION);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg border shadow-lg
        ${getBgColor()}
        transform transition-all
        ${isVisible
          ? `translate-y-0 opacity-100 duration-[${ENTRY_DURATION}ms] ease-out`
          : `-translate-y-20 opacity-0 duration-[${EXIT_DURATION}ms] ease-in`}
      `}
    >
      <div className="flex items-center space-x-3">
        {getIcon()}
        <p className="text-sm font-medium text-gray-800 flex-1">{message}</p>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
