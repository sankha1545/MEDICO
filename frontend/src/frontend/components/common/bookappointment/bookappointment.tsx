// File: frontend/src/components/common/bookappointment/BookAppointment.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BookAppointmentProps {
  doctorId: string;
  onClose: () => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

const BookAppointment: React.FC<BookAppointmentProps> = ({ doctorId, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    datetime: '', // ISO-like string from input type="datetime-local"
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill user name/email if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(f => ({
        ...f,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      }));
    }
  }, [isAuthenticated, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate datetime
    if (!formData.datetime) {
      setError('Please select date and time');
      return;
    }
    const apptDate = new Date(formData.datetime);
    if (isNaN(apptDate.getTime()) || apptDate <= new Date()) {
      setError('Please choose a future date and time');
      return;
    }
    // Navigate to PaymentsPage, passing state
    navigate('/payment', {
      state: {
        doctorId,
        datetime: formData.datetime,
        message: formData.message,
      },
    });
    // Close modal
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center backdrop-blur-lg bg-black bg-opacity-30 z-50"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className="relative w-full max-w-lg p-8 bg-white bg-opacity-90 rounded-2xl shadow-2xl"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-extrabold text-gray-800 mb-4 text-center">
          Schedule Your Visit
        </h2>

        <form onSubmit={handleConfirm} className="space-y-4">
          {/* Name, Email, Phone disabled inputs if prefilled */}
          {['name', 'email', 'phone'].map(field => (
            <div key={field} className="relative">
              <input
                style={{ color: '#000' }}
                type={
                  field === 'email'
                    ? 'email'
                    : field === 'phone'
                    ? 'tel'
                    : 'text'
                }
                name={field}
                value={formData[field as keyof typeof formData] || ''}
                onChange={handleChange}
                required
                disabled={field !== 'phone'} // allow editing phone if needed
                className="peer w-full px-4 pt-6 pb-2 border border-transparent rounded-lg bg-white bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-transparent transition"
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              />
              <label
                htmlFor={field}
                className="absolute top-2 left-4 text-gray-600 text-sm pointer-events-none transform transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-gray-600"
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
                <span className="text-red-500">*</span>
              </label>
            </div>
          ))}

          {/* DateTime input */}
          <div className="relative">
            <label className="block text-gray-600 mb-1">Choose Date & Time<span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              name="datetime"
              value={formData.datetime}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
            />
          </div>

          {/* Message/Textarea */}
          <div className="relative">
            <textarea
              style={{ color: '#000' }}
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={3}
              className="peer w-full px-4 pt-6 pb-2 border border-transparent rounded-lg bg-white bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-transparent transition resize-none"
              placeholder="Message"
            />
            <label
              htmlFor="message"
              className="absolute top-2 left-4 text-gray-600 text-sm pointer-events-none transform transition-all duration-200 peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-gray-600"
            >
              Your Message
            </label>
          </div>

          {error && <p className="text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-inner transition-all"
          >
            Confirm Booking
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default BookAppointment;
