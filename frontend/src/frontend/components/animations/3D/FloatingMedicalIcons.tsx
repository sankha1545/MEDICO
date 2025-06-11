import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text3D } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingIconProps {
  position: [number, number, number];
  icon: string;
  color: string;
  scale?: number;
}

const FloatingIcon: React.FC<FloatingIconProps> = ({ position, icon, color, scale = 1 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      meshRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <boxGeometry args={[0.8, 0.8, 0.1]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.8}
          emissive={color}
          emissiveIntensity={0.2}
        />
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={0.3}
          height={0.05}
          position={[-0.15, -0.1, 0.06]}
        >
          {icon}
          <meshStandardMaterial color="white" />
        </Text3D>
      </mesh>
    </Float>
  );
};

const FloatingMedicalIcons: React.FC = () => {
  const icons = useMemo(() => [
    { position: [-3, 2, 0], icon: '+', color: '#10b981', scale: 1.2 },
    { position: [3, 1, -1], icon: '♥', color: '#ef4444', scale: 1 },
    { position: [-2, -1, 1], icon: '⚕', color: '#3b82f6', scale: 1.1 },
    { position: [2, -2, 0], icon: '🏥', color: '#8b5cf6', scale: 0.9 },
    { position: [0, 3, -2], icon: '💊', color: '#f59e0b', scale: 1 },
    { position: [-4, 0, 2], icon: '🔬', color: '#06b6d4', scale: 1.1 },
  ], []);

  return (
    <>
      {icons.map((icon, index) => (
        <FloatingIcon
          key={index}
          position={icon.position as [number, number, number]}
          icon={icon.icon}
          color={icon.color}
          scale={icon.scale}
        />
      ))}
    </>
  );
};

export default FloatingMedicalIcons;