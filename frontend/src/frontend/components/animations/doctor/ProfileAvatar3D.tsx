import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface ProfileAvatar3DProps {
  imageUrl?: string;
  name: string;
  size?: number;
}

const ProfileAvatar3D: React.FC<ProfileAvatar3DProps> = ({ 
  imageUrl, 
  name, 
  size = 120 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create avatar geometry
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    
    // Load texture if image provided
    const loader = new THREE.TextureLoader();
    let material: THREE.Material;
    
    if (imageUrl) {
      const texture = loader.load(imageUrl);
      material = new THREE.MeshBasicMaterial({ map: texture });
    } else {
      material = new THREE.MeshBasicMaterial({ 
        color: 0x4f46e5,
        transparent: true,
        opacity: 0.8
      });
    }

    const avatar = new THREE.Mesh(geometry, material);
    scene.add(avatar);

    // Add wireframe overlay
    const wireframeGeometry = new THREE.SphereGeometry(1.05, 16, 16);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframe);

    // Add particles around avatar
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const radius = 2 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.05,
      transparent: true,
      opacity: 0.6
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    camera.position.z = 3;

    // Mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      const rect = mountRef.current?.getBoundingClientRect();
      if (rect) {
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      }
    };

    mountRef.current.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate avatar based on mouse position
      avatar.rotation.y += (mouseRef.current.x * 0.5 - avatar.rotation.y) * 0.05;
      avatar.rotation.x += (mouseRef.current.y * 0.3 - avatar.rotation.x) * 0.05;

      // Rotate wireframe
      wireframe.rotation.y += 0.01;
      wireframe.rotation.x += 0.005;

      // Animate particles
      particles.rotation.y += 0.002;
      particles.rotation.x += 0.001;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [imageUrl, size]);

  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        ref={mountRef} 
        className="rounded-full overflow-hidden border-4 border-cyan-400/50 shadow-2xl shadow-cyan-400/25"
        style={{ width: size, height: size }}
      />
      
      {/* Glowing ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-cyan-400"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Name label */}
      <motion.div
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 border border-white/20">
          <p className="text-white text-sm font-medium whitespace-nowrap">
            Dr. {name}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfileAvatar3D;