import React, { useState, useEffect } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
  const [gateOpen, setGateOpen] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [gateFullyOpen, setGateFullyOpen] = useState(false);

  useEffect(() => {
    // Start gate animation after a brief delay
    const gateTimer = setTimeout(() => {
      setGateOpen(true);
    }, 1000);

    // Mark gate as fully open
    const gateCompleteTimer = setTimeout(() => {
      setGateFullyOpen(true);
    }, 4000);

    // Show button after gate opens
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 4500);

    return () => {
      clearTimeout(gateTimer);
      clearTimeout(gateCompleteTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  return (
   <div className="landing-container">
      {/* Deep space background */}
      <div className="space-background">
        <div className="star-field">
          {[...Array(100)].map((_, i) => (
            <div key={i} className={`star star-${i % 3 + 1}`}></div>
          ))}
        </div>
        <div className="nebula nebula-1"></div>
        <div className="nebula nebula-2"></div>
      </div>

      {/* Full Screen 3D Gate */}
      <div className="gate-container">
        <div className={`gate-wrapper ${gateOpen ? 'gate-open' : ''} ${gateFullyOpen ? 'gate-complete' : ''}`}>
          {/* Left Gate Panel */}
          <div className="gate-panel gate-left">
            <div className="gate-surface gate-surface-left">
              <div className="neon-highlight"></div>
              <div className="panel-grid">
                {[1,2,3,4].map(n => <div key={n} className={`panel panel-${n}`}></div>)}
              </div>
              <div className="circuit-traces">
                {[1,2,3].map(n => <div key={n} className={`trace trace-${n}`}></div>)}
              </div>
              <div className="hinge-glow hinge-left"></div>
            </div>
          </div>

          {/* Center Seam */}
          <div className="gate-seam"><div className="seam-light"></div></div>

          {/* Right Gate Panel */}
          <div className="gate-panel gate-right">
            <div className="gate-surface gate-surface-right">
              <div className="neon-highlight"></div>
              <div className="panel-grid">
                {[1,2,3,4].map(n => <div key={n} className={`panel panel-${n}`}></div>)}
              </div>
              <div className="circuit-traces">
                {[1,2,3].map(n => <div key={n} className={`trace trace-${n}`}></div>)}
              </div>
              <div className="hinge-glow hinge-right"></div>
            </div>
          </div>
        </div>

        

        {/* Atmospheric effects */}
        <div className="atmosphere">
          <div className="mist mist-1"></div>
          <div className="mist mist-2"></div>
          <div className="energy-field">
            {[...Array(30)].map((_, i) => (
              <div key={i} className={`energy-particle particle-${i % 5 + 1}`}></div>
            ))}
          </div>
        </div>

        {/* Central opening effect */}
        <div className={`opening-effect ${gateOpen ? 'effect-active' : ''}`}>
          <div className="light-beam"></div>
          <div className="energy-waves">
            <div className="wave wave-1"></div>
            <div className="wave wave-2"></div>
            <div className="wave wave-3"></div>
          </div>
        </div>
      </div>

      {/* Revealed content behind gate */}
      <div className={`revealed-content ${gateFullyOpen ? 'content-visible' : ''}`}>
        <div className="cosmic-background">
          <div className="cosmic-dust">
            {[...Array(200)].map((_, i) => (
              <div key={i} className={`dust-particle dust-${i % 6 + 1}`}></div>
            ))}
          </div>
          <div className="energy-streams">
            <div className="stream stream-1"></div>
            <div className="stream stream-2"></div>
            <div className="stream stream-3"></div>
          </div>
        </div>

        {/* Central portal effect */}
        <div className="portal-effect">
          <div className="portal-rings">
            <div className="portal-ring ring-1"></div>
            <div className="portal-ring ring-2"></div>
            <div className="portal-ring ring-3"></div>
          </div>
          <div className="portal-core">
            <div className="core-energy"></div>
          </div>
        </div>
      </div>

      {/* Start Journey Button */}
      <div className={`journey-button-container ${showButton ? 'button-visible' : ''}`}>
        <div className="button-aura"></div>
        <button 
          className="journey-button"
          onClick={onNavigateToLogin}
        >
          <div className="button-core">
            <div className="button-energy"></div>
            <div className="button-content">
              <Sparkles className="button-icon" size={24} />
              <span className="button-text">Start Your Journey</span>
              <ChevronRight className="button-arrow" size={20} />
            </div>
            <div className="button-particles">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`btn-particle btn-particle-${i + 1}`}></div>
              ))}
            </div>
          </div>
          <div className="button-glow-effect"></div>
        </button>
      </div>

      <style jsx>{`
        .landing-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #000000;
          overflow: hidden;
          perspective: 2000px;
        }

        .space-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 30%, #0f0f23 70%, #000000 100%);
        }

        .star-field {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .star {
          position: absolute;
          background: #ffffff;
          border-radius: 50%;
          animation: starTwinkle 3s ease-in-out infinite alternate;
        }

        .star-1 {
          width: 1px;
          height: 1px;
          box-shadow: 0 0 2px #ffffff;
        }

        .star-2 {
          width: 2px;
          height: 2px;
          box-shadow: 0 0 4px #87ceeb;
        }

        .star-3 {
          width: 1.5px;
          height: 1.5px;
          box-shadow: 0 0 3px #ffd700;
        }

        @keyframes starTwinkle {
          0% { opacity: 0.3; }
          100% { opacity: 1; }
        }

        .nebula {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          animation: nebulaFloat 20s ease-in-out infinite alternate;
        }

        .nebula-1 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(138, 43, 226, 0.1) 0%, transparent 70%);
          top: 20%;
          left: 20%;
        }

        .nebula-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(0, 191, 255, 0.08) 0%, transparent 70%);
          bottom: 20%;
          right: 20%;
          animation-delay: 10s;
        }

        @keyframes nebulaFloat {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(20px, -20px) scale(1.1); }
        }

        .gate-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          perspective: 2000px;
          z-index: 100;
        }

        .gate-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }

        .gate-panel {
          position: absolute;
          width: 50%;
          height: 100%;
          transition: transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transform-style: preserve-3d;
          z-index: 10;
        }

        .gate-left {
          left: 0;
          transform-origin: right center;
        }

        .gate-right {
          right: 0;
          transform-origin: left center;
        }

        .gate-open .gate-left {
          transform: translateX(-100%) rotateY(-15deg);
        }

        .gate-open .gate-right {
          transform: translateX(100%) rotateY(15deg);
        }

        .gate-complete .gate-left {
          transform: translateX(-100%) rotateY(-25deg) translateZ(50px);
        }

        .gate-complete .gate-right {
          transform: translateX(100%) rotateY(25deg) translateZ(50px);
        }

        .gate-surface {
          width: 100%;
          height: 100%;
          position: relative;
          background: linear-gradient(135deg, 
            #2c3e50 0%, 
            #34495e 25%, 
            #4a5f7a 50%, 
            #34495e 75%, 
            #2c3e50 100%);
          overflow: hidden;
          box-shadow: 
            inset 0 0 100px rgba(0, 0, 0, 0.5),
            0 0 50px rgba(0, 0, 0, 0.8);
        }

        .metallic-texture {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              rgba(255, 255, 255, 0.03) 1px,
              transparent 2px
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              rgba(255, 255, 255, 0.02) 1px,
              transparent 2px
            );
          opacity: 0.8;
        }

        .gate-panels {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .panel {
          position: absolute;
          background: linear-gradient(135deg, 
            rgba(52, 73, 94, 0.8) 0%, 
            rgba(44, 62, 80, 0.9) 50%, 
            rgba(52, 73, 94, 0.8) 100%);
          border: 1px solid rgba(127, 140, 141, 0.3);
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3);
        }

        .panel-1 {
          top: 10%;
          left: 10%;
          width: 35%;
          height: 25%;
        }

        .panel-2 {
          top: 10%;
          right: 10%;
          width: 35%;
          height: 25%;
        }

        .panel-3 {
          bottom: 35%;
          left: 10%;
          width: 35%;
          height: 25%;
        }

        .panel-4 {
          bottom: 35%;
          right: 10%;
          width: 35%;
          height: 25%;
        }

        .gate-circuits {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .circuit {
          position: absolute;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(0, 191, 255, 0.6) 50%, 
            transparent 100%);
          height: 2px;
          animation: circuitPulse 3s ease-in-out infinite alternate;
        }

        .circuit-1 {
          top: 30%;
          left: 15%;
          width: 70%;
          animation-delay: 0s;
        }

        .circuit-2 {
          top: 50%;
          left: 20%;
          width: 60%;
          animation-delay: 1s;
        }

        .circuit-3 {
          top: 70%;
          left: 25%;
          width: 50%;
          animation-delay: 2s;
        }

        @keyframes circuitPulse {
          0% { opacity: 0.3; box-shadow: 0 0 5px rgba(0, 191, 255, 0.3); }
          100% { opacity: 1; box-shadow: 0 0 15px rgba(0, 191, 255, 0.8); }
        }

        .gate-lights {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .light {
          position: absolute;
          width: 8px;
          height: 8px;
          background: radial-gradient(circle, #00bfff 0%, rgba(0, 191, 255, 0.3) 100%);
          border-radius: 50%;
          box-shadow: 0 0 10px #00bfff;
          animation: lightBlink 2s ease-in-out infinite alternate;
        }

        .light-1 {
          top: 20%;
          left: 20%;
          animation-delay: 0s;
        }

        .light-2 {
          top: 20%;
          right: 20%;
          animation-delay: 0.5s;
        }

        .light-3 {
          bottom: 40%;
          left: 20%;
          animation-delay: 1s;
        }

        .light-4 {
          bottom: 40%;
          right: 20%;
          animation-delay: 1.5s;
        }

        @keyframes lightBlink {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.2); }
        }

        .gate-reflection {
          position: absolute;
          top: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(120deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.05) 20%, 
            rgba(255, 255, 255, 0.1) 40%, 
            rgba(255, 255, 255, 0.05) 60%, 
            transparent 100%);
          animation: reflectionShine 6s ease-in-out infinite;
        }

        .gate-reflection-left {
          left: 0;
        }

        .gate-reflection-right {
          right: 0;
        }

        @keyframes reflectionShine {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }

        .edge-glow {
          position: absolute;
          top: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(to bottom, 
            transparent 0%, 
            rgba(0, 191, 255, 0.8) 30%, 
            rgba(0, 191, 255, 1) 50%, 
            rgba(0, 191, 255, 0.8) 70%, 
            transparent 100%);
          box-shadow: 0 0 20px rgba(0, 191, 255, 0.6);
          animation: edgeGlow 4s ease-in-out infinite alternate;
        }

        .edge-glow-right {
          right: 0;
        }

        .edge-glow-left {
          left: 0;
        }

        @keyframes edgeGlow {
          0% { opacity: 0.5; box-shadow: 0 0 20px rgba(0, 191, 255, 0.6); }
          100% { opacity: 1; box-shadow: 0 0 40px rgba(0, 191, 255, 1); }
        }

        .gate-seam {
          position: absolute;
          top: 0;
          left: 50%;
          width: 4px;
          height: 100%;
          transform: translateX(-50%);
          z-index: 15;
        }

        .seam-light {
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, 
            transparent 0%, 
            rgba(0, 191, 255, 0.9) 20%, 
            rgba(255, 255, 255, 1) 50%, 
            rgba(0, 191, 255, 0.9) 80%, 
            transparent 100%);
          box-shadow: 0 0 30px rgba(0, 191, 255, 0.8);
          animation: seamPulse 2s ease-in-out infinite alternate;
        }

        @keyframes seamPulse {
          0% { opacity: 0.7; box-shadow: 0 0 30px rgba(0, 191, 255, 0.8); }
          100% { opacity: 1; box-shadow: 0 0 50px rgba(255, 255, 255, 1); }
        }

        .gate-frame {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 5;
        }

        .frame-top, .frame-bottom {
          position: absolute;
          width: 100%;
          height: 20px;
          background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
          border: 1px solid rgba(127, 140, 141, 0.5);
        }

        .frame-top {
          top: 0;
        }

        .frame-bottom {
          bottom: 0;
        }

        .frame-left, .frame-right {
          position: absolute;
          width: 20px;
          height: 100%;
          background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
          border: 1px solid rgba(127, 140, 141, 0.5);
        }

        .frame-left {
          left: 0;
        }

        .frame-right {
          right: 0;
        }

        .frame-lights {
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 100%;
          padding: 0 10px;
        }

        .frame-lights.vertical {
          flex-direction: column;
          padding: 10px 0;
        }

        .frame-light {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          animation: frameLightSequence 4s ease-in-out infinite;
        }

        .frame-light-1 {
          background: radial-gradient(circle, #ff0000 0%, rgba(255, 0, 0, 0.3) 100%);
          box-shadow: 0 0 8px #ff0000;
          animation-delay: 0s;
        }

        .frame-light-2 {
          background: radial-gradient(circle, #ffff00 0%, rgba(255, 255, 0, 0.3) 100%);
          box-shadow: 0 0 8px #ffff00;
          animation-delay: 1s;
        }

        .frame-light-3 {
          background: radial-gradient(circle, #00ff00 0%, rgba(0, 255, 0, 0.3) 100%);
          box-shadow: 0 0 8px #00ff00;
          animation-delay: 2s;
        }

        .frame-light-4 {
          background: radial-gradient(circle, #00bfff 0%, rgba(0, 191, 255, 0.3) 100%);
          box-shadow: 0 0 8px #00bfff;
          animation-delay: 3s;
        }

        @keyframes frameLightSequence {
          0%, 75% { opacity: 0.3; transform: scale(1); }
          25% { opacity: 1; transform: scale(1.5); }
        }

        .atmosphere {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 8;
        }

        .mist {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, 
            rgba(255, 255, 255, 0.02) 0%, 
            transparent 70%);
          animation: mistFlow 15s ease-in-out infinite alternate;
        }

        .mist-1 {
          animation-delay: 0s;
        }

        .mist-2 {
          animation-delay: 7s;
          transform: scale(1.2);
        }

        @keyframes mistFlow {
          0% { opacity: 0.1; transform: translateX(-10px) scale(1); }
          100% { opacity: 0.3; transform: translateX(10px) scale(1.1); }
        }

        .energy-field {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .energy-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: radial-gradient(circle, #00bfff 0%, transparent 100%);
          border-radius: 50%;
          animation: energyFloat 12s linear infinite;
        }

        .particle-1 { left: 10%; animation-delay: 0s; }
        .particle-2 { left: 30%; animation-delay: 2s; }
        .particle-3 { left: 50%; animation-delay: 4s; }
        .particle-4 { left: 70%; animation-delay: 6s; }
        .particle-5 { left: 90%; animation-delay: 8s; }

        @keyframes energyFloat {
          0% {
            transform: translateY(100vh) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-10vh) translateX(20px);
            opacity: 0;
          }
        }

        .opening-effect {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 12;
          opacity: 0;
          transition: opacity 2s ease-in-out;
        }

        .effect-active {
          opacity: 1;
        }

        .light-beam {
          width: 8px;
          height: 400px;
          background: linear-gradient(to bottom, 
            transparent 0%, 
            rgba(0, 191, 255, 0.8) 30%, 
            rgba(255, 255, 255, 1) 50%, 
            rgba(0, 191, 255, 0.8) 70%, 
            transparent 100%);
          margin: -200px auto;
          box-shadow: 0 0 40px rgba(0, 191, 255, 0.8);
          animation: beamIntensity 3s ease-in-out infinite alternate;
        }

        @keyframes beamIntensity {
          0% { 
            box-shadow: 0 0 40px rgba(0, 191, 255, 0.8);
            width: 8px;
          }
          100% { 
            box-shadow: 0 0 80px rgba(255, 255, 255, 1);
            width: 12px;
          }
        }

        .energy-waves {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .wave {
          position: absolute;
          border: 2px solid rgba(0, 191, 255, 0.6);
          border-radius: 50%;
          animation: waveExpand 3s ease-out infinite;
        }

        .wave-1 {
          width: 100px;
          height: 100px;
          margin: -50px 0 0 -50px;
          animation-delay: 0s;
        }

        .wave-2 {
          width: 200px;
          height: 200px;
          margin: -100px 0 0 -100px;
          animation-delay: 1s;
        }

        .wave-3 {
          width: 300px;
          height: 300px;
          margin: -150px 0 0 -150px;
          animation-delay: 2s;
        }

        @keyframes waveExpand {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        .revealed-content {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          transition: opacity 2s ease-in-out;
          z-index: 1;
        }

        .content-visible {
          opacity: 1;
        }

        .cosmic-background {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, 
            rgba(25, 25, 112, 0.3) 0%, 
            rgba(72, 61, 139, 0.2) 30%, 
            rgba(123, 104, 238, 0.1) 60%, 
            transparent 100%);
        }

        .cosmic-dust {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .dust-particle {
          position: absolute;
          border-radius: 50%;
          animation: dustFloat 20s linear infinite;
        }

        .dust-1, .dust-2 {
          width: 1px;
          height: 1px;
          background: rgba(255, 255, 255, 0.6);
        }

        .dust-3, .dust-4 {
          width: 2px;
          height: 2px;
          background: rgba(138, 43, 226, 0.4);
        }

        .dust-5, .dust-6 {
          width: 1.5px;
          height: 1.5px;
          background: rgba(0, 191, 255, 0.5);
        }

        @keyframes dustFloat {
          0% {
            transform: translateY(100vh) translateX(0px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-10vh) translateX(50px) rotate(360deg);
            opacity: 0;
          }
        }

        .energy-streams {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .stream {
          position: absolute;
          width: 2px;
          background: linear-gradient(to bottom, 
            transparent 0%, 
            rgba(138, 43, 226, 0.8) 50%, 
            transparent 100%);
          animation: streamFlow 8s ease-in-out infinite;
        }

        .stream-1 {
          left: 20%;
          height: 60%;
          top: 20%;
          animation-delay: 0s;
        }

        .stream-2 {
          right: 30%;
          height: 70%;
          top: 15%;
          animation-delay: 2s;
        }

        .stream-3 {
          left: 60%;
          height: 50%;
          top: 25%;
          animation-delay: 4s;
        }

        @keyframes streamFlow {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 0.8; transform: scaleY(1.2); }
        }

        .portal-effect {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
        }

        .portal-rings {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .portal-ring {
          position: absolute;
          border: 2px solid;
          border-radius: 50%;
          animation: portalRotate 10s linear infinite;
        }

        .ring-1 {
          width: 100%;
          height: 100%;
          border-color: rgba(138, 43, 226, 0.6);
          animation-delay: 0s;
        }

        .ring-2 {
          width: 70%;
          height: 70%;
          top: 15%;
          left: 15%;
          border-color: rgba(0, 191, 255, 0.7);
          animation-delay: 3s;
          animation-direction: reverse;
        }

        .ring-3 {
          width: 40%;
          height: 40%;
          top: 30%;
          left: 30%;
          border-color: rgba(255, 255, 255, 0.8);
          animation-delay: 6s;
        }

        @keyframes portalRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .portal-core {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 60px;
          height: 60px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, 
            rgba(255, 255, 255, 0.9) 0%, 
            rgba(138, 43, 226, 0.7) 50%, 
            transparent 100%);
          animation: coreEnergy 3s ease-in-out infinite alternate;
        }

        @keyframes coreEnergy {
          0% { 
            box-shadow: 0 0 20px rgba(138, 43, 226, 0.8);
            transform: translate(-50%, -50%) scale(1);
          }
          100% { 
            box-shadow: 0 0 40px rgba(255, 255, 255, 1);
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        .journey-button-container {
          position: absolute;
          top: 75%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 2s ease-in-out;
          z-index: 200;
        }

        .button-visible {
          opacity: 1;
          animation: buttonFloat 4s ease-in-out infinite alternate;
        }

        @keyframes buttonFloat {
          0% { transform: translateX(-50%) translateY(0px); }
          100% { transform: translateX(-50%) translateY(-8px); }
        }

        .button-aura {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200px;
          height: 200px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, 
            rgba(0, 191, 255, 0.2) 0%, 
            rgba(138, 43, 226, 0.1) 50%, 
            transparent 100%);
          border-radius: 50%;
          animation: auraExpand 4s ease-in-out infinite alternate;
          z-index: -1;
        }

        @keyframes auraExpand {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.6; }
        }

        .journey-button {
          position: relative;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s ease;
        }

        .journey-button:hover {
          transform: translateY(-2px);
        }

        .button-core {
          position: relative;
          background: linear-gradient(135deg, 
            rgba(0, 191, 255, 0.9) 0%, 
            rgba(138, 43, 226, 0.8) 50%, 
            rgba(0, 191, 255, 0.9) 100%);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50px;
          padding: 20px 40px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          box-shadow: 
            0 15px 35px rgba(0, 191, 255, 0.4),
            inset 0 2px 0 rgba(255, 255, 255, 0.3),
            inset 0 -2px 0 rgba(0, 0, 0, 0.2);
        }

        .button-energy {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.2) 50%, 
            transparent 100%);
          animation: energyFlow 3s ease-in-out infinite;
        }

        @keyframes energyFlow {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }

        .button-content {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 2;
          color: white;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: 0.5px;
        }

        .button-icon {
          animation: iconSpin 4s linear infinite;
        }

        @keyframes iconSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .button-text {
          font-family: 'Inter', system-ui, sans-serif;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .button-arrow {
          transition: transform 0.3s ease;
        }

        .journey-button:hover .button-arrow {
          transform: translateX(4px);
        }

        .button-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .btn-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: radial-gradient(circle, #ffffff 0%, transparent 100%);
          border-radius: 50%;
          animation: particleOrbit 6s linear infinite;
        }

        .btn-particle-1 { animation-delay: 0s; }
        .btn-particle-2 { animation-delay: 0.5s; }
        .btn-particle-3 { animation-delay: 1s; }
        .btn-particle-4 { animation-delay: 1.5s; }
        .btn-particle-5 { animation-delay: 2s; }
        .btn-particle-6 { animation-delay: 2.5s; }
        .btn-particle-7 { animation-delay: 3s; }
        .btn-particle-8 { animation-delay: 3.5s; }
        .btn-particle-9 { animation-delay: 4s; }
        .btn-particle-10 { animation-delay: 4.5s; }
        .btn-particle-11 { animation-delay: 5s; }
        .btn-particle-12 { animation-delay: 5.5s; }

        @keyframes particleOrbit {
          0% {
            transform: rotate(0deg) translateX(60px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: rotate(360deg) translateX(60px) rotate(-360deg);
            opacity: 0;
          }
        }

        .button-glow-effect {
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          background: linear-gradient(45deg, 
            rgba(0, 191, 255, 0.6) 0%, 
            rgba(138, 43, 226, 0.6) 50%, 
            rgba(0, 191, 255, 0.6) 100%);
          border-radius: 50px;
          z-index: -1;
          filter: blur(8px);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .journey-button:hover .button-glow-effect {
          opacity: 1;
          animation: glowPulse 2s ease-in-out infinite alternate;
        }

        @keyframes glowPulse {
          0% { filter: blur(8px); }
          100% { filter: blur(12px); }
        }

        /* Distribute stars randomly */
        ${[...Array(100)].map((_, i) => `
          .star:nth-child(${i + 1}) {
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 3}s;
          }
        `).join('')}

        /* Distribute dust particles randomly */
        ${[...Array(200)].map((_, i) => `
          .dust-particle:nth-child(${i + 1}) {
            left: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 20}s;
          }
        `).join('')}

        /* Distribute energy particles randomly */
        ${[...Array(30)].map((_, i) => `
          .energy-particle:nth-child(${i + 1}) {
            left: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 12}s;
          }
        `).join('')}

        /* Distribute ember particles randomly */
        ${[...Array(50)].map((_, i) => `
          .ember:nth-child(${i + 1}) {
            left: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 8}s;
          }
        `).join('')}

        @media (max-width: 768px) {
          .gate-container {
            perspective: 1000px;
          }

          .portal-effect {
            width: 200px;
            height: 200px;
          }

          .button-core {
            padding: 16px 32px;
          }

          .button-content {
            font-size: 16px;
            gap: 8px;
          }

          .journey-button-container {
            top: 80%;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;