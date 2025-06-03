// src/frontend/pages/patient/About.tsx
import { motion } from 'framer-motion';
import Chatbot from '../../components/common/chatbot/chatbot';

import company1 from '../../assets/company  (1).svg';
import company2 from '../../assets/company  (2).svg';
import company3 from '../../assets/company  (3).svg';
import company4 from '../../assets/company  (4).svg';
import company5 from '../../assets/company  (5).svg';
import company6 from '../../assets/company  (6).svg';
import company7 from '../../assets/company  (7).svg';
import company8 from '../../assets/company  (8).svg';
import company9 from '../../assets/company  (9).svg';
import company10 from '../../assets/company  (10).svg';

export default function About() {
  const milestones = [
    { year: '2010', text: 'Founded by a team of healthcare visionaries.' },
    { year: '2015', text: 'Partnered with 100+ clinics across the globe.' },
    { year: '2020', text: 'Unveiled AI-powered diagnosis tools.' },
    { year: '2023', text: 'Over 2 million patients empowered.' },
  ];

  const team = [
    { name: 'Dr. Aisha Khan', role: 'Chief Medical Officer', img: '/team/aisha.jpg' },
    { name: 'Ravi Menon', role: 'Head of Technology', img: '/team/ravi.jpg' },
    { name: 'Sofia Martinez', role: 'Head of Community', img: '/team/sofia.jpg' },
    { name: 'Liam O’Connor', role: 'UX Lead', img: '/team/liam.jpg' },
  ];

  const partners = [
    { src: company1, alt: 'Company 1' },
    { src: company2, alt: 'Company 2' },
    { src: company3, alt: 'Company 3' },
    { src: company4, alt: 'Company 4' },
    { src: company5, alt: 'Company 5' },
    { src: company6, alt: 'Company 6' },
    { src: company7, alt: 'Company 7' },
    { src: company8, alt: 'Company 8' },
    { src: company9, alt: 'Company 9' },
    { src: company10, alt: 'Company 10' },
  ];

  // Duplicate once for seamless loop
  const marqueePartners = [...partners, ...partners];

  return (
    <div className="w-full bg-gray-900 text-white flex flex-col">
      {/* HERO SECTION */}
      <section className="w-full bg-gray-900 py-20 px-4 sm:px-6 lg:px-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl font-extrabold text-emerald-400 mb-4"
        >
          About MedicoX
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-gray-300 max-w-2xl mx-auto"
        >
          Connecting millions to quality healthcare—fast, secure, and compassionate.
        </motion.p>
      </section>

      {/* MISSION & VISION */}
      <section className="w-full bg-gray-800 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gray-900 p-8 rounded-2xl shadow-md"
          >
            <h2 className="text-2xl font-semibold text-teal-300 mb-3">Our Mission</h2>
            <p className="text-gray-400">
              Empowering patients with seamless access to healthcare professionals through technology and empathy.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-900 p-8 rounded-2xl shadow-md"
          >
            <h2 className="text-2xl font-semibold text-teal-300 mb-3">Our Vision</h2>
            <p className="text-gray-400">
              To be the global leader in accessible, personalized, and digital-first healthcare experiences.
            </p>
          </motion.div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="w-full bg-gray-900 py-24 px-4 sm:px-6 lg:px-8">
        <h3 className="text-3xl font-bold text-center text-white mb-12">Our Journey</h3>
        <div className="relative max-w-4xl mx-auto">
          <div className="absolute left-1/2 transform -translate-x-1 bg-emerald-600 w-1 h-full" />
          {milestones.map((m, idx) => (
            <motion.div
              key={m.year}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
              className={`mb-12 flex w-full ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-80 hover:scale-105 transition">
                <span className="text-emerald-400 font-bold text-xl">{m.year}</span>
                <p className="text-gray-300 mt-2">{m.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TEAM SECTION */}
      <section className="w-full bg-gray-800 py-24 px-4 sm:px-6 lg:px-8">
        <h3 className="text-3xl font-bold text-center text-white mb-12">Meet the Team</h3>
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, idx) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="bg-gray-900 p-6 rounded-2xl shadow-md text-center hover:bg-gray-700 transition"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-2 border-emerald-500">
                <img
                  src={member.img}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-xl font-semibold text-white">{member.name}</h4>
              <p className="text-gray-400 mt-1">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* OUR PARTNERS (SEAMLESS MARQUEE) */}
      <section className="w-full bg-gray-900 py-20 px-4 sm:px-6 lg:px-8">
        <h3 className="text-3xl font-bold text-center text-white mb-12">Our Partners</h3>
        <div className="relative overflow-hidden">
          <div className="marquee-container">
            <div className="marquee-track">
              {marqueePartners.map((partner, idx) => (
                <div key={idx} className="marquee-item flex-shrink-0 mx-8">
                  <img
                    src={partner.src}
                    alt={partner.alt}
                    className="w-40 h-auto object-contain"
                    style={{ transform: 'rotateY(-15deg)' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="w-full bg-gray-900 py-16 px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-white mb-6"
        >
          Ready to Experience Next-Gen Healthcare?
        </motion.h2>
        <motion.a
          href="/book-appointment"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="inline-flex items-center px-10 py-4 bg-teal-500 hover:bg-teal-600 rounded-full text-lg font-semibold shadow-2xl transform hover:scale-105 transition"
        >
          Book an Appointment
        </motion.a>
      </section>

      {/* PERSISTENT CHATBOT */}
      <div className="fixed bottom-6 right-6 z-50">
        <Chatbot />
      </div>

      <style jsx>{`
        .marquee-container {
          width: 100%;
          overflow: hidden;
        }
        .marquee-track {
          display: flex;
          width: calc(20 * 10rem); /* 20 items * 10rem item width (8rem image + margins) */
          animation: marquee 20s linear infinite;
        }
        .marquee-item {
          width: 10rem; /* 8rem image + 2rem total margins (mx-8) */
          flex-shrink: 0;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
