
import { motion } from 'framer-motion';
import Chatbot from '../../components/common/chatbot/chatbot';

export default function About() {
  const milestones = [
    { year: '2010', text: 'Founded by a team of healthcare enthusiasts.' },
    { year: '2015', text: 'Expanded to 50+ partner clinics nationwide.' },
    { year: '2020', text: 'Launched telehealth services for remote care.' },
    { year: '2023', text: 'Served over 1 million happy patients.' },
  ];

  const team = [
    { name: 'Dr. Sarah Lee', role: 'Chief Medical Officer', img: '/team/sarah.jpg' },
    { name: 'James Patel', role: 'Head of Tech', img: '/team/james.jpg' },
    { name: 'Emily Chen', role: 'Community Manager', img: '/team/emily.jpg' },
  ];

  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4"
        >
          About Medico
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-gray-600"
        >
          At Medico, our mission is to connect you with quality healthcare easily and efficiently.
        </motion.p>
      </div>

      {/* Mission & Vision */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-semibold text-gray-800">Our Mission</h2>
          <p className="text-gray-600">
            To simplify the healthcare journey by providing a seamless booking experience, trusted medical professionals, and personalized support.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-semibold text-gray-800">Our Vision</h2>
          <p className="text-gray-600">
            To be the most reliable and accessible healthcare platform, empowering patients worldwide with choice and confidence.
          </p>
        </motion.div>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto mb-20">
        <h3 className="text-2xl font-semibold text-center text-gray-800 mb-8">Our Journey</h3>
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1 bg-blue-200 w-1 h-full"></div>
          {milestones.map((m, idx) => (
            <motion.div
              key={m.year}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
              className={`mb-8 flex w-full ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div className="bg-white p-6 rounded-2xl shadow-md w-80">
                <span className="text-blue-600 font-bold text-xl">{m.year}</span>
                <p className="text-gray-600 mt-2">{m.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div className="max-w-6xl mx-auto">
        <h3 className="text-2xl font-semibold text-center text-gray-800 mb-8">Meet Our Team</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, idx) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-md text-center"
            >
              <img
                src={member.img}
                alt={member.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
              <h4 className="text-xl font-semibold text-gray-800">{member.name}</h4>
              <p className="text-gray-600">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-16 text-center">
        <motion.a
          href="/services"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="inline-block bg-blue-600 text-white text-lg font-medium px-8 py-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          View Our Services
        </motion.a>
      </div>
      <Chatbot />
    </div>
  );
}
