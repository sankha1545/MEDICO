// pages/services.tsx

import React from 'react';
import { motion } from 'framer-motion';
import General_Consultation from '../../assets/general_consultation.jpg';
import Cardiology from '../../assets/Cardiology.jpg';
import Pediatric_Care from '../../assets/pediatrician.jpg';
import Dental_Services from '../../assets/Dental.jpg';
import Dermatology from '../../assets/Dermatology.jpg';
import Telehealth from '../../assets/telehealth.jpg';
import Chatbot from '../../components/common/chatbot/chatbot';

export default function ServicePage() {
  const services = [
    {
      title: 'General Consultation',
      description: 'Book appointments with experienced general practitioners for primary health concerns.',
      icon: General_Consultation,
    },
    {
      title: 'Pediatric Care',
      description: 'Specialized healthcare services for infants, children, and adolescents.',
      icon: Pediatric_Care,
    },
    {
      title: 'Dental Services',
      description: 'Comprehensive dental checkups, cleanings, and procedures.',
      icon: Dental_Services,
    },
    {
      title: 'Cardiology',
      description: 'Expert cardiac checkups, tests, and follow-up consultations.',
      icon: Cardiology,
    },
    {
      title: 'Dermatology',
      description: 'Skin consultations, treatments, and cosmetic dermatology services.',
      icon: Dermatology,
    },
    {
      title: 'Telehealth',
      description: 'Virtual appointments from the comfort of your home.',
      icon: Telehealth,
    },
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-gray-100 flex flex-col">
      {/* HERO SECTION */}
      <section className="relative w-full h-80 lg:h-96 overflow-hidden">
        {/* Background Image with Dark Overlay */}
        <motion.div
          className="absolute inset-0 bg-[url('/hero/services-bg.jpg')] bg-cover bg-center opacity-30"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 to-violet-950 /80" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-teal-300 mb-2"
          >
            Our Medical Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.3 } }}
            className="text-lg sm:text-xl text-gray-300 max-w-2xl"
          >
            Explore our wide range of healthcare solutions—designed to meet all your medical needs, under one roof.
          </motion.p>
        </div>
      </section>

      {/* SERVICES GRID */}
      <motion.section
        className="flex-grow px-4 sm:px-6 lg:px-8 py-16"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="relative bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden cursor-pointer transform hover:scale-105 transition-transform"
            >
              {/* Blended Image Overlay */}
              <motion.div
                className="absolute inset-0 bg-cover bg-center blend-overlay opacity-20"
                style={{ backgroundImage: `url(${service.icon})` }}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 5, ease: 'easeOut' }}
              />
              <div className="relative p-6 flex flex-col items-start space-y-4 h-full">
                <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center">
                  <img src={service.icon} alt={`${service.title} icon`} className="w-6 h-6 object-cover rounded-full" />
                </div>
                <h3 className="text-2xl font-semibold text-white">{service.title}</h3>
                <p className="text-gray-300 flex-grow">{service.description}</p>
                <motion.a
                  href="/booking"
                  className="mt-4 inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-full text-sm font-medium text-white shadow-md transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Book Now
                </motion.a>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CALL TO ACTION */}
      <section className="w-full bg-gray-900/80 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-6"
          >
            Ready to Take Charge of Your Health?
          </motion.h2>
          <motion.a
            href="/booking"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="inline-flex items-center px-8 py-4 bg-teal-500 hover:bg-teal-600 rounded-full text-lg font-semibold text-white shadow-xl transform hover:scale-105 transition"
          >
            Schedule an Appointment
          </motion.a>
        </div>
      </section>

      {/* PERSISTENT CHATBOT */}
      <div className="fixed bottom-6 right-6 z-50">
        <Chatbot />
      </div>
    </div>
  );
}
