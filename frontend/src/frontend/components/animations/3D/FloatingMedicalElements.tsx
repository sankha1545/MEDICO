import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Box, Torus, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Individual floating medical element with physics-based animation
 */
interface FloatingMedicalElementProps {
  position: [number, number, number];
  color: string;
  size: number;
  type: 'sphere' | 'box' | 'torus' | 'cross' | 'heart';
  rotationSpeed?: number;
}

const FloatingMedicalElement: React.FC<FloatingMedicalElementProps> = ({ 
  position, 
  color, 
  size, 
  type,
  rotationSpeed = 1 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5 * rotationSpeed) * 0.2;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 * rotationSpeed) * 0.3;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4 * rotationSpeed) * 0.1;
    }
  });

  const geometry = useMemo(() => {
    switch (type) {
      case 'box':
        return <Box args={[size, size, size]} />;
      case 'torus':
        return <Torus args={[size, size * 0.4, 8, 16]} />;
      case 'cross':
        return (
          <group>
            <Box args={[size * 0.3, size * 1.2, size * 0.3]} />
            <Box args={[size * 1.2, size * 0.3, size * 0.3]} />
          </group>
        );
      case 'heart':
        return (
          <group>
            <Sphere args={[size * 0.4]} position={[-size * 0.3, size * 0.2, 0]} />
            <Sphere args={[size * 0.4]} position={[size * 0.3, size * 0.2, 0]} />
            <Box args={[size * 0.8, size * 0.6, size * 0.3]} position={[0, -size * 0.2, 0]} />
          </group>
        );
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
          opacity={0.6}
          emissive={color}
          emissiveIntensity={0.1}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
    </Float>
  );
};

/**
 * Collection of floating medical elements for dashboard background
 */
export const FloatingMedicalElements: React.FC = () => {
  const elements = useMemo(() => [
    { position: [-4, 2, -2], color: '#00d4ff', size: 0.3, type: 'cross' as const, rotationSpeed: 0.8 },
    { position: [3, -1, -3], color: '#ff6b6b', size: 0.25, type: 'heart' as const, rotationSpeed: 1.2 },
    { position: [-2, -2, -1], color: '#4ecdc4', size: 0.35, type: 'torus' as const, rotationSpeed: 0.6 },
    { position: [4, 3, -4], color: '#45b7d1', size: 0.4, type: 'sphere' as const, rotationSpeed: 1.0 },
    { position: [-3, 1, -5], color: '#96ceb4', size: 0.28, type: 'box' as const, rotationSpeed: 0.9 },
    { position: [2, -3, -2], color: '#feca57', size: 0.32, type: 'cross' as const, rotationSpeed: 1.1 },
    { position: [1, 4, -1], color: '#a8e6cf', size: 0.26, type: 'heart' as const, rotationSpeed: 0.7 },
    { position: [-1, -4, -3], color: '#ff8b94', size: 0.38, type: 'torus' as const, rotationSpeed: 1.3 },
  ], []);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#4ecdc4" />
      <pointLight position={[0, 10, -10]} intensity={0.5} color="#ff6b6b" />
      {elements.map((element, index) => (
        <FloatingMedicalElement key={index} {...element} />
      ))}
    </>
  );
};

/**
 * 3D Background component for dashboard with medical theme
 */
export const Medical3DBackground: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <FloatingMedicalElements />
      </Canvas>
    </div>
  );
};