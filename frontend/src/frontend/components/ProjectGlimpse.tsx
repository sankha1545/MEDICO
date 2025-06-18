// File: src/frontend/components/ProjectGlimpse.tsx

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Text,
  PerspectiveCamera,
  Environment,
  Float,
  MeshDistortMaterial,
  Sphere,
  Box,
  Torus,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import * as THREE from 'three';

// ——— Types —————————————————————————————————————————————————————————————
type AnimationPhase = 'intro' | 'data' | 'carousel' | 'complete';

// ——— Floating Shapes ————————————————————————————————————————————————————
const FloatingShapes: React.FC<{ phase: AnimationPhase }> = ({ phase }) => {
  const group = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (group.current) {
      group.current.rotation.y = st.clock.elapsedTime * 0.1;
      group.current.position.y = Math.sin(st.clock.elapsedTime * 0.5) * 0.2;
    }
  });
  const opacity = phase === 'intro' ? 1 : phase === 'data' ? 0.3 : 0;
  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={1} floatIntensity={0.5}>
        <Sphere args={[0.8, 32, 32]} position={[-2, 1, 0]}>
          <MeshDistortMaterial
            color="#8b5cf6"
            transparent
            opacity={opacity}
            distort={0.3}
            speed={2}
            roughness={0.1}
            metalness={0.8}
          />
        </Sphere>
      </Float>
      <Float speed={1.5} rotationIntensity={2} floatIntensity={0.8}>
        <Box args={[1.2, 1.2, 1.2]} position={[2, -0.5, -1]}>
          <MeshDistortMaterial
            color="#6366f1"
            transparent
            opacity={opacity}
            distort={0.2}
            speed={1.5}
            roughness={0.1}
            metalness={0.9}
          />
        </Box>
      </Float>
      <Float speed={3} rotationIntensity={0.5} floatIntensity={1}>
        <Torus args={[0.6, 0.3, 16, 32]} position={[0, -1.5, 1]}>
          <MeshDistortMaterial
            color="#3b82f6"
            transparent
            opacity={opacity}
            distort={0.4}
            speed={3}
            roughness={0.1}
            metalness={0.7}
          />
        </Torus>
      </Float>
    </group>
  );
};

// ——— Data Visualization —————————————————————————————————————————————————
const DataVisualization: React.FC<{ phase: AnimationPhase }> = ({ phase }) => {
  const group = useRef<THREE.Group>(null);
  const bars = useRef<THREE.Group>(null);

  useFrame((st) => {
    if (group.current && phase === 'data') {
      group.current.rotation.y = st.clock.elapsedTime * 0.2;
    }
    if (bars.current && phase === 'data') {
      bars.current.children.forEach((c, i) => {
        const s = 1 + Math.sin(st.clock.elapsedTime * 2 + i) * 0.3;
        c.scale.y = s;
      });
    }
  });

  const opacity = phase === 'data' ? 1 : phase === 'carousel' ? 0.2 : 0;
  const scale = phase === 'data' ? 1 : 0.1;

  return (
    <group ref={group} scale={scale}>
      <group ref={bars} position={[-3, -1, 0]}>
        {[1.5, 2.2, 1.8, 2.5, 1.9].map((h, i) => (
          <Box key={i} args={[0.3, h, 0.3]} position={[i * 0.5, h / 2, 0]}>
            <meshStandardMaterial
              color={`hsl(${240 + i * 20},70%,60%)`}
              transparent
              opacity={opacity}
              emissive={`hsl(${240 + i * 20},70%,30%)`}
              emissiveIntensity={0.2}
            />
          </Box>
        ))}
      </group>
      <group position={[2, 0, 0]}>
        {Array.from({ length: 20 }).map((_, i) => (
          <Sphere
            key={i}
            args={[0.05]}
            position={[(i - 10) * 0.2, Math.sin(i * 0.5) * 1.5, 0]}
          >
            <meshStandardMaterial
              color="#10b981"
              transparent
              opacity={opacity}
              emissive="#10b981"
              emissiveIntensity={0.3}
            />
          </Sphere>
        ))}
      </group>
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.5}
        color="#fff"
        anchorX="center"
        anchorY="middle"
        transparent
        opacity={opacity}
      >
        10K+ Users
      </Text>
      <Text
        position={[-2, 2, -1]}
        fontSize={0.3}
        color="#8b5cf6"
        anchorX="center"
        anchorY="middle"
        transparent
        opacity={opacity}
      >
        95% Satisfaction
      </Text>
      <Text
        position={[2.5, 1.8, 1]}
        fontSize={0.3}
        color="#3b82f6"
        anchorX="center"
        anchorY="middle"
        transparent
        opacity={opacity}
      >
        24/7 Support
      </Text>
    </group>
  );
};

// ——— UI Carousel ——————————————————————————————————————————————————————
const UICarousel: React.FC<{ phase: AnimationPhase }> = ({ phase }) => {
  const group = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (group.current && phase === 'carousel') {
      group.current.rotation.y = st.clock.elapsedTime * 0.3;
    }
  });
  const opacity = phase === 'carousel' ? 1 : phase === 'complete' ? 0.5 : 0;
  const scale = phase === 'carousel' || phase === 'complete' ? 1 : 0.1;
  const screens = [
    { color: '#8b5cf6', title: 'Dashboard' },
    { color: '#6366f1', title: 'Analytics' },
    { color: '#3b82f6', title: 'Reports' },
    { color: '#10b981', title: 'Settings' },
  ];

  return (
    <group ref={group} scale={scale}>
      {screens.map((s, i) => {
        const angle = (i / screens.length) * Math.PI * 2;
        const x = Math.cos(angle) * 3;
        const z = Math.sin(angle) * 3;
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, -angle, 0]}>
            <Box args={[1.6, 1, 0.1]}>
              <meshStandardMaterial
                color={s.color}
                transparent
                opacity={opacity}
                emissive={s.color}
                emissiveIntensity={0.1}
              />
            </Box>
            <Text
              position={[0, -0.8, 0]}
              fontSize={0.2}
              color="#fff"
              anchorX="center"
              anchorY="middle"
              transparent
              opacity={opacity}
            >
              {s.title}
            </Text>
          </group>
        );
      })}
    </group>
  );
};

// ——— Logo —————————————————————————————————————————————————————————————
const Logo: React.FC<{ phase: AnimationPhase }> = ({ phase }) => {
  const group = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (!group.current) return;
    if (phase === 'intro') {
      group.current.rotation.y = st.clock.elapsedTime * 0.5;
      const s = 1 + Math.sin(st.clock.elapsedTime * 2) * 0.1;
      group.current.scale.set(s, s, s);
    } else if (phase === 'complete') {
      group.current.rotation.y = st.clock.elapsedTime * 0.2;
      group.current.scale.set(1.5, 1.5, 1.5);
    }
  });
  const opacity = phase === 'intro' || phase === 'complete' ? 1 : 0.3;

  return (
    <group ref={group}>
      <Text
        position={[0, 0, 0]}
        fontSize={1.2}
        color="#fff"
        anchorX="center"
        anchorY="middle"
        transparent
        opacity={opacity}
      >
        MedicoX
      </Text>
      <Torus args={[2, 0.1, 16, 32]} position={[0, 0, -0.5]}>
        <meshStandardMaterial
          color="#8b5cf6"
          transparent
          opacity={opacity * 0.5}
          emissive="#8b5cf6"
          emissiveIntensity={0.2}
        />
      </Torus>
    </group>
  );
};

// ——— Camera Controller —————————————————————————————————————————————————
const CameraController: React.FC<{ phase: AnimationPhase }> = ({ phase }) => {
  const { camera } = useThree();
  useFrame(() => {
    let tgt: THREE.Vector3;
    switch (phase) {
      case 'intro':
        tgt = new THREE.Vector3(0, 0, 8);
        break;
      case 'data':
        tgt = new THREE.Vector3(2, 2, 6);
        break;
      case 'carousel':
        tgt = new THREE.Vector3(0, 3, 5);
        break;
      case 'complete':
        tgt = new THREE.Vector3(0, 0, 10);
        break;
    }
    camera.position.lerp(tgt, 0.02);
    camera.lookAt(0, 0, 0);
  });
  return null;
};

// ——— Scene ————————————————————————————————————————————————————————————
const Scene: React.FC<{ phase: AnimationPhase }> = ({ phase }) => (
  <>
    <PerspectiveCamera makeDefault position={[0, 0, 8]} />
    <CameraController phase={phase} />

    <ambientLight intensity={0.3} />
    <pointLight position={[10, 10, 10]} intensity={1} color="#8b5cf6" />
    <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
    <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.5} />

    {/* Use Drei’s built‑in “night” environment preset */}
    <Environment preset="night" background />

    <FloatingShapes phase={phase} />
    <DataVisualization phase={phase} />
    <UICarousel phase={phase} />
    <Logo phase={phase} />

    <EffectComposer>
      <Bloom intensity={0.5} luminanceThreshold={0.2} />
      <Vignette eskil={false} offset={0.1} darkness={0.5} />
    </EffectComposer>
  </>
);

// ——— Loading Screen ————————————————————————————————————————————————
const LoadingScreen: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-white text-lg">Loading Experience...</p>
    </div>
  </div>
);

// ——— Main Component ———————————————————————————————————————————————————
const ProjectGlimpse: React.FC = () => {
  const nav = useNavigate();
  const [phase, setPhase] = useState<AnimationPhase>('intro');
  const [showControls, setShowControls] = useState(false);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const seq: { phase: AnimationPhase; duration: number }[] = [
      { phase: 'intro', duration: 4000 },
      { phase: 'data', duration: 5000 },
      { phase: 'carousel', duration: 5000 },
      { phase: 'complete', duration: 3000 },
    ];
    let i = 0;
    let tid: ReturnType<typeof setTimeout>;
    const next = () => {
      setPhase(seq[i].phase);
      tid = setTimeout(() => {
        i = (i + 1) % seq.length;
        next();
      }, seq[i].duration);
    };
    next();
    const ctl = setTimeout(() => setShowControls(true), 2000);
    return () => {
      clearTimeout(tid);
      clearTimeout(ctl);
    };
  }, [playing]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 bg-slate-900 overflow-hidden"
    >
      <Canvas
        className="absolute inset-0"
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace; // replace removed outputEncoding
        }}
      >
        <Suspense fallback={null}>
          <Environment phase={phase} />
        </Suspense>
      </Canvas>

      <Suspense fallback={<LoadingScreen />}>
        <div />
      </Suspense>

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.8 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
          >
            <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-4 flex space-x-4">
              <motion.button
                onClick={() => {
                  setPlaying(true);
                  setPhase('intro');
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-xl"
              >
                <RotateCcw size={18} className="mr-2" />
                Replay
              </motion.button>
              <motion.button
                onClick={() => nav('/')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-6 py-3 border-2 border-white/20 text-white rounded-xl"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase dots */}
      <div className="absolute top-8 left-8 z-10 flex space-x-2 bg-black/20 backdrop-blur-xl rounded-xl border border-white/10 p-3">
        {(['intro', 'data', 'carousel', 'complete'] as AnimationPhase[]).map((p) => (
          <div
            key={p}
            className={`w-2 h-2 rounded-full ${
              phase === p ? 'bg-purple-500' : 'bg-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-8 right-8 z-10 text-right"
      >
        <h1 className="text-4xl font-thin text-white mb-2">Project Glimpse</h1>
        <p className="text-gray-400 text-lg">Immersive Healthcare Experience</p>
      </motion.div>
    </motion.div>
  );
};

export default ProjectGlimpse;
