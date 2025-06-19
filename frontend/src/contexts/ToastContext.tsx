// File: src/contexts/ToastContext.tsx

import React, { createContext, useContext, ReactNode, useState } from 'react';
import AnimatedToast, { ToastProps } from '../frontend/components/ui/AnimatedToast';

interface ToastContextValue {
  showToast: (opts: Omit<ToastProps, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<(ToastProps & { id: number })[]>([]);

  const showToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration ?? 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 space-y-4 z-50">
        {toasts.map((t) => (
          <AnimatedToast key={t.id} {...t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
