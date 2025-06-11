import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MedicalParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particlesGeometry = useMemo(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    const medicalColors = [
      new THREE.Color('#10b981'), // emerald
      new THREE.Color('#3b82f6'), // blue
      new THREE.Color('#8b5cf6'), // purple
      new THREE.Color('#ef4444'), // red
      new THREE.Color('#f59e0b'), // amber
    ];
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Position
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 20;
      
      // Color
      const color = medicalColors[Math.floor(Math.random() * medicalColors.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      // Size
      sizes[i] = Math.random() * 0.5 + 0.1;
    }
    
    return { positions, colors, sizes };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesGeometry.positions.length / 3}
          array={particlesGeometry.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particlesGeometry.colors.length / 3}
          array={particlesGeometry.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particlesGeometry.sizes.length}
          array={particlesGeometry.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
};

export default MedicalParticles;