// pages/contact.tsx

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import Chatbot from '../../components/common/chatbot/chatbot';

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
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
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      {/* HERO SECTION */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-gray-900/70 z-10" />
        <motion.div
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: 'easeOut' }}
          className="absolute inset-0 bg-[url('/hero/contact-bg.jpg')] bg-cover bg-center opacity-30"
        />
        <div className="relative z-20 max-w-2xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl sm:text-6xl font-extrabold text-teal-300 mb-4"
          >
            Let’s Connect
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.3 } }}
            className="text-lg sm:text-xl text-gray-300"
          >
            We’d love to hear from you! Drop us a line and we’ll get back to you promptly.
          </motion.p>
        </div>
      </section>

      {/* CONTENT GRID */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex-grow max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 px-4 sm:px-6 lg:px-8 py-16"
      >
        {/* FORM CARD */}
        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-12"
            >
              <h2 className="text-3xl font-extrabold text-green-400 mb-4">Thank You!</h2>
              <p className="text-gray-300">
                Your message has been received. We’ll be in touch soon.
              </p>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              {/* Name */}
              <div className="flex flex-col">
                <label htmlFor="name" className="text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col">
                <label htmlFor="email" className="text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col">
                <label htmlFor="phone" className="text-sm font-medium text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                />
              </div>

              {/* Message */}
              <div className="flex flex-col">
                <label htmlFor="message" className="text-sm font-medium text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white resize-none"
                />
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-3 rounded-full shadow-lg transition-colors ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </motion.form>
          )}
        </div>

        {/* CONTACT INFO + MAP */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-2xl p-6 flex items-start space-x-4"
          >
            <svg className="h-6 w-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm1.5 6.5h-13a2 2 0 00-2 2v.5a.5.5 0 00.5.5h17a.5.5 0 00.5-.5v-.5a2 2 0 00-2-2z"
              />
            </svg>
            <div>
              <h4 className="font-semibold text-gray-200">Email</h4>
              <p className="text-gray-400">support@medico.com</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-2xl p-6 flex items-start space-x-4"
          >
            <svg className="h-6 w-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10l1.89 5.66a2 2 0 001.8 1.34h8.62a2 2 0 001.8-1.34L21 10m-9-7v4m0 0a4 4 0 110 8 4 4 0 010-8z"
              />
            </svg>
            <div>
              <h4 className="font-semibold text-gray-200">Phone</h4>
              <p className="text-gray-400">(123) 456-7890</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-2xl p-6 flex items-start space-x-4"
          >
            <svg className="h-6 w-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9m5-4v4m0 0H7m5 0h5"
              />
            </svg>
            <div>
              <h4 className="font-semibold text-gray-200">Address</h4>
              <p className="text-gray-400">123 Health St, Wellness City, Carestate 45678</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full h-64 overflow-hidden rounded-2xl shadow-2xl"
          >
            <iframe
              title="Medico Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0190070366517!2d-122.41941538468118!3d37.7749297797591!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808c2b97fb13%3A0x4b58cdadbb1b0b0b!2s123%20Health%20St%2C%20San%20Francisco%2C%20CA%2094103!5e0!3m2!1sen!2sus!4v1617919123456"
              className="w-full h-full border-0 rounded-2xl"
              loading="lazy"
              allowFullScreen
            />
          </motion.div>
        </div>
      </motion.div>

      {/* PERSISTENT CHATBOT */}
      <div className="fixed bottom-6 right-6 z-50">
        <Chatbot />
      </div>
    </div>
  );
}
