import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Box, Torus } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingElementProps {
  position: [number, number, number];
  color: string;
  size: number;
  type: 'sphere' | 'box' | 'torus';
}

const FloatingElement: React.FC<FloatingElementProps> = ({ position, color, size, type }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    }
  });

  const geometry = useMemo(() => {
    switch (type) {
      case 'box':
        return <Box args={[size, size, size]} />;
      case 'torus':
        return <Torus args={[size, size * 0.4, 8, 16]} />;
      default:
        return <Sphere args={[size, 32, 32]} />;
    }
  }, [type, size]);

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position}>
        {geometry}
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.7}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
    </Float>
  );
};

export const FloatingElements3D: React.FC = () => {
  const elements = useMemo(() => [
    { position: [-4, 2, -2], color: '#00d4ff', size: 0.5, type: 'sphere' as const },
    { position: [3, -1, -3], color: '#ff6b6b', size: 0.3, type: 'box' as const },
    { position: [-2, -2, -1], color: '#4ecdc4', size: 0.4, type: 'torus' as const },
    { position: [4, 3, -4], color: '#45b7d1', size: 0.6, type: 'sphere' as const },
    { position: [-3, 1, -5], color: '#96ceb4', size: 0.35, type: 'box' as const },
    { position: [2, -3, -2], color: '#feca57', size: 0.45, type: 'torus' as const },
  ], []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4ecdc4" />
      {elements.map((element, index) => (
        <FloatingElement key={index} {...element} />
      ))}
    </>
  );
};

export const Background3D: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <FloatingElements3D />
      </Canvas>
    </div>
  );
};