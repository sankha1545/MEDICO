// File: src/components/ChakraTransition.tsx

import React, { useEffect, useState } from 'react';

interface ChakraTransitionProps {
  onComplete: () => void;
}

const ChakraTransition: React.FC<ChakraTransitionProps> = ({ onComplete }) => {
  const [isActive, setIsActive] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Trigger the scale+pulse animation
    setIsActive(true);

    // After 5s, start fading out
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 5000);

    // After 6s total, signal completion
    const finishTimer = setTimeout(() => {
      onComplete();
    }, 6000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  return (
    <div className={`chakra-container ${isFading ? 'fade-out' : ''}`}>
      {/* Fiery background */}
      <div className="fire-background">
        <div className="flame-layer flame-layer-1" />
        <div className="flame-layer flame-layer-2" />
        <div className="flame-layer flame-layer-3" />
        <div className="ember-particles">
          {[...Array(50)].map((_, i) => (
            <div key={i} className={`ember ember-${(i % 5) + 1}`} />
          ))}
        </div>
      </div>

      {/* Central Chakra */}
      <div className={`chakra-center ${isActive ? 'chakra-active' : ''}`}>
        {/* Outer rotating rings */}
        <div className="chakra-ring chakra-ring-outer">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`ring-segment ring-segment-${i + 1}`} />
          ))}
        </div>

        {/* Middle rotating rings */}
        <div className="chakra-ring chakra-ring-middle">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`ring-segment ring-segment-${i + 1}`} />
          ))}
        </div>

        {/* Inner core */}
        <div className="chakra-core">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`core-flame core-flame-${i + 1}`} />
          ))}
          <div className="core-inner" />
        </div>

        {/* Spiral flames */}
        <div className="spiral-flames">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`spiral-flame spiral-${i + 1}`} />
          ))}
        </div>

        {/* Energy pulses */}
        <div className="energy-pulses">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`pulse pulse-${i + 1}`} />
          ))}
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .chakra-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: radial-gradient(circle at center,
            #8B0000 0%, #4B0000 30%, #2B0000 60%, #0A0000 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          z-index: 1000;
          transition: opacity 1s ease-in-out;
        }
        .fade-out {
          opacity: 0;
        }

        .fire-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .flame-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center,
            rgba(255, 69, 0, 0.3) 0%,
            rgba(255, 140, 0, 0.2) 30%,
            rgba(255, 0, 0, 0.1) 60%,
            transparent 100%);
          animation: flameFlicker 3s ease-in-out infinite alternate;
        }
        .flame-layer-1 {
          animation-delay: 0s;
          transform: scale(1.2);
        }
        .flame-layer-2 {
          animation-delay: 1s;
          transform: scale(0.8) rotate(45deg);
        }
        .flame-layer-3 {
          animation-delay: 2s;
          transform: scale(1.5) rotate(-30deg);
        }
        @keyframes flameFlicker {
          0% { opacity: 0.6; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.9; transform: scale(1.1) rotate(5deg); }
          100% { opacity: 0.7; transform: scale(0.95) rotate(-3deg); }
        }

        .ember-particles {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        .ember {
          position: absolute;
          width: 4px;
          height: 4px;
          background: radial-gradient(circle, #FF4500 0%, #FF6347 50%, transparent 100%);
          border-radius: 50%;
          animation: emberFloat 8s linear infinite;
        }
        .ember-1 { left: 10%; animation-delay: 0s; }
        .ember-2 { left: 20%; animation-delay: 1s; }
        .ember-3 { left: 30%; animation-delay: 2s; }
        .ember-4 { left: 40%; animation-delay: 3s; }
        .ember-5 { left: 50%; animation-delay: 4s; }

        @keyframes emberFloat {
          0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(90vh) scale(1);
          }
          90% {
            opacity: 1;
            transform: translateY(10vh) scale(0.8);
          }
          100% {
            transform: translateY(-10vh) scale(0);
            opacity: 0;
          }
        }

        .chakra-center {
          position: relative;
          width: 400px;
          height: 400px;
          transform: scale(0);
          transition: transform 0.8s ease-out;
        }
        .chakra-active {
          transform: scale(1);
          animation: chakraPulse 1.5s ease-in-out infinite alternate;
        }
        @keyframes chakraPulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }

        .chakra-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        .chakra-ring-outer {
          width: 100%;
          height: 100%;
          animation: ringRotateOuter 4s linear infinite;
        }
        .chakra-ring-middle {
          width: 70%;
          height: 70%;
          animation: ringRotateMiddle 3s linear infinite reverse;
        }
        @keyframes ringRotateOuter {
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        @keyframes ringRotateMiddle {
          to {
            transform: translate(-50%, -50%) rotate(-360deg);
          }
        }

        .ring-segment {
          position: absolute;
          width: 60px;
          height: 8px;
          background: linear-gradient(90deg,
            rgba(255, 69, 0, 0.9) 0%,
            rgba(255, 140, 0, 1) 50%,
            rgba(255, 215, 0, 0.9) 100%);
          border-radius: 4px;
          box-shadow:
            0 0 10px rgba(255, 69, 0, 0.8),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .chakra-ring-outer .ring-segment-1 {
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
        }
        .chakra-ring-outer .ring-segment-2 {
          top: 50%;
          right: -4px;
          transform: translateY(-50%) rotate(90deg);
        }
        .chakra-ring-outer .ring-segment-3 {
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%) rotate(180deg);
        }
        .chakra-ring-outer .ring-segment-4 {
          top: 50%;
          left: -4px;
          transform: translateY(-50%) rotate(270deg);
        }

        .chakra-ring-middle .ring-segment-1 {
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
        }
        .chakra-ring-middle .ring-segment-2 {
          top: 25%;
          right: -4px;
          transform: translateY(-50%) rotate(60deg);
        }
        .chakra-ring-middle .ring-segment-3 {
          top: 50%;
          right: -4px;
          transform: translateY(-50%) rotate(120deg);
        }
        .chakra-ring-middle .ring-segment-4 {
          bottom: 25%;
          right: -4px;
          transform: translateY(50%) rotate(180deg);
        }
        .chakra-ring-middle .ring-segment-5 {
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%) rotate(240deg);
        }
        .chakra-ring-middle .ring-segment-6 {
          top: 50%;
          left: -4px;
          transform: translateY(-50%) rotate(300deg);
        }

        .chakra-core {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 120px;
          height: 120px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle,
            rgba(255, 215, 0, 0.9) 0%,
            rgba(255, 140, 0, 0.8) 30%,
            rgba(255, 69, 0, 0.6) 70%,
            rgba(139, 0, 0, 0.4) 100%);
          box-shadow:
            0 0 30px rgba(255, 140, 0, 0.8),
            inset 0 0 20px rgba(255, 215, 0, 0.6);
          animation: coreGlow 1.5s ease-in-out infinite alternate;
        }
        @keyframes coreGlow {
          0% {
            box-shadow:
              0 0 30px rgba(255, 140, 0, 0.8),
              inset 0 0 20px rgba(255, 215, 0, 0.6);
          }
          100% {
            box-shadow:
              0 0 50px rgba(255, 140, 0, 1),
              inset 0 0 30px rgba(255, 215, 0, 0.8);
          }
        }

        .core-flame {
          position: absolute;
          border-radius: 50%;
          animation: flameCore 1.5s ease-in-out infinite alternate;
        }
        .core-flame-1 {
          top: 10%;
          left: 10%;
          width: 80%;
          height: 80%;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, transparent 70%);
          animation-delay: 0s;
        }
        .core-flame-2 {
          top: 20%;
          left: 20%;
          width: 60%;
          height: 60%;
          background: radial-gradient(circle, rgba(255, 140, 0, 0.7) 0%, transparent 70%);
          animation-delay: 0.5s;
        }
        .core-flame-3 {
          top: 30%;
          left: 30%;
          width: 40%;
          height: 40%;
          background: radial-gradient(circle, rgba(255, 69, 0, 0.8) 0%, transparent 70%);
          animation-delay: 1s;
        }
        @keyframes flameCore {
          0% { transform: scale(1) rotate(0deg); opacity: 0.8; }
          100% { transform: scale(1.2) rotate(180deg); opacity: 1; }
        }

        .core-inner {
          position: absolute;
          top: 40%;
          left: 40%;
          width: 20%;
          height: 20%;
          background: radial-gradient(circle, #FFFFFF 0%, rgba(255, 215, 0, 0.9) 100%);
          border-radius: 50%;
          animation: innerPulse 1s ease-in-out infinite alternate;
        }
        @keyframes innerPulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0.8; }
        }

        .spiral-flames {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 300px;
          height: 300px;
          transform: translate(-50%, -50%);
        }
        .spiral-flame {
          position: absolute;
          width: 8px;
          height: 40px;
          background: linear-gradient(to top,
            rgba(255, 69, 0, 0.9) 0%,
            rgba(255, 140, 0, 0.7) 50%,
            rgba(255, 215, 0, 0.5) 100%);
          border-radius: 4px 4px 50% 50%;
          transform-origin: 4px 150px;
          animation: spiralRotate 3s linear infinite;
        }
        .spiral-1 { animation-delay: 0s; }
        .spiral-2 { animation-delay: 0.375s; }
        .spiral-3 { animation-delay: 0.75s; }
        .spiral-4 { animation-delay: 1.125s; }
        .spiral-5 { animation-delay: 1.5s; }
        .spiral-6 { animation-delay: 1.875s; }
        .spiral-7 { animation-delay: 2.25s; }
        .spiral-8 { animation-delay: 2.625s; }
        @keyframes spiralRotate {
          0% {
            transform: rotate(0deg) translateY(-150px) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: rotate(72deg) translateY(-150px) scale(1);
          }
          80% {
            opacity: 1;
            transform: rotate(288deg) translateY(-150px) scale(1);
          }
          100% {
            transform: rotate(360deg) translateY(-150px) scale(0);
            opacity: 0;
          }
        }

        .energy-pulses {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .pulse {
          position: absolute;
          border: 2px solid rgba(255, 140, 0, 0.6);
          border-radius: 50%;
          animation: energyPulse 2s ease-out infinite;
        }
        .pulse-1 {
          width: 200px;
          height: 200px;
          margin: -100px 0 0 -100px;
          animation-delay: 0s;
        }
        .pulse-2 {
          width: 300px;
          height: 300px;
          margin: -150px 0 0 -150px;
          animation-delay: 0.7s;
        }
        .pulse-3 {
          width: 400px;
          height: 400px;
          margin: -200px 0 0 -200px;
          animation-delay: 1.4s;
        }
        @keyframes energyPulse {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        /* Responsive tweaks */
        @media (max-width: 768px) {
          .chakra-center {
            width: 300px;
            height: 300px;
          }
          .spiral-flames {
            width: 200px;
            height: 200px;
          }
          .spiral-flame {
            transform-origin: 4px 100px;
          }
          @keyframes spiralRotate {
            0% {
              transform: rotate(0deg) translateY(-100px) scale(0);
              opacity: 0;
            }
            20% {
              opacity: 1;
              transform: rotate(72deg) translateY(-100px) scale(1);
            }
            80% {
              opacity: 1;
              transform: rotate(288deg) translateY(-100px) scale(1);
            }
            100% {
              transform: rotate(360deg) translateY(-100px) scale(0);
              opacity: 0;
            }
          }
        }
      `}</style>
    </div>
  );
};

export default ChakraTransition;
