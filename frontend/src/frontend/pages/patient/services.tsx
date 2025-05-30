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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4"
        >
          Our Medical Services
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-gray-600"
        >
          Explore our wide range of healthcare services designed to meet all your medical needs.
        </motion.p>
      </div>

      {/* Services Grid */}
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {services.map((service, idx) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-transform"
          >
            <img
              src={service.icon}
              alt={`${service.title} icon`}
              className="h-12 w-12 mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {service.title}
            </h3>
            <p className="text-gray-600">
              {service.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="mt-20 text-center">
        <motion.a
          href="/booking"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="inline-block bg-blue-600 text-white text-lg font-medium px-8 py-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          Book an Appointment
        </motion.a>
      </div>
      <Chatbot />
    </div>
  );
}