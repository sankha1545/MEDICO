// src/frontend/pages/patient/TermsOfService.tsx
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Chatbot from '../../components/common/chatbot/chatbot';

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  };
  const sectionVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Decorative Floating Elements */}
      <motion.div
        className="absolute top-[-40px] right-[-60px] w-64 h-64 rounded-full bg-gradient-to-r from-pink-300 to-red-300 opacity-20"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.1, 0.2] }}
        transition={{ repeat: Infinity, duration: 7 }}
      />
      <motion.div
        className="absolute bottom-[-50px] left-[-50px] w-72 h-72 rounded-full bg-gradient-to-r from-yellow-300 to-orange-300 opacity-20"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.05, 0.2] }}
        transition={{ repeat: Infinity, duration: 8, delay: 1 }}
      />

      {/* Hero Section */}
      <div className="max-w-3xl mx-auto text-center mb-12 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-pink-500 to-purple-500"
        >
          Terms of Service
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-4 text-lg text-gray-700"
        >
          Please read these terms carefully before using MedBook. By accessing or using our services, you agree to be bound by these terms.
        </motion.p>
      </div>

      {/* Content Sections */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-12 relative z-10"
      >
        {/* 1. Acceptance of Terms */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing or using MedBook (the “Service”), you agree to comply with and be bound by these Terms of Service (“Terms”). If you disagree with any part of the Terms, you may not use the Service.
          </p>
        </motion.section>

        {/* 2. Eligibility */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Eligibility</h2>
          <p className="text-gray-600 leading-relaxed">
            You must be at least 18 years old to create an account and use the Service. By registering, you represent and warrant that you meet these eligibility requirements.
          </p>
        </motion.section>

        {/* 3. User Accounts & Conduct */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. User Accounts &amp; Conduct</h2>
          <p className="text-gray-600 leading-relaxed">
            When you create an account, you agree to provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your login credentials. You agree not to:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 mt-3">
            <li>Use the Service for any unlawful purpose.</li>
            <li>Harass, threaten, or violate the rights of others.</li>
            <li>Upload malicious content or viruses.</li>
            <li>Share your password or account with unauthorized users.</li>
          </ul>
        </motion.section>

        {/* 4. Intellectual Property */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Intellectual Property</h2>
          <p className="text-gray-600 leading-relaxed">
            All content provided on MedBook, including text, graphics, logos, and software, is our property or licensed to us and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce or distribute our content without express written permission.
          </p>
        </motion.section>

        {/* 5. Termination */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Termination</h2>
          <p className="text-gray-600 leading-relaxed">
            We may suspend or terminate your account at our discretion, without notice, if we believe you have violated these Terms or engaged in any harmful activity. You may also terminate your account at any time through your account settings.
          </p>
        </motion.section>

        {/* 6. Disclaimers & Warranties */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Disclaimers &amp; Warranties</h2>
          <p className="text-gray-600 leading-relaxed">
            <strong>AS IS:</strong> The Service is provided “as is” without any warranties. We do not guarantee uninterrupted or error-free service.<br />
            <strong>NO MEDICAL ADVICE:</strong> Information on MedBook is for general informational purposes only and should not replace professional medical advice.
          </p>
        </motion.section>

        {/* 7. Limitation of Liability */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            To the fullest extent permitted by law, MedBook and its affiliates will not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the Service.
          </p>
        </motion.section>

        {/* 8. Governing Law */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Governing Law</h2>
          <p className="text-gray-600 leading-relaxed">
            These Terms are governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions. Any dispute shall be resolved in the state or federal courts located in New York County, NY.
          </p>
        </motion.section>

        {/* 9. Contact Information */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Contact Information</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have questions about these Terms, please contact us at: <br />
            <a href="mailto:legal@medbook.com" className="text-blue-600 hover:underline">legal@medbook.com</a> <br />
            <a href="tel:+15559876543" className="text-blue-600 hover:underline">+1 (555) 987-6543</a>
          </p>
        </motion.section>
      </motion.div>

      {/* Chatbot at Bottom */}
      <div className="relative z-10 mt-16">
        <Chatbot />
      </div>
    </div>
  );
}
