// src/frontend/pages/patient/PrivacyPolicy.tsx
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Chatbot from '../../components/common/chatbot/chatbot';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  };
  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-100 to-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Decorative Floating Elements */}
      <motion.div
        className="absolute top-[-40px] left-[-60px] w-72 h-72 rounded-full bg-gradient-to-r from-purple-300 to-pink-300 opacity-20"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.1, 0.2] }}
        transition={{ repeat: Infinity, duration: 8 }}
      />
      <motion.div
        className="absolute bottom-[-50px] right-[-50px] w-64 h-64 rounded-full bg-gradient-to-r from-blue-300 to-indigo-300 opacity-20"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.05, 0.2] }}
        transition={{ repeat: Infinity, duration: 7, delay: 1 }}
      />

      {/* Hero Section */}
      <div className="max-w-3xl mx-auto text-center mb-12 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-teal-500 to-blue-500"
        >
          Privacy Policy
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-4 text-lg text-gray-700"
        >
          Your privacy is critically important to us. This policy explains how we collect, use, and protect your information.
        </motion.p>
      </div>

      {/* Content Sections */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-12 relative z-10"
      >
        {/* 1. Introduction */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
          <p className="text-gray-600 leading-relaxed">
            Welcome to MedBook. We’re committed to keeping your personal information safe and secure.
            This Privacy Policy explains what information we collect, how we use it, and your rights.
          </p>
        </motion.section>

        {/* 2. Information We Collect */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Information We Collect</h2>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
            <li><strong>Account Data:</strong> Name, email address, phone number, and password when you create an account.</li>
            <li><strong>Profile Information:</strong> Medical history, insurance details, and appointment preferences you provide.</li>
            <li><strong>Usage Data:</strong> Browsing patterns, pages visited, and features used on our platform.</li>
            <li><strong>Device &amp; Log Data:</strong> IP address, browser type, device identifiers, and server logs collected automatically.</li>
          </ul>
        </motion.section>

        {/* 3. How We Use Your Information */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-600 leading-relaxed">
            We use collected information for:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 mt-3">
            <li>Providing and improving our services (e.g., booking appointments, telehealth visits).</li>
            <li>Communicating with you (e.g., appointment reminders, account notifications).</li>
            <li>Personalizing your experience (e.g., recommending doctors, health tips).</li>
            <li>Ensuring security and preventing fraud (e.g., verifying identity, monitoring unauthorized activity).</li>
          </ul>
        </motion.section>

        {/* 4. Cookies & Tracking */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Cookies &amp; Tracking</h2>
          <p className="text-gray-600 leading-relaxed">
            We use cookies and similar tracking technologies to:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 mt-3">
            <li>Remember your preferences and keep you logged in.</li>
            <li>Analyze site traffic and usage trends.</li>
            <li>Deliver targeted advertising, if you opt-in.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-4">
            You can opt out of cookies via your browser settings, but this may affect site functionality.
          </p>
        </motion.section>

        {/* 5. Third-Party Services */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Third-Party Services</h2>
          <p className="text-gray-600 leading-relaxed">
            We may share information with trusted third-party providers, including:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 mt-3">
            <li>Payment processors to handle transactions securely.</li>
            <li>Analytics providers (e.g., Google Analytics) to analyze site usage.</li>
            <li>Email service providers for sending notifications and newsletters.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-4">
            These providers are bound by strict confidentiality obligations and cannot use your data for other purposes.
          </p>
        </motion.section>

        {/* 6. Data Security */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Data Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We implement appropriate technical and organizational measures to protect your data, including:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 mt-3">
            <li>Encrypted connections (HTTPS) for data in transit.</li>
            <li>Secure storage with encryption at rest.</li>
            <li>Regular security audits and vulnerability assessments.</li>
            <li>Restricted access to personal data based on “need-to-know.”</li>
          </ul>
        </motion.section>

        {/* 7. Your Rights */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Your Rights</h2>
          <p className="text-gray-600 leading-relaxed">
            Depending on your jurisdiction, you may have the right to:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 mt-3">
            <li>Access and obtain a copy of your personal data.</li>
            <li>Request correction or deletion of inaccurate data.</li>
            <li>Opt out of certain processing activities (e.g., marketing).</li>
            <li>Lodge a complaint with a supervisory authority.</li>
          </ul>
        </motion.section>

        {/* 8. Changes to This Policy */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this Privacy Policy periodically. We will post the revised date at the top
            (“Last Updated: Month Day, Year”) and notify users of material changes via email or site banner.
          </p>
        </motion.section>

        {/* 9. Contact Us */}
        <motion.section variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have questions or concerns about this Privacy Policy, please reach out:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 mt-3">
            <li>Email: <a href="mailto:privacy@medbook.com" className="text-blue-600 hover:underline">privacy@medbook.com</a></li>
            <li>Phone: <a href="tel:+15559876543" className="text-blue-600 hover:underline">+1 (555) 987-6543</a></li>
            <li>Address: 123 Healthcare Avenue, Medical District, New York, NY 10001</li>
          </ul>
        </motion.section>
      </motion.div>

      {/* Chatbot at Bottom */}
      <div className="relative z-10 mt-16">
        <Chatbot />
      </div>
    </div>
  );
}
