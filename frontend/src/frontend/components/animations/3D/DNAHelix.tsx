import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const DNAHelix: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  const helixGeometry = useMemo(() => {
    const points = [];
    const points2 = [];
    
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 8;
      const y = (i / 100) * 10 - 5;
      const radius = 1.5;
      
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      ));
      
      points2.push(new THREE.Vector3(
        Math.cos(angle + Math.PI) * radius,
        y,
        Math.sin(angle + Math.PI) * radius
      ));
    }
    
    return { points, points2 };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* First helix strand */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={helixGeometry.points.length}
            array={new Float32Array(helixGeometry.points.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00ffff" linewidth={3} />
      </line>
      
      {/* Second helix strand */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={helixGeometry.points2.length}
            array={new Float32Array(helixGeometry.points2.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff00ff" linewidth={3} />
      </line>
      
      {/* Connecting bonds */}
      {helixGeometry.points.map((point, index) => {
        if (index % 5 === 0) {
          return (
            <line key={index}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    point.x, point.y, point.z,
                    helixGeometry.points2[index].x, helixGeometry.points2[index].y, helixGeometry.points2[index].z
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ffffff" opacity={0.6} transparent />
            </line>
          );
        }
        return null;
      })}
    </group>
  );
};

export default DNAHelix;