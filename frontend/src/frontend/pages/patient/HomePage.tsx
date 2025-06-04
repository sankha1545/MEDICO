// src/frontend/pages/patient/HomePage.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Search,
  CheckCircle,
  Users,
  Award,
  Car,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import Chatbot from '../../components/common/chatbot/chatbot';

// 🔑 Replace this with a true 2∶1 equirectangular Earth map (0°–360°, ±90°).
//    For example, download “earth-full-equirect.jpg” from a NASA/Three.js example.
import earthEquirect from '../../assets/earth.png';

import patient from '../../assets/patient.jpg';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

//
// —————————————————————————————————————————————————————————————————————
//  3D EARTH COMPONENT (Seamless, no gaps)
// —————————————————————————————————————————————————————————————————————
//
function EarthModel() {
  const earthRef = useRef<THREE.Mesh>(null!);
  const texture = useLoader(THREE.TextureLoader, earthEquirect);

  // 1) Tell Three.js this is a full equirectangular map:
  texture.mapping = THREE.EquirectangularReflectionMapping;

  // 2) Clamp to edge so it does not tile/repeat and create seams:
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  // 3) Use sRGB encoding if your JPEG is in sRGB color space:
  texture.encoding = THREE.sRGBEncoding;

  // Continuous rotation on Y-axis:
  useFrame((_, delta) => {
    earthRef.current.rotation.y += delta * 0.16;
  });

  return (
    <mesh ref={earthRef} castShadow receiveShadow>
      {/* 
        – VERY high segment count (500 × 500) to eliminate faceting/gaps.
        – Radius = 3 (adjust if you like).
      */}
      <sphereGeometry args={[3, 100, 100]} />

      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide} // render both front and back faces
        metalness={0.1}
        roughness={1}
      />
    </mesh>
  );
}

//
// —————————————————————————————————————————————————————————————————————
//  FALLING STARS (optional atmospheric effect)
// —————————————————————————————————————————————————————————————————————
//
function Stars() {
  const groupRef = useRef<THREE.Points>(null!);

  // Generate 1000 random star positions in a cube around the earth
  const starPositions = useMemo(() => {
    const positions = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 20; // x
      positions[i * 3 + 1] = Math.random() * 10 + 2;     // y (start above)
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
    }
    return positions;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const positions = groupRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3 + 1] -= delta * 1.5; // fall at 1.5 units/sec
      if (positions[i * 3 + 1] < -5) {
        positions[i * 3 + 1] = Math.random() * 10 + 5; // reset above
        positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      }
    }
    groupRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={groupRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starPositions.length / 3}
          array={starPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="white" size={0.05} />
    </points>
  );
}

//
// —————————————————————————————————————————————————————————————————————
//  SINGLE SHOOTING STAR (optional effect)
// —————————————————————————————————————————————————————————————————————
//
function ShootingStar() {
  const starRef = useRef<THREE.Mesh>(null!);
  const [startTime] = useState(() => Math.random() * 5); // random initial offset

  // Initial position (start off left/top) and velocity
  const initialPos = useMemo(
    () => new THREE.Vector3(-10, Math.random() * 5 + 2, -10),
    []
  );
  const velocity = useMemo(
    () => new THREE.Vector3(1, -0.3, 1).normalize().multiplyScalar(10),
    []
  );

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime() - startTime;
    if (elapsed > 0) {
      const t = elapsed % 3; // loop every 3 seconds
      starRef.current.position.set(
        initialPos.x + velocity.x * t,
        initialPos.y + velocity.y * t,
        initialPos.z + velocity.z * t
      );
    }
  });

  return (
    <mesh ref={starRef}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshBasicMaterial color="yellow" />
    </mesh>
  );
}

//
// —————————————————————————————————————————————————————————————————————
//  MAIN HOMEPAGE COMPONENT
// —————————————————————————————————————————————————————————————————————
//
export default function HomePage() {
  const slogans = [
    'Your Health, Our Priority',
    'Expert Care, Anytime, Anywhere',
    'Wellness Starts with a Click',
    'Connecting You to Better Care',
    'Your Guide to a Healthier Life',
  ];
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const typingSpeed = 100;
  const deletingSpeed = 50;
  const pauseAfterFull = 1500;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const current = slogans[currentSloganIndex];

    if (!isDeleting) {
      if (displayedText.length < current.length) {
        timeout = setTimeout(
          () =>
            setDisplayedText(current.slice(0, displayedText.length + 1)),
          typingSpeed
        );
      } else {
        timeout = setTimeout(() => setIsDeleting(true), pauseAfterFull);
      }
    } else {
      if (displayedText.length > 0) {
        timeout = setTimeout(
          () =>
            setDisplayedText(current.slice(0, displayedText.length - 1)),
          deletingSpeed
        );
      } else {
        setIsDeleting(false);
        setCurrentSloganIndex((prev) => (prev + 1) % slogans.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentSloganIndex, slogans]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Framer Motion variants
  const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
  };
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };
  const blinkCaret = {
    blink: {
      opacity: [0, 1],
      transition: { repeat: Infinity, duration: 0.8, ease: 'easeInOut' },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.3 + i * 0.15,
        duration: 0.6,
        ease: 'easeOut',
      },
    }),
    hover: { scale: 1.05, transition: { duration: 0.2 } },
  };

  const headingVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };
  const descVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut', delay: 0.2 } },
  };

  return (
    <main className="relative bg-gradient-to-br from bg-black via-gray-800 to-gray-700 text-white overflow-hidden">
      {/* —————————— HERO SECTION —————————— */}
      <section className="relative pt-24 pb-32 bg-gradient-to-tr from bg-black to-gray-600 overflow-hidden">
        {/* Decorative Blobs */}
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-900 opacity-20 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.1, 0.2] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-900 opacity-20 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.1, 0.2] }}
          transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut', delay: 1 }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Hero Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-8"
            >
              <AnimatePresence>
                <motion.h1
                  key={slogans[currentSloganIndex]}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
                    exit: { opacity: 0, y: -20, transition: { duration: 0.5, ease: 'easeIn' } },
                  }}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                    {displayedText}
                    <motion.span variants={blinkCaret} animate="blink">
                      |
                    </motion.span>
                  </span>
                </motion.h1>
              </AnimatePresence>

              <motion.p
                variants={fadeInUp}
                className="mt-4 text-lg md:text-xl text-gray-300 max-w-lg"
              >
                Book top doctors, receive digital prescriptions instantly, order
                medicine, and manage your health records—all in one seamless
                platform.
              </motion.p>

              <motion.div variants={fadeInUp} className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button
                  as={Link}
                  to="/signup"
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-pink-600 hover:to-indigo-600 text-black"
                >
                  Get Started
                </Button>
                <Button
                  as={Link}
                  to="/doctors"
                  variant="outline"
                  size="lg"
                  className="border-pink-400 text-pink-400 hover:bg-gray-700"
                >
                  Find Doctors
                </Button>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-12 grid grid-cols-3 gap-6">
                {[
                  { icon: <Users className="text-pink-400" />, title: '10K+', subtitle: 'Patients' },
                  { icon: <Award className="text-pink-400" />, title: '500+', subtitle: 'Doctors' },
                  { icon: <CheckCircle className="text-pink-400" />, title: '98%', subtitle: 'Satisfaction' },
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    className="flex flex-col items-center bg-gray-800 rounded-2xl p-6 shadow-lg"
                    variants={fadeInUp}
                    transition={{ delay: 0.6 + idx * 0.1, duration: 0.6 }}
                  >
                    <div className="text-3xl mb-2">{stat.icon}</div>
                    <div className="text-2xl font-bold">{stat.title}</div>
                    <div className="text-sm text-gray-400">{stat.subtitle}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Hero Image with Overlays */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-600 to-pink-600 opacity-25 blur-2xl" />
              <div className="relative bg-black p-4 rounded-3xl shadow-2xl overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Doctor with patient"
                  className="w-full h-auto object-cover rounded-lg"
                />

                {/* Appointment Confirmation Overlay */}
                <motion.div
                  initial={{ x: -60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="absolute left-0 bottom-24 transform -translate-y-1/2"
                >
                  <div className="bg-gray-800 rounded-r-lg shadow-lg p-4 flex items-center space-x-3 max-w-xs ring-1 ring-gray-700">
                    <div className="bg-green-900 p-2 rounded-full text-green-400">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <p className="font-medium">Appointment Confirmed</p>
                      <p className="text-sm text-gray-400">Dr. Sarah Johnson, 10:30 AM</p>
                    </div>
                  </div>
                </motion.div>

                {/* Time Slots Overlay */}
                <motion.div
                  initial={{ x: 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="absolute right-0 top-20 transform -translate-y-1/2"
                >
                  <div className="bg-gray-800 rounded-l-lg shadow-lg p-4 ring-1 ring-gray-700 max-w-xs">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="bg-pink-800 p-2 rounded-full text-pink-400">
                        <Calendar size={20} />
                      </div>
                      <p className="font-medium">Available Time Slots</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['9:00', '10:30', '11:45'].map((time, i) => (
                        <div
                          key={i}
                          className="bg-gray-700 rounded-full px-3 py-1 text-xs text-center text-gray-400"
                        >
                          {time}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* —————————— HOW IT WORKS SECTION —————————— */}
      <section className="py-24 bg-gradient-to-bl from bg-black to-white-800 overflow-hidden relative">
        <motion.div
          className="absolute top-10 right-10 w-48 h-48 rounded-full bg-yellow-900 opacity-20 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.1, 0.2] }}
          transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div>
            <motion.h2
              initial="hidden"
              animate="visible"
              variants={headingVariants}
              className="text-3xl font-extrabold text-center"
            >
              How It Works
            </motion.h2>
            <motion.p
              initial="hidden"
              animate="visible"
              variants={descVariants}
              className="mt-4 text-center text-lg text-gray-400"
            >
              We’ve simplified booking appointments with top healthcare professionals in three easy
              steps.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
          >
            {[
              {
                icon: <Search className="w-10 h-10 text-pink-400" />,
                title: 'Find Doctors',
                description: 'Search specialists by specialty, location, availability, and patient reviews.',
              },
              {
                icon: <Calendar className="w-10 h-10 text-pink-400" />,
                title: 'Book Appointments',
                description: 'Choose a convenient time slot and confirm your appointment in a few clicks.',
              },
              {
                icon: <Car className="w-10 h-10 text-pink-400" />,
                title: 'Get Transport',
                description: 'Arrange medical transportation directly to your doorstep for hassle-free visits.',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                custom={idx}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center p-4 bg-pink-800 rounded-lg mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* —————————— CONNECTING YOU TO THE PEOPLE (3D SCENE) —————————— */}
      <section className="py-24 bg-gradient-to-tr from- bg-black to-gray-800 flex flex-col items-center justify-center relative">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-extrabold mb-12 text-center"
        >
          Connecting You to the People
        </motion.h2>

        <div className="relative w-96 h-96">
          <Canvas
            shadows
            gl={{ antialias: true }}
            camera={{ position: [0, 0, 8], fov: 50 }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* A bit of ambient light so the far side is never totally black */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />

            {/* 3D Earth (full equirect texture, no gaps) */}
            <EarthModel />

            {/* Optional falling stars */}
            <Stars />

            {/* Optional shooting star */}
            <ShootingStar />
          </Canvas>
        </div>
      </section>

      {/* —————————— CTA SECTION —————————— */}
      <section className="py-24 bg-gradient-to-br from bg-black via-gray-800 to-gray-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left max-w-xl"
            >
              <h2 className="text-3xl font-extrabold mb-4">Ready to prioritize your health?</h2>
              <p className="text-xl text-gray-300 mb-6">
                Join thousands of patients who have simplified their healthcare journey with MedBook.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  as={Link}
                  to="/signup"
                  variant="secondary"
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-200"
                >
                  Sign Up Now
                </Button>
                <Button
                  as={Link}
                  to="/how-it-works"
                  variant="outline"
                  size="lg"
                  className="text-white border-white hover:bg-white/10"
                >
                  Learn More
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-sm mx-auto lg:mx-0"
            >
              <img
                src={patient}
                alt="Happy patient"
                className="w-full rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>

        <Chatbot />
      </section>
    </main>
  );
}
