// Installation
// npm install framer-motion three @react-three/fiber @react-three/drei

// src/components/AnimatedCursor.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { motion, useMotionValue, useSpring } from 'framer-motion';

// A simple 3D sphere following the mouse
const CursorSphere: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const mesh = useRef<any>();
  useFrame(() => {
    if (mesh.current) {
      mesh.current.position.lerp({ x: position[0], y: position[1], z: 0 }, 0.1);
    }
  });
  return (
    <mesh ref={mesh} position={position}>
      <sphereBufferGeometry args={[0.2, 32, 32]} />
      <meshBasicMaterial color="cyan" transparent opacity={0.7} />
    </mesh>
  );
};

const AnimatedCursor: React.FC = () => {
  const [cursorPos, setCursorPos] = useState([0, 0, 0]);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { damping: 20, stiffness: 300 });
  const springY = useSpring(y, { damping: 20, stiffness: 300 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      setCursorPos([nx * 5, ny * 5, 0]);
      x.set(e.clientX);
      y.set(e.clientY);
    };
    document.addEventListener('mousemove', move);
    return () => document.removeEventListener('mousemove', move);
  }, [x, y]);

  return (
    <>
      {/* HTML dot with Framer Motion */}
      <motion.div
        className="cursor-dot"
        style={{ translateX: springX, translateY: springY }}
      />

      {/* Three.js sphere overlay */}
      <Canvas
        className="pointer-events-none fixed inset-0 z-50"
        gl={{ alpha: true }}
        camera={{ fov: 75, position: [0, 0, 10] }}
      >
        <ambientLight intensity={0.5} />
        <CursorSphere position={cursorPos as [number, number, number]} />
      </Canvas>
    </>
  );
};

export default AnimatedCursor;