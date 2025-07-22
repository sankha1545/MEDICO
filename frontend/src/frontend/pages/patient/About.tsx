// File: src/pages/EnhancedAbout.tsx
import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Shield,
  Users,
  Award,
  Zap,
  Globe,
  TrendingUp,
  Star,
  Target,
} from 'lucide-react';
import DNAHelix from '../../components/animations/3D/DNAHelix';
import MedicalParticles from '../../components/animations/3D/MedicalParticles';
import Chatbot from '../../components/common/chatbot/chatbot';

const EnhancedAbout: React.FC = () => {
  const [showStartJourney, setShowStartJourney] = useState(false);

  const milestones = [
    { year: '2018', title: 'Founded', description: 'MedicoX was born from a vision to revolutionize healthcare accessibility', icon: <Zap className="w-6 h-6" />, color: 'from-blue-500 to-cyan-500' },
    { year: '2020', title: 'AI Integration', description: 'Launched our AI-powered diagnosis and recommendation system', icon: <Target className="w-6 h-6" />, color: 'from-purple-500 to-pink-500' },
    { year: '2022', title: 'Global Expansion', description: 'Expanded to serve patients across 15 countries worldwide', icon: <Globe className="w-6 h-6" />, color: 'from-green-500 to-emerald-500' },
    { year: '2024', title: 'Million Patients', description: 'Reached the milestone of serving over 1 million patients', icon: <Users className="w-6 h-6" />, color: 'from-orange-500 to-red-500' },
  ];

  const values = [
    { icon: <Heart className="w-8 h-8" />, title: 'Compassionate Care', description: 'Every patient interaction is guided by empathy and understanding', color: 'from-red-500 to-pink-500' },
    { icon: <Shield className="w-8 h-8" />, title: 'Privacy & Security', description: 'Your health data is protected with enterprise-grade security', color: 'from-blue-500 to-cyan-500' },
    { icon: <Zap className="w-8 h-8" />, title: 'Innovation', description: 'Continuously pushing the boundaries of digital healthcare', color: 'from-purple-500 to-indigo-500' },
    { icon: <Users className="w-8 h-8" />, title: 'Accessibility', description: 'Making quality healthcare accessible to everyone, everywhere', color: 'from-green-500 to-emerald-500' },
  ];

  const stats = [
    { value: '1M+', label: 'Patients Served', icon: <Users className="w-6 h-6" /> },
    { value: '5K+', label: 'Healthcare Providers', icon: <Award className="w-6 h-6" /> },
    { value: '15', label: 'Countries', icon: <Globe className="w-6 h-6" /> },
    { value: '99.9%', label: 'Uptime', icon: <TrendingUp className="w-6 h-6" /> },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0 opacity-20">
        <Canvas>
          <Suspense fallback={null}>
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 10, 5]} intensity={0.5} />
            <MedicalParticles />
            <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
              <group position={[5, 0, -3]} scale={0.8}>
                <DNAHelix />
              </group>
            </Float>
          </Suspense>
        </Canvas>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 py-8 mx-auto sm:px-6 md:px-12 lg:px-20 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="mb-6 text-4xl font-bold text-transparent sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            About MedicoX
          </motion.h1>
          <motion.p
            className="max-w-3xl mx-auto text-base leading-relaxed text-gray-300 sm:text-lg md:text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Revolutionizing healthcare through technology, compassion, and innovation. We're building the future of patient care, one connection at a time.
          </motion.p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 gap-6 mb-16 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="text-center"
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -10 }}
            >
              <div className="p-6 border bg-white/5 backdrop-blur-sm rounded-2xl border-white/10">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                  {stat.icon}
                </div>
                <motion.div
                  className="mb-2 text-2xl font-bold text-white sm:text-3xl md:text-4xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 + 0.5 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Mission & Vision */}
        <motion.div
          className="grid grid-cols-1 gap-8 mb-16 lg:grid-cols-2"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="p-6 border sm:p-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl border-white/10"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <Target className="w-12 h-12 p-3 mb-4 text-white bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl" />
            <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">Our Mission</h2>
            <p className="text-base leading-relaxed text-gray-300 sm:text-lg">
              To democratize healthcare by leveraging cutting-edge technology to connect patients with the right care at the right time, making quality healthcare accessible, affordable, and convenient for everyone.
            </p>
          </motion.div>
          <motion.div
            className="p-6 border sm:p-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl border-white/10"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <Star className="w-12 h-12 p-3 mb-4 text-white bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl" />
            <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">Our Vision</h2>
            <p className="text-base leading-relaxed text-gray-300 sm:text-lg">
              To create a world where distance, time, and resources are no longer barriers to receiving exceptional healthcare. We envision a future where every person has instant access to personalized, AI-enhanced medical care.
            </p>
          </motion.div>
        </motion.div>

        {/* Core Values */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="mb-8 text-3xl font-bold text-center text-transparent sm:text-4xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {values.map((val, i) => (
              <motion.div
                key={i}
                className="relative group"
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className={`relative p-6 sm:p-8 bg-gradient-to-br ${val.color} rounded-2xl backdrop-blur-sm border border-white/10 overflow-hidden`}>
                  <motion.div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-br from-white/10 to-transparent group-hover:opacity-100" />
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 mb-4 bg-white/20 rounded-xl">
                      {val.icon}
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl">{val.title}</h3>
                    <p className="text-sm leading-relaxed sm:text-base text-white/90">{val.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="mb-8 text-3xl font-bold text-center text-transparent sm:text-4xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
            Our Journey
          </h2>
          <div className="relative">
            <div className="absolute w-1 h-full transform -translate-x-1/2 rounded-full left-1/2 bg-gradient-to-b from-blue-500 to-purple-500" />
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                className={`relative flex flex-col sm:flex-row items-center mb-12 ${i % 2 === 0 ? 'sm:justify-start' : 'sm:justify-end'}`}
                initial={{ opacity: 0, x: i % 2 === 0 ? -100 : 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
              >
                <div className={`w-full sm:w-5/12 ${i % 2 === 0 ? 'sm:pr-6' : 'sm:pl-6'}`}>
                  <motion.div
                    className={`bg-gradient-to-br ${m.color} rounded-2xl p-6 backdrop-blur-sm border border-white/10`}
                    whileHover={{ scale: 1.05, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center mb-4">
                      <div className="flex items-center justify-center w-10 h-10 mr-3 bg-white/20 rounded-xl">
                        {m.icon}
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white sm:text-2xl">{m.year}</div>
                        <div className="text-base font-semibold sm:text-lg text-white/90">{m.title}</div>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-white/80">{m.description}</p>
                  </motion.div>
                </div>
                <motion.div
                  className="absolute w-5 h-5 transform -translate-x-1/2 bg-white border-4 border-blue-500 rounded-full left-1/2"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.2 + 0.3 }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="p-8 mb-16 text-center border sm:p-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl border-white/10"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl md:text-4xl">Join Our Healthcare Revolution</h2>
          <p className="max-w-2xl mx-auto mb-6 text-base text-gray-300 sm:text-lg">
            Be part of the future of healthcare. Experience the difference that technology, compassion, and innovation can make in your health journey.
          </p>
        
        </motion.div>
      </div>

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
        className="fixed z-50 bottom-6 right-6"
      >
        <Chatbot />
      </motion.div>

    </div>
  );
}

export default EnhancedAbout;
