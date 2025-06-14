import React from 'react';
import { motion } from 'framer-motion';

/**
 * Enhanced 3D Card component with advanced animations and transforms
 */
interface Enhanced3DCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover3D?: boolean;
  glowColor?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
}

export const Enhanced3DCard: React.FC<Enhanced3DCardProps> = ({ 
  children, 
  className = "", 
  delay = 0,
  hover3D = true,
  glowColor = "#00d4ff",
  intensity = 'medium'
}) => {
  const intensityConfig = {
    subtle: {
      scale: 1.01,
      rotateX: 2,
      rotateY: 2,
      y: -5,
      glowOpacity: 0.1,
    },
    medium: {
      scale: 1.02,
      rotateX: 5,
      rotateY: 5,
      y: -10,
      glowOpacity: 0.2,
    },
    strong: {
      scale: 1.05,
      rotateX: 8,
      rotateY: 8,
      y: -15,
      glowOpacity: 0.3,
    }
  };

  const config = intensityConfig[intensity];

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 50, 
        rotateX: -15,
        scale: 0.9
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        rotateX: 0,
        scale: 1
      }}
      transition={{ 
        duration: 0.8, 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={hover3D ? {
        y: config.y,
        rotateX: config.rotateX,
        rotateY: config.rotateY,
        scale: config.scale,
        transition: { 
          duration: 0.3,
          type: "spring",
          stiffness: 300,
          damping: 20
        }
      } : {}}
      className={`transform-gpu perspective-1000 ${className}`}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        whileHover={hover3D ? {
          boxShadow: `0 25px 50px -12px ${glowColor}${Math.round(config.glowOpacity * 255).toString(16).padStart(2, '0')}`,
        } : {}}
        className="w-full h-full relative"
      >
        {/* Glow effect background */}
        <motion.div
          className="absolute inset-0 rounded-2xl blur-xl opacity-0"
          style={{ backgroundColor: glowColor }}
          whileHover={hover3D ? {
            opacity: config.glowOpacity,
            scale: 1.05,
          } : {}}
          transition={{ duration: 0.3 }}
        />
        
        {/* Card content */}
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * 3D Card wrapper with medical theme styling
 */
export const MedicalCard: React.FC<Enhanced3DCardProps> = (props) => {
  return (
    <Enhanced3DCard
      {...props}
      className={`bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl ${props.className}`}
    />
  );
};