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
    opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

const BookAppointment: React.FC<BookAppointmentProps> = ({ doctorId, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', message: '', selectedSlot: ''
  });
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  let API_BASE = import.meta.env.VITE_API_URL || '';
  API_BASE = API_BASE.replace(/\/$/, '');
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api') ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(f => ({ ...f, name: user.name, email: user.email, phone: user.phone || '' }));
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    let isMounted = true;
    setLoadingSlots(true);
    setSlotsError(null);
    axios.get(buildUrl(`/medical/doctors/${doctorId}`))
      .then(res => {
        if (!isMounted) return;
        const d = res.data;
        const now = new Date();
        let upcoming = Array.isArray(d.availabilitySlots)
          ? d.availabilitySlots
              .map((s: string) => {
                const dt = new Date(s);
                return dt > now ? dt.toISOString() : null;
              })
              .filter((s: string | null): s is string => !!s)
              .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
          : [];
        if (Array.isArray(d.nextSlots) && d.nextSlots.length > 0) {
          const filtered = d.nextSlots
            .map((s: string) => {
              const dt = new Date(s);
              return dt > now ? dt.toISOString() : null;
            })
            .filter((s): s is string => !!s)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
          if (filtered.length > 0) upcoming = filtered;
        }
        setSlots(upcoming);
        if (upcoming.length > 0) {
          setFormData(f => ({ ...f, selectedSlot: upcoming[0] }));
        }
      })
      .catch(err => {
        console.error('Error fetching slots:', err);
        if (isMounted) {
          setSlotsError('Failed to load available slots.');
          setSlots([]);
        }
      })
      .finally(() => { if (isMounted) setLoadingSlots(false); });

    return () => { isMounted = false; };
  }, [doctorId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.selectedSlot) {
      setError('Please select an available slot.');
      return;
    }
    const dt = new Date(formData.selectedSlot);
    if (dt <= new Date()) {
      setError('Selected slot is no longer valid.');
      return;
    }
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required.');
      return;
    }

    setSubmitting(true);
    try {
      navigate('/payment', {
        state: {
          doctorId,
          slot: formData.selectedSlot,
          message: formData.message,
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
      variants={overlayVariants} initial="hidden" animate="visible" exit="hidden"
    >
      <motion.div
        className="relative w-full max-w-lg p-8 bg-white bg-opacity-90 rounded-2xl"
        variants={modalVariants} initial="hidden" animate="visible" exit="exit"
      >
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
          onClick={onClose} disabled={submitting}
        >
          <X size={24}/>
        </button>

        <h2 className="text-3xl font-extrabold text-gray-800 mb-4 text-center">
          Schedule Your Visit
        </h2>

        {loadingSlots ? (
          <p className="text-gray-600 text-center">Loading available slots...</p>
        ) : slotsError ? (
          <p className="text-red-500 text-center">{slotsError}</p>
        ) : slots.length === 0 ? (
          <p className="text-gray-600 text-center mb-4">No slots available for this doctor.</p>
        ) : null}

        <form onSubmit={handleConfirm} className="space-y-4">
          {['name','email','phone'].map(field => (
            <div key={field} className="relative">
              <input
                style={{ color:'#000' }}
                type={field==='email'?'email':field==='phone'?'tel':'text'}
                name={field}
                value={formData[field as keyof typeof formData] || ''}
                onChange={handleChange}
                required={field!=='phone'}
                disabled={field!=='phone'}
                className="peer w-full px-4 pt-6 pb-2 border border-transparent rounded-lg bg-white bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-transparent transition"
                placeholder={field.charAt(0).toUpperCase()+field.slice(1)}
              />
              <label
                htmlFor={field}
                className="absolute top-2 left-4 text-gray-600 text-sm pointer-events-none transform transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-gray-600"
              >
                {field.charAt(0).toUpperCase()+field.slice(1)}
                {field!=='phone' && <span className="text-red-500">*</span>}
              </label>
            </div>
          ))}

          {!loadingSlots && slots.length>0 && (
            <div className="relative">
              <label htmlFor="selectedSlot" className="block text-gray-600 mb-1">
                Select Available Slot<span className="text-red-500">*</span>
              </label>
              <select
                id="selectedSlot"
                name="selectedSlot"
                value={formData.selectedSlot}
                 style={{color:"#000"}}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                required disabled={submitting}
              >
                {slots.map((s, i)=><option key={i} value={s}>{new Date(s).toLocaleString()}</option>)}
              </select>
            </div>
          )}

          <div className="relative">
            <textarea
              style={{ color:'#000' }}
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={3}
              className="peer w-full px-4 pt-6 pb-2 border border-transparent rounded-lg bg-white bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-transparent transition resize-none"
              placeholder="Message"
              disabled={submitting}
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
            className={`w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-inner transition-all ${
              submitting||slots.length===0?'opacity-50 cursor-not-allowed':''}`}
            disabled={submitting||slots.length===0}
          >
            {submitting ? 'Processing...' : 'Confirm Booking'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default BookAppointment;
