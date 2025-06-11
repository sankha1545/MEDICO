import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Prefill user name/email if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(f => ({ ...f, name: user.name, email: user.email }));
    }
  }, [isAuthenticated, user]);

  const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/appointments`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: localStorage.getItem('authToken')
        ? `Bearer ${localStorage.getItem('authToken')}`
        : '',
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/', { ...formData, doctorId });
      onClose();
      // redirect to payment page
      window.location.href = `/payment/${res.data.id}`;
    } catch (err) {
      console.error('Appointment save failed:', err);
      alert('Failed to save appointment');
    } finally {
      setSubmitting(false);
    }
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

        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          Schedule Your Visit
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                value={formData[field as keyof typeof formData]}
                onChange={handleChange}
                required
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

          <div className="relative">
            <textarea
              style={{ color: '#000' }}
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              className="peer w-full px-4 pt-6 pb-2 border border-transparent rounded-lg bg-white bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-transparent transition resize-none"
              placeholder="Your Message"
            />
            <label
              htmlFor="message"
              className="absolute top-2 left-4 text-gray-600 text-sm pointer-events-none transform transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-gray-600"
            >
              Your Message
              <span className="text-red-500">*</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-inner transition-all disabled:opacity-50"
          >
            {submitting ? 'Booking...' : 'Confirm'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default BookAppointment;
