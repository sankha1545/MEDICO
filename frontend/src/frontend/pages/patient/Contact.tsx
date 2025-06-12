// pages/contact.tsx

import React, { useState, ChangeEvent, FormEvent, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import Chatbot from '../../components/common/chatbot/chatbot';
import DNAHelix from '../../components/animations/3D/DNAHelix';
import MedicalParticles from '../../components/animations/3D/MedicalParticles';

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Submission failed');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0 opacity-30">
        <Canvas>
          <Suspense fallback={null}>
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 10, 5]} intensity={0.5} />
            <MedicalParticles />
            <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
              <group position={[5, 0, -3]} scale={0.8}><DNAHelix /></group>
            </Float>
          </Suspense>
        </Canvas>
      </div>

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.h1
            initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}
            className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          >
            Get in Touch
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl text-gray-300"
          >
            We’d love to hear from you! Fill out the form and we’ll respond promptly.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants} initial="hidden" animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
        >
          {/* Form Card */}
          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8"
          >
            {submitted ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="text-center py-12">
                <h2 className="text-3xl font-bold text-green-400 mb-4">Thank You!</h2>
                <p className="text-gray-300">Your message has been received. We'll be in touch soon.</p>
              </motion.div>
            ) : (
              <motion.form onSubmit={handleSubmit} variants={itemVariants}
                className="space-y-6"
              >
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <div className="flex flex-col">
                  <label htmlFor="name" className="text-gray-300 mb-1">Name</label>
                  <input id="name" name="name" type="text" required value={formData.name}
                    onChange={handleChange}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="email" className="text-gray-300 mb-1">Email</label>
                  <input id="email" name="email" type="email" required value={formData.email}
                    onChange={handleChange}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="phone" className="text-gray-300 mb-1">Phone</label>
                  <input id="phone" name="phone" type="tel" required value={formData.phone}
                    onChange={handleChange}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="message" className="text-gray-300 mb-1">Message</label>
                  <textarea id="message" name="message" rows={4} required value={formData.message}
                    onChange={handleChange}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="text-center">
                  <button type="submit" disabled={isLoading}
                    className={`px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg transition-transform ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  >
                    {isLoading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </motion.form>
            )}
          </motion.div>

          {/* Contact Info + Map */}
          <motion.div variants={itemVariants} className="space-y-8">
            {/** Info Cards **/}
            {[
              { label: 'Email', value: 'support@medico.com', svgPath: 'M16 12a4 4 0 10-8 0 4 0 008 0zm1.5 6.5h-13a2 2 0 00-2 2v.5a.5.5 0 00.5.5h17a.5.5 0 00.5-.5v-.5a2 2 0 00-2-2z' },
              { label: 'Phone', value: '(123) 456-7890', svgPath: 'M3 10l1.89 5.66a2 2 0 001.8 1.34h8.62a2 2 0 001.8-1.34L21 10m-9-7v4m0 0a4 4 0 110 8 4 4 0 010-8z' },
              { label: 'Address', value: '123 Health St, Wellness City, Carestate 45678', svgPath: 'M17 9v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9m5-4v4m0 0H7m5 0h5' },
            ].map((info, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex items-start space-x-4"
              >
                <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={info.svgPath} />
                </svg>
                <div>
                  <h4 className="font-semibold text-white mb-1">{info.label}</h4>
                  <p className="text-gray-300">{info.value}</p>
                </div>
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
              className="w-full h-64 rounded-2xl overflow-hidden border border-white/10"
            >
              <iframe
                title="Medico Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0190070366517!2d-122.41941538468118!3d37.7749297797591!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808c2b97fb13%3A0x4b58cdadbb1b0b0b!2s123%20Health%20St%2C%20San%20Francisco%2C%20CA%2094103!5e0!3m2!1sen!2sus!4v1617919123456"
                className="w-full h-full"
                loading="lazy"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Persistent Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <Chatbot />
      </div>
    </div>
  );
}
