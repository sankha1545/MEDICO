import React, { useRef, useState, useEffect } from 'react';
import { CreditCard, Smartphone, Trash2, Star } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi';
  name: string;
  details: string;
  isDefault: boolean;
}

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onRemove: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  onRemove,
  onSetDefault,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const flipTimeoutRef = useRef<number>();

  // Handle flip: add the CSS animation class, then remove after duration
  const handleFlip = () => {
    if (isFlipping) return; // avoid re-trigger while animating
    setIsFlipping(true);
    // After 800ms (animation duration), clear flipping state
    flipTimeoutRef.current = window.setTimeout(() => {
      setIsFlipping(false);
    }, 800);
  };

  useEffect(() => {
    return () => {
      // Cleanup timeout if unmounting mid-flip
      if (flipTimeoutRef.current) {
        clearTimeout(flipTimeoutRef.current);
      }
    };
  }, []);

  const handleSetDefault = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSetDefault(method.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(method.id);
  };

  const getIcon = () => {
    if (method.type === 'card') {
      return <CreditCard className="w-6 h-6 text-blue-500" />;
    } else {
      return <Smartphone className="w-6 h-6 text-green-500" />;
    }
  };

  const getBgColor = () => {
    // You can add bg styling here if desired, e.g., different for default vs non-default.
    return 'bg-white';
  };

  return (
    <div
      // Container classes:
      className={`
        ${getBgColor()} rounded-xl p-4 border border-gray-200 shadow-sm 
        cursor-pointer
        transform transition-transform duration-200 ease-out
        hover:scale-105 hover:-translate-y-0.5
        ${isFlipping ? 'animate-flip-card' : ''}
      `}
      onClick={handleFlip}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getIcon()}
          <div>
            <h4 className="font-medium text-gray-900">{method.name}</h4>
            <p className="text-sm text-gray-500">{method.details}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {method.isDefault && (
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
          )}
          <button
            onClick={handleSetDefault}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {method.isDefault ? 'Default' : 'Set Default'}
          </button>
          <button
            onClick={handleRemove}
            className="text-red-600 hover:text-red-800 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodCard;
