// File: frontend/src/components/doctor/EditProfileForm.tsx

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { X as CloseIcon, Pencil } from 'lucide-react';
import { Button } from '../../../components/common/Button';

interface EditProfileFormProps {
  currentName: string;
  currentEmail: string;
  currentSpecialty: string;
  currentProfileImageUrl?: string; // existing profile image URL (if any)
  onCancel: () => void;
  onSave: (
    name: string,
    email: string,
    specialty: string,
    profileImageFile: File | null
  ) => void;
}

const SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Oncology',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Urology',
  'Orthopedics',
  'Gastroenterology',
];

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  currentName,
  currentEmail,
  currentSpecialty,
  currentProfileImageUrl,
  onCancel,
  onSave,
}) => {
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [specialty, setSpecialty] = useState(currentSpecialty);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentProfileImageUrl);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !specialty.trim()) {
      setError('All fields are required.');
      return;
    }

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    onSave(name.trim(), email.trim(), specialty.trim(), profileImageFile);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-100 flex items-center space-x-2">
            <Pencil /> <span>Edit Profile</span>
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Close edit profile"
          >
            <CloseIcon size={24} />
          </button>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-600 text-red-100 p-3 rounded-md mb-4 text-center"
          >
            {error}
          </motion.p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image Preview & Upload */}
          <motion.div
            className="flex flex-col items-center space-y-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-24 h-24 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Profile Preview" className="w-full h-full object-cover" />
              ) : (
                <Pencil className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <label className="inline-flex px-4 py-2 bg-primary-500 text-white rounded-lg cursor-pointer hover:bg-primary-600 transition-colors">
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </motion.div>

          {/* Name Field */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label htmlFor="edit-name" className="block text-sm text-gray-400 mb-1">
              Full Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            />
          </motion.div>

          {/* Email Field */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label htmlFor="edit-email" className="block text-sm text-gray-400 mb-1">
              Email Address
            </label>
            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            />
          </motion.div>

          {/* Specialty Select */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label htmlFor="edit-specialty" className="block text-sm text-gray-400 mb-1">
              Specialty
            </label>
            <select
              id="edit-specialty"
              value={specialty}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSpecialty(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              <option value="" disabled>
                Select specialty...
              </option>
              {SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex justify-end space-x-3 mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-gray-500 text-gray-300 hover:border-gray-400 hover:text-gray-100"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditProfileForm;
