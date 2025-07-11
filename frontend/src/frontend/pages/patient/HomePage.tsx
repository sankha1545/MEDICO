import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Calendar, Search, CheckCircle, Users, Award, Car, Heart, Brain, Eye, Stethoscope } from 'lucide-react';
import { Button } from '../../components/common/Button';
import Chatbot from '../../components/common/chatbot/chatbot';
import earth from '../../assets/earth.png'
import CombinedTutorial from '../../components/common/StartJourneyModal';

// 3D Earth Component with Digital Texture
function EarthModel() {
  const earthRef = useRef<THREE.Mesh>(null!);

  // Load the digital map texture (uploaded by the user)
  const texture = useLoader(THREE.TextureLoader, earth);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.2;  // Keep rotating Earth
    }
  });

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

// Blinking Stars Component (Updated)
function BlinkingStars() {
  const groupRef = useRef<THREE.Points>(null!);

  const starPositions = useMemo(() => {
    const positions = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 10 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const positions = groupRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length / 3; i++) {
      if (Math.random() < 0.01) {
        positions[i * 3 + 1] += Math.random() * 0.2 - 0.1; // Add slight movement to create blinking effect
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

// Main HomePage Component (Updated)
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
          () => setDisplayedText(current.slice(0, displayedText.length + 1)),
          typingSpeed
        );
      } else {
        timeout = setTimeout(() => setIsDeleting(true), pauseAfterFull);
      }
    } else {
      if (displayedText.length > 0) {
        timeout = setTimeout(
          () => setDisplayedText(current.slice(0, displayedText.length - 1)),
          deletingSpeed
        );
      } else {
        setIsDeleting(false);
        setCurrentSloganIndex((prev) => (prev + 1) % slogans.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentSloganIndex, slogans]);

  // Animation variants
  const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
  };
  
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
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
      transition: { delay: 0.3 + i * 0.15, duration: 0.6, ease: 'easeOut' },
    }),
    hover: { scale: 1.05, transition: { duration: 0.2 } },
  };

  return (
   
    <main className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-hidden">
        
     <CombinedTutorial />   

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 8], fov: 50 }} style={{ position: 'fixed', top: 0, left: 0 }}>
            <Suspense fallback={null}>
              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
              <ambientLight intensity={0.3} />
              <directionalLight position={[5, 5, 5]} intensity={0.8} />
              <EarthModel />
              <BlinkingStars />
            </Suspense>
          </Canvas>
        </div>

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
                medicine, and manage your health records—all in one seamless platform.
              </motion.p>

              <motion.div variants={fadeInUp} className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button
                  as={Link}
                  to="/doctors"
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-pink-600 hover:to-indigo-600"
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
                  { icon: <CheckCircle className="text-pink-400" />, title: '98%', subtitle: 'Satisfaction' }
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    className="flex flex-col items-center bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700"
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

            {/* Right Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-600 to-pink-600 opacity-25 blur-2xl" />
              <div className="relative bg-black/50 backdrop-blur-sm p-4 rounded-3xl shadow-2xl overflow-hidden border border-gray-700">
                <img
                  src="https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Doctor with patient"
                  className="w-full h-auto object-cover rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-bl overflow-hidden relative" style={{background:"transparent"}}>
        <motion.div
          className="absolute top-10 right-10 w-48 h-48 rounded-full bg-yellow-900 opacity-20 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.1, 0.2] }}
          transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              We've simplified booking appointments with top healthcare professionals in three easy steps.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
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
                whileInView="visible"
                viewport={{ once: true }}
                whileHover="hover"
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-lg"
              >
                <div className="inline-flex items-center justify-center p-4 bg-pink-800/50 rounded-lg mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br relative overflow-hidden"  style={{background:"transparent"}}>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left max-w-xl"
            >
              <h2 className="text-3xl font-extrabold mb-4">Connecting You To The World's Best Doctors</h2>
              <p className="text-xl text-gray-300 mb-6">
                Join thousands of patients who have simplified their healthcare journey with MedicoX.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  as={Link}
                  to="/doctors"
                  variant="secondary"
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-200"
                >
                  Get Started Now
                </Button>
                <Button
                  as={Link}
                  to="/services"
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
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-sm mx-auto lg:mx-0"
            >
              <img
                src="https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
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
