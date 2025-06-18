// File: src/components/common/CustomCursor.tsx

import React, { useEffect, useRef } from 'react';

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const trailRefs = useRef<HTMLDivElement[]>([]);
  const requestRef = useRef<number>();
  const mouseX = useRef(window.innerWidth / 2);
  const mouseY = useRef(window.innerHeight / 2);
  const posX = useRef(window.innerWidth / 2);
  const posY = useRef(window.innerHeight / 2);
  const isHovering = useRef(false);
  const hoverScale = useRef(1);
  const trailPositions = useRef<{ x: number; y: number }[]>([]);
  const isTouchDevice = useRef(false);

  useEffect(() => {
    // Detect touch devices, disable custom cursor if so
    const onTouchStart = () => {
      isTouchDevice.current = true;
      cleanup();
    };
    window.addEventListener('touchstart', onTouchStart, { once: true });

    // Inject CSS for cursor
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      /* Hide default cursor on desktop */
      body:not(.custom-cursor-disabled), button:not(.custom-cursor-disabled), a:not(.custom-cursor-disabled), input:not(.custom-cursor-disabled), textarea:not(.custom-cursor-disabled) {
        cursor: none !important;
      }
      .custom-cursor {
        position: fixed;
        top: 0; left: 0;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%) scale(1);
        background: transparent;
        border: 2px solid;
        /* Animated border color cycling through brand gradient */
        animation: cursor-border-color-cycle 3s infinite;
        transition: transform 0.15s ease-out, background-color 0.2s ease-out, border-width 0.2s ease-out;
      }
      @keyframes cursor-border-color-cycle {
        0% { border-color: #3b82f6; }
        33% { border-color: #8b5cf6; }
        66% { border-color: #ec4899; }
        100% { border-color: #3b82f6; }
      }
      .cursor-trail-dot {
        position: fixed;
        top: 0; left: 0;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        background: rgba(236, 72, 153, 0.6);
        mix-blend-mode: difference;
      }
      @keyframes click-ripple {
        0% {
          opacity: 0.4;
          transform: translate(-50%, -50%) scale(0.5);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(3);
        }
      }
      .cursor-click-effect {
        position: fixed;
        top: 0; left: 0;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9997;
        border: 2px solid #8b5cf6;
        animation: click-ripple 0.6s ease-out forwards;
      }
    `;
    document.head.appendChild(styleTag);

    // Create main cursor element
    const cursorEl = document.createElement('div');
    cursorEl.className = 'custom-cursor';
    document.body.appendChild(cursorEl);
    cursorRef.current = cursorEl;

    // Create trail dots
    const trailCount = 5;
    trailPositions.current = Array(trailCount).fill({ x: mouseX.current, y: mouseY.current });
    for (let i = 0; i < trailCount; i++) {
      const dot = document.createElement('div');
      dot.className = 'cursor-trail-dot';
      document.body.appendChild(dot);
      trailRefs.current.push(dot);
    }

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.current = e.clientX;
      mouseY.current = e.clientY;

      // Check hover state: if over interactive element
      const target = e.target as HTMLElement;
      if (
        target.closest('a, button, [data-cursor-hover], .interactive, input[type="button"], input[type="submit"]')
      ) {
        if (!isHovering.current) {
          isHovering.current = true;
          // enlarge cursor
          hoverScale.current = 1.5;
          if (cursorRef.current) {
            cursorRef.current.style.transform = `translate(-50%, -50%) scale(${hoverScale.current})`;
            cursorRef.current.style.backgroundColor = 'rgba(236,72,153,0.2)';
          }
        }
      } else {
        if (isHovering.current) {
          isHovering.current = false;
          hoverScale.current = 1;
          if (cursorRef.current) {
            cursorRef.current.style.transform = `translate(-50%, -50%) scale(1)`;
            cursorRef.current.style.backgroundColor = 'transparent';
          }
        }
      }
    };

    // Click effect handler
    const handleMouseDown = (e: MouseEvent) => {
      // Create ripple effect element
      const ripple = document.createElement('div');
      ripple.className = 'cursor-click-effect';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);
      // Remove after animation ends
      ripple.addEventListener('animationend', () => {
        ripple.remove();
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    // Animation loop: smooth follow
    const animate = () => {
      // Smoothly move main cursor towards mouse
      posX.current += (mouseX.current - posX.current) * 0.2;
      posY.current += (mouseY.current - posY.current) * 0.2;
      if (cursorRef.current) {
        cursorRef.current.style.left = `${posX.current}px`;
        cursorRef.current.style.top = `${posY.current}px`;
      }
      // Trail: each dot follows the previous position with delay
      let prevX = posX.current;
      let prevY = posY.current;
      for (let i = 0; i < trailRefs.current.length; i++) {
        const trail = trailRefs.current[i];
        const tp = trailPositions.current[i];
        // approach prevX, prevY
        tp.x += (prevX - tp.x) * (0.1 + i * 0.02);
        tp.y += (prevY - tp.y) * (0.1 + i * 0.02);
        trail.style.left = `${tp.x}px`;
        trail.style.top = `${tp.y}px`;
        prevX = tp.x;
        prevY = tp.y;
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount or touch detection
    const cleanup = () => {
      if (cursorRef.current) {
        cursorRef.current.remove();
        cursorRef.current = null;
      }
      trailRefs.current.forEach(dot => dot.remove());
      trailRefs.current = [];
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', onTouchStart);
      document.head.removeChild(styleTag);
      // Re-enable default cursor:
      document.body.classList.add('custom-cursor-disabled');
    };

    return () => {
      cleanup();
    };
  }, []);

  return null;
};

export default CustomCursor;
