import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import earth from '../../../assets/earth.png';
import cloud from '../../../assets/cloud.png';

// Rotating earth with interactive parallax
function RotatingEarth() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, mouse } = useThree();

  // Load earth textures for color and bump
  const [colorMap, bumpMap] = useTexture([earth, earth]);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = elapsed * 0.1;
      meshRef.current.rotation.x = Math.sin(elapsed * 0.2) * 0.05;
    }
    // camera parallax
    camera.position.x += (mouse.x * 2 - camera.position.x) * 0.05;
    camera.position.y += (mouse.y * 2 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return (
    <Sphere ref={meshRef} args={[2, 64, 64]}>  
      <meshStandardMaterial
        map={colorMap}
        bumpMap={bumpMap}
        bumpScale={0.05}
        specularMap={bumpMap}
        specular={new THREE.Color('grey')}
        shininess={10}
      />
    </Sphere>
  );
}

// Cloud layer for volumetric feel
function CloudLayer() {
  const cloudRef = useRef<THREE.Mesh>(null);
  const cloudMap = useTexture(cloud);

  useFrame(() => {
    if (cloudRef.current) {
      cloudRef.current.rotation.y -= 0.02;
    }
  });

  return (
    <Sphere ref={cloudRef} args={[2.05, 64, 64]}>  
      <meshPhongMaterial
        map={cloudMap}
        transparent
        opacity={0.4}
        depthWrite={false}
      />
    </Sphere>
  );
}

// Stars rotating slowly in 3D
function RotatingStars() {
  const pointsRef = useRef<THREE.Points>(null);

  // generate random stars
  const starGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 10000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = THREE.MathUtils.randFloatSpread(200);
      positions[i * 3 + 1] = THREE.MathUtils.randFloatSpread(200);
      positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(200);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      // slow rotation
      pointsRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <points ref={pointsRef} geometry={starGeo}>
      <pointsMaterial size={0.5} sizeAttenuation />
    </points>
  );
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={1} />
        <RotatingEarth />
        <CloudLayer />
        <RotatingStars />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
