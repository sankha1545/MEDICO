// File: frontend/src/components/common/editprofile/EditProfileForm.tsx

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../Button';

interface EditProfileFormProps {
  user: {
    name: string;
    email: string;
    phone: string;
    dob: string;
  };
  onClose: () => void;
  onSave: (data: FormValues) => Promise<void> | void;
}

type FormValues = {
  name: string;
  email: string;
  phone: string;
  dob: string;
};

const backdrop = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

const modal = {
  hidden: { y: '-100vh', opacity: 0 },
  visible: {
    y: '0',
    opacity: 1,
    transition: { delay: 0.2, type: 'spring', stiffness: 100 },
  },
};

export default function EditProfileForm({ user, onClose, onSave }: EditProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
    },
  });

  // Reset the form any time `user` prop changes
  useEffect(() => {
    reset({
      name: user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
    });
  }, [user, reset]);

  const submitHandler = async (data: FormValues) => {
    await onSave(data);
    // Parent (DashboardPage) will close this modal once onSave resolves
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      variants={backdrop}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className="bg-white/90 backdrop-blur-lg rounded-2xl w-full max-w-lg p-8 relative shadow-2xl"
        variants={modal}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Edit Your Profile</h2>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4" style={{color:"#000"}}>
          {/* Full Name */}
          <div className="relative">
            <input
              type="text"
              {...register('name', { required: 'Full name is required.' })}
              className="peer w-full border-b-2 border-gray-300 focus:border-indigo-500 outline-none py-2 bg-transparent"
              placeholder=" "
            />
            <label className="absolute left-0 -top-3.5 text-gray-500 text-sm 
                             peer-placeholder-shown:top-2 peer-placeholder-shown:text-base 
                             peer-placeholder-shown:text-gray-400 
                             peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm 
                             transition-all">
              Full Name
            </label>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email Address */}
          <div className="relative">
            <input
              type="email"
              {...register('email', {
                required: 'Email is required.',
                pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Invalid email address.' },
              })}
              className="peer w-full border-b-2 border-gray-300 focus:border-indigo-500 outline-none py-2 bg-transparent"
              placeholder=" "
            />
            <label className="absolute left-0 -top-3.5 text-gray-500 text-sm 
                             peer-placeholder-shown:top-2 peer-placeholder-shown:text-base 
                             peer-placeholder-shown:text-gray-400 
                             peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm 
                             transition-all">
              Email Address
            </label>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Phone Number */}
          <div className="relative">
            <input
              type="tel"
              {...register('phone', {
                required: 'Phone number is required.',
                pattern: { value: /^\+?\d{10,15}$/, message: 'Invalid phone number.' },
              })}
              className="peer w-full border-b-2 border-gray-300 focus:border-indigo-500 outline-none py-2 bg-transparent"
              placeholder=" "
            />
            <label className="absolute left-0 -top-3.5 text-gray-500 text-sm 
                             peer-placeholder-shown:top-2 peer-placeholder-shown:text-base 
                             peer-placeholder-shown:text-gray-400 
                             peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm 
                             transition-all">
              Phone Number
            </label>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          {/* Date of Birth */}
          <div className="relative">
            <input
              type="date"
              {...register('dob', { required: 'Date of birth is required.' })}
              className="peer w-full border-b-2 border-gray-300 focus:border-indigo-500 outline-none py-2 bg-transparent"
              placeholder=" "
            />
            <label className="absolute left-0 -top-3.5 text-gray-500 text-sm 
                             peer-placeholder-shown:top-2 peer-placeholder-shown:text-base 
                             peer-placeholder-shown:text-gray-400 
                             peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm 
                             transition-all">
              Date of Birth
            </label>
            {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-center space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-1/3"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {/* Only disabled while submitting */}
            <Button type="submit" disabled={isSubmitting} className="w-1/3">
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
