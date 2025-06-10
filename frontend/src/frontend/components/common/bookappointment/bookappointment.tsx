import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

const BookAppointment: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const token = localStorage.getItem('authToken');
  const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/appointments`,
    headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({ ...prev, name: user.name, email: user.email }));
    }
  }, [isAuthenticated, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/', formData);
      setIsOpen(false);
      navigate(`/payment/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to save appointment');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-8 py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-full shadow-2xl hover:shadow-inner transition-all"
        onClick={() => setIsOpen(true)}
      >
        Book Appointment
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center backdrop-blur-lg bg-black bg-opacity-30 z-50"
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className="relative w-full max-w-lg p-8 bg-white bg-opacity-80 backdrop-filter backdrop-blur-md rounded-2xl shadow-2xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                onClick={() => setIsOpen(false)}
              >
                <X size={24} />
              </button>
              <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
                Schedule Your Visit
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {['name', 'email', 'phone'].map(field => (
                  <div key={field} className="relative">
                    <input
                    style={{color:"#000"}}
                      type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                      name={field}
                      value={formData[field as keyof typeof formData]}
                      onChange={handleChange}
                      required
                      className="w-full px-4 pt-6 pb-2 border border-transparent rounded-lg bg-white bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-transparent transition"
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    />
                    <label
                      htmlFor={field}
                      className="absolute top-2 left-4 text-gray-600 text-sm pointer-events-none transform transition-all duration-200
                        peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-gray-600"
                    >
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>
                ))}
                <div className="relative">
                  <textarea
                   style={{color:"#000"}}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 pt-6 pb-2 border border-transparent rounded-lg bg-white bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-transparent transition resize-none"
                    placeholder="Your Message"
                  />
                  <label
                    htmlFor="message"
                    className="absolute top-2 left-4 text-gray-600 text-sm pointer-events-none transform transition-all duration-200
                      peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-gray-600"
                  >
                    Your Message
                    <span className="text-red-500">*</span>
                  </label>
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-inner transition-all"
                >
                  Proceed to Payment
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookAppointment;