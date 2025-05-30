import React, { createContext, useContext, useState, ReactNode, FC } from 'react';

interface TooltipContextValue {
  visible: boolean;
  setVisible: (v: boolean) => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

interface TooltipProps {
  children: ReactNode;
}

/**
 * Tooltip provider to manage visibility state.
 */
export const Tooltip: FC<TooltipProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <TooltipContext.Provider value={{ visible, setVisible }}>
      <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
  );
};

interface TooltipTriggerProps {
  children: ReactNode;
}

/**
 * Wrap the element that triggers tooltip on hover/focus.
 */
export const TooltipTrigger: FC<TooltipTriggerProps> = ({ children }) => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('TooltipTrigger must be used within a Tooltip');
  }
  const { setVisible } = context;

  return (
    <div
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      className="inline-block"
    >
      {children}
    </div>
  );
};

interface TooltipContentProps {
  children: ReactNode;
}

/**
 * The floating content that appears when the trigger is hovered.
 */
export const TooltipContent: FC<TooltipContentProps> = ({ children }) => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('TooltipContent must be used within a Tooltip');
  }
  const { visible } = context;

  return (
    visible ? (
      <div className="absolute z-10 bottom-full mb-2 w-max bg-gray-800 text-white text-sm rounded-md px-2 py-1 whitespace-nowrap">
        {children}
      </div>
    ) : null
  );
};
