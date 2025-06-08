// File: frontend/src/components/common/medicalinfo/UpdateMedicalInfoForm.tsx

import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Button } from '../Button';
import {
  Droplet,
  AlertTriangle,
  Pill,
  Heart,
} from 'lucide-react';

export interface MedicalInfo {
  bloodType: string;
  allergies: string;
  currentMedications: string;
  medicalConditions: string;
}

interface UpdateMedicalInfoFormProps {
  medicalInfo: MedicalInfo;
  onClose: () => void;
  onSave: (info: MedicalInfo) => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const UpdateMedicalInfoForm: React.FC<UpdateMedicalInfoFormProps> = ({
  medicalInfo,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<MedicalInfo>(medicalInfo);
  const [isSaving, setIsSaving] = useState(false);

  // READ VITE_API_URL from environment. It MUST be set to "http://localhost:4000/api"
  const baseURL = import.meta.env.VITE_API_URL as string;

  const handleChange =
    (field: keyof MedicalInfo) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Not authenticated (no token found).');
        setIsSaving(false);
        return;
      }

      // Notice we now send to `${baseURL}/medical` (which resolves to http://localhost:4000/api/medical)
      const resp = await axios.put<{ medicalInfo: MedicalInfo }>(
        `${baseURL}/medical`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onSave(resp.data.medicalInfo);
      onClose();
    } catch (err: any) {
      // If the backend logs something, it will appear in your Node/Express console
      console.error('Failed to save medical info:', err.response || err);
      alert(
        err.response?.data?.message ||
          'Failed to save. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000]"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <motion.div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <motion.span
                className="mr-2"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                🩺
              </motion.span>
              Update Medical Info
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-3 right-4 text-white hover:text-gray-200"
            >
              <motion.span
                whileHover={{ scale: 1.2, rotate: 90 }}
                transition={{ duration: 0.2 }}
                className="text-xl"
              >
                ✕
              </motion.span>
            </button>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            className="px-8 py-6 bg-white space-y-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
            }}
          >
            <motion.div variants={fieldVariants}>
              <label className="flex items-center text-sm font-medium text-gray-700 focus-within:text-indigo-600">
                <Droplet className="mr-2 text-indigo-500" size={18} /> Blood Type
              </label>
              <select
                value={form.bloodType}
                onChange={handleChange('bloodType')}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
              >
                <option value="" disabled>
                  Select blood type
                </option>
                {BLOOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label className="flex items-center text-sm font-medium text-gray-700 focus-within:text-indigo-600">
                <AlertTriangle className="mr-2 text-red-500" size={18} /> Allergies
              </label>
              <input
                type="text"
                value={form.allergies}
                onChange={handleChange('allergies')}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
                placeholder="e.g. Peanuts, Pollen"
              />
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label className="flex items-center text-sm font-medium text-gray-700 focus-within:text-indigo-600">
                <Pill className="mr-2 text-green-500" size={18} /> Current Medications
              </label>
              <input
                type="text"
                value={form.currentMedications}
                onChange={handleChange('currentMedications')}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
                placeholder="e.g. Metformin, Lisinopril"
              />
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label className="flex items-center text-sm font-medium text-gray-700 focus-within:text-indigo-600">
                <Heart className="mr-2 text-pink-500" size={18} /> Medical Conditions
              </label>
              <input
                type="text"
                value={form.medicalConditions}
                onChange={handleChange('medicalConditions')}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
                placeholder="e.g. Diabetes, Hypertension"
              />
            </motion.div>

            <motion.div
              className="flex justify-end space-x-4 pt-4 border-t border-gray-200"
              variants={fieldVariants}
            >
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                <Button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-lg hover:shadow-indigo-500/40 transition-all duration-200"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              </motion.div>
            </motion.div>
          </motion.form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdateMedicalInfoForm;
