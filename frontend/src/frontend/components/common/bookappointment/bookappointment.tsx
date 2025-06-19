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
  // onSuccess is no longer used here for appointmentId, since creation happens after payment
  onSuccess?: (appointmentId: string) => void;
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

const BookAppointment: React.FC<BookAppointmentProps> = ({
  doctorId,
  onClose,
  onSuccess,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    selectedSlot: '',
  });
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [consultationFee, setConsultationFee] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build API base
  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api') ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;

  // Pre-fill user info if available
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
        phone: (user as any).phone || '',
      }));
    }
  }, [isAuthenticated, user]);

  // Fetch doctor slots & fee
  useEffect(() => {
    let mounted = true;
    setLoadingSlots(true);
    setSlotsError(null);

    const token = localStorage.getItem('authToken');
    axios
      .get(buildUrl(`/medical/doctors/${doctorId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then(({ data }) => {
        if (!mounted) return;
        const now = new Date();
        // availabilitySlots assumed array of ISO strings
        const upcoming = Array.isArray(data.availabilitySlots)
          ? data.availabilitySlots
              .map((s: string) => new Date(s))
              .filter((dt: Date) => dt > now)
              .sort((a, b) => a.getTime() - b.getTime())
              .map((dt) => dt.toISOString())
          : [];
        setSlots(upcoming);
        if (upcoming.length) {
          setFormData((prev) => ({ ...prev, selectedSlot: upcoming[0] }));
        }
        const fee = typeof data.consultationFee === 'number' ? data.consultationFee : null;
        setConsultationFee(fee);
      })
      .catch((e) => {
        console.error('Error fetching doctor details:', e);
        if (mounted) {
          setSlotsError('Failed to load available slots or fee.');
          setSlots([]);
          setConsultationFee(null);
        }
      })
      .finally(() => {
        if (mounted) setLoadingSlots(false);
      });

    return () => {
      mounted = false;
    };
  }, [doctorId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate slot selection
    if (!formData.selectedSlot) {
      setError('Please select an available slot.');
      return;
    }
    if (new Date(formData.selectedSlot) <= new Date()) {
      setError('Selected slot is no longer valid.');
      return;
    }
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (consultationFee == null) {
      setError('Consultation fee not available.');
      return;
    }
    if (!isAuthenticated) {
      setError('Authentication required. Please log in.');
      return;
    }

    setSubmitting(true);
    try {
      // Instead of posting appointment now, navigate to payment page
      // Optionally fetch doctorName to pass along:
      let doctorName = '';
      try {
        const token = localStorage.getItem('authToken');
        const resDoc = await axios.get(buildUrl(`/medical/doctors/${doctorId}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        doctorName = resDoc.data.name || '';
      } catch {
        // ignore, PaymentPage will fetch again if needed
      }

      navigate('/payment', {
        state: {
          doctorId,
          datetime: formData.selectedSlot,
          doctorName,
          message: formData.message || '',
        },
      });
      onClose();
    } catch (navErr) {
      console.error('Navigation error:', navErr);
      setError('Failed to proceed to payment.');
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
        className="relative w-full max-w-lg p-8 bg-white bg-opacity-90 rounded-2xl"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
          onClick={onClose}
          disabled={submitting}
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-extrabold text-center mb-4">
          Schedule Your Visit
        </h2>

        {loadingSlots ? (
          <p className="text-center text-gray-600">Loading slots...</p>
        ) : slotsError ? (
          <p className="text-red-500 text-center">{slotsError}</p>
        ) : slots.length === 0 ? (
          <p className="text-center text-gray-600">No slots available.</p>
        ) : null}

        <form onSubmit={handleConfirm} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Your Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none"
              style={{ color: '#000' }}
              required
              disabled={submitting}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Email<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none"
              style={{ color: '#000' }}
              required
              disabled={submitting}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none"
              style={{ color: '#000' }}
              disabled={submitting}
            />
          </div>

          {/* Slot selector */}
          {slots.length > 0 && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Select Slot<span className="text-red-500">*</span>
              </label>
              <select
                name="selectedSlot"
                value={formData.selectedSlot}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none"
                style={{ color: '#000' }}
                required
                disabled={submitting}
              >
                {slots.map((s) => (
                  <option key={s} value={s}>
                    {new Date(s).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Additional Message
            </label>
            <textarea
              name="message"
              rows={3}
              value={formData.message}
              onChange={handleChange}
              placeholder="Optional message"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none resize-none"
              style={{ color: '#000' }}
              disabled={submitting}
            />
          </div>

          {/* Fee display */}
          {consultationFee != null && (
            <p className="text-gray-700">
              Consultation Fee:{' '}
              <span className="font-medium">₹{consultationFee}</span>
            </p>
          )}

          {error && <p className="text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting || slots.length === 0}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-inner transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Scheduling...' : 'Confirm & Pay'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default BookAppointment;
