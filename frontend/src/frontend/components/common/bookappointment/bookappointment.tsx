// File: frontend/src/components/common/bookappointment/BookAppointment.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SlotInfo {
  slot: string;        // ISO string of the appointment datetime
  remaining: number;   // number of seats left in this slot
}

interface BookAppointmentProps {
  doctorId: string;
  onClose: () => void;
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
  const [rawSlots, setRawSlots] = useState<SlotInfo[]>([]);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [consultationFee, setConsultationFee] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api') ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;

  // Pre-fill user info if logged in
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

  // Fetch raw slots, filter available slots, and fetch fee
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoadingSlots(true);
      setSlotsError(null);
      setRawSlots([]);
      setSlots([]);

      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      try {
        const { data: slotData } = await axios.get<SlotInfo[]>(
          buildUrl(`/appointments/slots/${doctorId}`),
          { headers }
        );
        console.log('Fetched raw slots:', slotData);
        if (!mounted) return;

        setRawSlots(slotData);

        const available = slotData.filter((s) => s.remaining > 0);
        console.log('Filtered available slots:', available);
        setSlots(available);

        setFormData((prev) => ({
          ...prev,
          selectedSlot: available[0]?.slot || '',
        }));
      } catch (err) {
        console.error('Error fetching slots:', err);
        if (mounted) setSlotsError('Failed to load slots.');
      } finally {
        if (mounted) setLoadingSlots(false);
      }

      try {
        const { data: docData } = await axios.get(
          buildUrl(`/medical/doctors/${doctorId}`),
          { headers }
        );
        if (!mounted) return;
        setConsultationFee(
          typeof docData.consultationFee === 'number'
            ? docData.consultationFee
            : null
        );
      } catch (err) {
        console.error('Error fetching fee:', err);
        if (mounted) setConsultationFee(null);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [doctorId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.selectedSlot) {
      setError('No slots available.');
      return;
    }

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (!isAuthenticated) {
      setError('Please log in.');
      return;
    }

    setSubmitting(true);
    try {
      navigate('/payment', {
        state: {
          doctorId,
          datetime: formData.selectedSlot,
          message: formData.message,
        },
      });
      onClose();
    } catch (navErr) {
      console.error('Navigation error:', navErr);
      setError('Failed to proceed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-lg"
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
          onClick={onClose}
          disabled={submitting}
          className="absolute text-gray-600 top-4 right-4 hover:text-gray-800"
        >
          <X size={24} />
        </button>

        <h2 className="mb-4 text-3xl font-extrabold text-center text-black">
          Schedule Your Visit
        </h2>

        {/* Debug info */}
        <p className="mb-2 text-sm text-gray-500">
          Slots Available: {slots.length}.
        </p>

        {loadingSlots ? (
          <p className="text-center text-gray-600">Loading slots...</p>
        ) : slotsError ? (
          <p className="text-center text-red-500">{slotsError}</p>
        ) : slots.length === 0 ? (
          <p className="text-center text-gray-600">No slots available.</p>
        ) : null}

        <form onSubmit={handleConfirm} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block mb-1 text-sm text-gray-700">
              Your Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={submitting}
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 text-sm text-gray-700">
              Email<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={submitting}
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block mb-1 text-sm text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={submitting}
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none"
            />
          </div>

          {/* Slot selector */}
          {slots.length > 0 && (
            <div>
              <label className="block mb-1 text-sm text-gray-700">
                Select Slot<span className="text-red-500">*</span>
              </label>
              <select
                name="selectedSlot"
                value={formData.selectedSlot}
                onChange={handleChange}
                disabled={submitting}
                className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none"
              >
                {slots.map(({ slot }) => (
                  <option key={slot} value={slot}>
                    {new Date(slot).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block mb-1 text-sm text-gray-700">
              Additional Message
            </label>
            <textarea
              name="message"
              rows={3}
              value={formData.message}
              onChange={handleChange}
              disabled={submitting}
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none"
            />
          </div>

          {/* Fee */}
          {consultationFee != null && (
            <p className="text-gray-700">
              Consultation Fee: <span className="font-medium">₹{consultationFee}</span>
            </p>
          )}

          {error && <p className="text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting || slots.length === 0}
            className="w-full py-3 font-bold text-white rounded-full bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-50"
          >
            {submitting ? 'Scheduling...' : 'Confirm & Pay'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default BookAppointment;
