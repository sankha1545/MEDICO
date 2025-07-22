// File: frontend/src/pages/HomePage.tsx

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Calendar, Search, CheckCircle, Users, Award, Car } from 'lucide-react';
import { Button } from '../../components/common/Button';
import Chatbot from '../../components/common/chatbot/chatbot';
import earthTexture from '../../assets/earth.png';


function EarthModel() {
  const ref = useRef<THREE.Mesh>(null!);
  const texture = useLoader(THREE.TextureLoader, earthTexture);
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.2;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

function BlinkingStars() {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
      arr[i*3 + 0] = (Math.random() - 0.5) * 20;
      arr[i*3 + 1] = Math.random() * 10 + 2;
      arr[i*3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  useFrame(() => {
    const pos = (ref.current.geometry.attributes.position.array as Float32Array);
    for (let i = 0; i < pos.length; i += 3) {
      if (Math.random() < 0.01) pos[i+1] += Math.random() * 0.2 - 0.1;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} />
    </points>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  const slogans = [
    'Your Health, Our Priority',
    'Expert Care, Anytime, Anywhere',
    'Wellness Starts with a Click',
    'Connecting You to Better Care',
    'Your Guide to a Healthier Life',
  ];
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const full = slogans[idx];
    if (!deleting) {
      if (text.length < full.length) {
        timeout = setTimeout(() => setText(full.slice(0, text.length + 1)), 100);
      } else {
        timeout = setTimeout(() => setDeleting(true), 1500);
      }
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(full.slice(0, text.length - 1)), 50);
      } else {
        setDeleting(false);
        setIdx((i) => (i + 1) % slogans.length);
      }
    }
    return () => clearTimeout(timeout);
  }, [text, deleting, idx, slogans]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
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
    <main className="relative overflow-hidden text-white bg-gradient-to-br from-black via-gray-900 to-black">
     

      {/* Hero */}
      <section className="relative flex items-center justify-center min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0,0,8], fov: 50 }} style={{ position: 'fixed', top:0, left:0 }}>
            <Suspense fallback={null}>
              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5}/>
              <ambientLight intensity={0.3}/>
              <directionalLight position={[5,5,5]} intensity={0.8}/>
              <EarthModel />
              <BlinkingStars />
            </Suspense>
          </Canvas>
        </div>

        {/* Blobs */}
        <motion.div
          className="absolute bg-purple-900 rounded-full -top-32 -left-32 w-96 h-96 opacity-20 blur-3xl"
          animate={{ scale: [1,1.1,1], opacity: [0.2,0.1,0.2] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bg-indigo-900 rounded-full -bottom-32 -right-32 w-96 h-96 opacity-20 blur-3xl"
          animate={{ scale: [1,1.15,1], opacity: [0.2,0.1,0.2] }}
          transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut', delay: 1 }}
        />

        <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2">
            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.2 } } }}>
              <AnimatePresence>
                <motion.h1
                  key={slogans[idx]}
                  initial={{ opacity: 0, y:20 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }}
                  exit={{ opacity: 0, y:-20, transition: { duration:0.5, ease:'easeIn' } }}
                  className="text-4xl font-extrabold leading-tight text-transparent md:text-5xl lg:text-6xl bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300"
                >
                  {text}<span className="animate-pulse">|</span>
                </motion.h1>
              </AnimatePresence>

              <motion.p variants={fadeInUp} className="max-w-lg mt-4 text-lg text-gray-300 md:text-xl">
                Book top doctors, receive digital prescriptions instantly, order medicine, and manage your health records—all in one seamless platform.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col gap-4 mt-8 sm:flex-row">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-pink-400 border-pink-400 hover:bg-gray-700"
                  onClick={() => navigate('/doctors')}
                >
                  Find Doctors
                </Button>
              </motion.div>

              <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-6 mt-12">
                {[
                  { icon: <Users className="text-pink-400"/>, title: '10K+', subtitle: 'Patients' },
                  { icon: <Award className="text-pink-400"/>, title: '500+', subtitle: 'Doctors' },
                  { icon: <CheckCircle className="text-pink-400"/>, title: '98%', subtitle: 'Satisfaction' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex flex-col items-center p-6 border border-gray-700 shadow-lg bg-gray-800/50 backdrop-blur-sm rounded-2xl"
                  >
                    <div className="mb-2 text-3xl">{s.icon}</div>
                    <div className="text-2xl font-bold">{s.title}</div>
                    <div className="text-sm text-gray-400">{s.subtitle}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.7, delay:0.3 }} className="relative hidden lg:block">
              <div className="absolute opacity-25 -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-600 to-pink-600 blur-2xl" />
              <div className="relative p-4 overflow-hidden border border-gray-700 shadow-2xl rounded-3xl bg-black/50 backdrop-blur-sm">
                <img
                  src="https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Doctor with patient"
                  className="object-cover w-full rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24">
        <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <motion.div initial={{ opacity:0, y:50 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.8 }} className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold text-transparent md:text-5xl bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              How It Works
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-400">
              We've simplified booking appointments with top healthcare professionals in three easy steps.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={{ visible: { transition: { staggerChildren: 0.2 } } }} className="grid gap-12 md:grid-cols-3">
            {[
              { icon: <Search className="w-10 h-10 text-pink-400"/>, title: 'Find Doctors', desc: 'Search specialists by specialty, location, availability, and patient reviews.' },
              { icon: <Calendar className="w-10 h-10 text-pink-400"/>, title: 'Book Appointments', desc: 'Choose a convenient time slot and confirm your appointment in a few clicks.' },
              { icon: <Car className="w-10 h-10 text-pink-400"/>, title: 'Get Transport', desc: 'Arrange medical transportation directly to your doorstep for hassle-free visits.' },
            ].map((f, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once:true }}
                whileHover="hover"
                className="p-8 border border-gray-700 shadow-lg bg-gray-800/50 backdrop-blur-sm rounded-2xl"
              >
                <div className="inline-flex items-center justify-center p-4 mb-6 rounded-lg bg-pink-800/50">{f.icon}</div>
                <h3 className="mb-3 text-xl font-semibold">{f.title}</h3>
                <p className="text-gray-400">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA / Learn More */}
      <section className="relative py-24">
        <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
            <motion.div initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }} className="max-w-xl text-center lg:text-left">
              <h2 className="mb-4 text-3xl font-extrabold">Connecting You To The World's Best Doctors</h2>
              <p className="mb-6 text-xl text-gray-300">
                Join thousands of patients who have simplified their healthcare journey with MedicoX.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  variant="secondary"
                  size="lg"
                  className="text-gray-900 bg-white hover:bg-gray-200"
                  onClick={() => navigate('/about')}
                >
                  Get Started Now
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-white bg-orange-300 border-white hover:bg-orange-400"
                  onClick={() => setShowLearnMore((p) => !p)}
                >
                  {showLearnMore ? 'Show Less' : 'Learn More'}
                </Button>
              </div>
            </motion.div>
            <motion.div initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6, delay:0.2 }} className="w-full max-w-sm mx-auto lg:mx-0">
              <img
                src="https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Happy patient"
                className="w-full shadow-2xl rounded-2xl"
              />
            </motion.div>
          </div>
          <AnimatePresence>
            {showLearnMore && (
              <motion.div
                initial={{ height:0, opacity:0 }}
                animate={{ height:'auto', opacity:1 }}
                exit={{ height:0, opacity:0 }}
                transition={{ duration:0.5, ease:'easeInOut' }}
                className="mt-8 overflow-hidden text-gray-300"
              >
                <h3 className="mb-4 text-2xl font-semibold text-white">Why MedicoX?</h3>
                <p className="mb-4">
                  At MedicoX, we've built a platform that not only connects you with top-rated doctors but also ensures seamless appointment management, digital prescriptions, and easy medicine ordering—all from the comfort of your home.
                </p>
                <p>
                  Our advanced transport integration means you never have to worry about reaching your appointment, while our health records management keeps all your information secure and accessible whenever you need it.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Chatbot />
      </section>
    </main>
);
}
