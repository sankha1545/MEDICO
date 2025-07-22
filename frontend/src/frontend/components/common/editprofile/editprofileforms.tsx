// File: frontend/src/components/common/editprofile/EditProfileForm.tsx

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '../Button'

interface EditProfileFormProps {
  user: {
    name: string
    email: string
    phone: string
    dob: string
  }
  onClose: () => void
  onSave: (data: FormValues) => Promise<void> | void
}

type FormValues = {
  name: string
  email: string
  phone: string
  dob: string
}

const backdrop = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
}

const modal = {
  hidden: { y: '-100vh', opacity: 0 },
  visible: {
    y: '0',
    opacity: 1,
    transition: { delay: 0.2, type: 'spring', stiffness: 100 },
  },
}

export default function EditProfileForm({
  user,
  onClose,
  onSave,
}: EditProfileFormProps) {
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
  })

  useEffect(() => {
    reset({
      name: user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
    })
  }, [user, reset])

  const submitHandler = async (data: FormValues) => {
    await onSave(data)
    // Parent closes modal after save resolves
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60"
      variants={backdrop}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className="relative w-full max-w-md p-6 shadow-2xl bg-white/90 backdrop-blur-lg rounded-2xl sm:max-w-lg md:max-w-xl lg:max-w-2xl sm:p-8 md:p-10"
        variants={modal}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute text-gray-600 transition top-4 right-4 hover:text-gray-900"
        >
          <X size={24} />
        </button>
        <h2 className="mb-6 text-xl font-bold text-center text-gray-800 sm:text-2xl md:text-3xl">
          Edit Your Profile
        </h2>

        <form
          onSubmit={handleSubmit(submitHandler)}
          className="space-y-6 sm:space-y-8"
        >
          {/* Full Name */}
          <div className="relative">
            <input
              type="text"
              {...register('name', { required: 'Full name is required.' })}
              className="w-full py-2 text-base bg-transparent border-b-2 border-gray-300 outline-none peer focus:border-indigo-500 sm:py-3 sm:text-lg"
              placeholder=" "
            />
            <label className="absolute left-0 -top-3.5 text-gray-500 text-sm sm:text-base
                               peer-placeholder-shown:top-2 peer-placeholder-shown:text-base
                               peer-placeholder-shown:text-gray-400
                               peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm
                               transition-all">
              Full Name
            </label>
            {errors.name && (
              <p className="mt-1 text-xs text-red-500 sm:text-sm">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="relative">
            <input
              type="email"
              {...register('email', {
                required: 'Email is required.',
                pattern: {
                  value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                  message: 'Invalid email address.',
                },
              })}
              className="w-full py-2 text-base bg-transparent border-b-2 border-gray-300 outline-none peer focus:border-indigo-500 sm:py-3 sm:text-lg"
              placeholder=" "
            />
            <label className="absolute left-0 -top-3.5 text-gray-500 text-sm sm:text-base
                               peer-placeholder-shown:top-2 peer-placeholder-shown:text-base
                               peer-placeholder-shown:text-gray-400
                               peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm
                               transition-all">
              Email Address
            </label>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500 sm:text-sm">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="relative">
            <input
              type="tel"
              {...register('phone', {
                required: 'Phone number is required.',
                pattern: {
                  value: /^\+?\d{10,15}$/,
                  message: 'Invalid phone number.',
                },
              })}
              className="w-full py-2 text-base bg-transparent border-b-2 border-gray-300 outline-none peer focus:border-indigo-500 sm:py-3 sm:text-lg"
              placeholder=" "
            />
            <label className="absolute left-0 -top-3.5 text-gray-500 text-sm sm:text-base
                               peer-placeholder-shown:top-2 peer-placeholder-shown:text-base
                               peer-placeholder-shown:text-gray-400
                               peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm
                               transition-all">
              Phone Number
            </label>
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500 sm:text-sm">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="relative">
            <input
              type="date"
              {...register('dob', { required: 'Date of birth is required.' })}
              className="w-full py-2 text-base bg-transparent border-b-2 border-gray-300 outline-none peer focus:border-indigo-500 sm:py-3 sm:text-lg"
              placeholder=" "
            />
            <label className="absolute left-0 -top-3.5 text-gray-500 text-sm sm:text-base
                               peer-placeholder-shown:top-2 peer-placeholder-shown:text-base
                               peer-placeholder-shown:text-gray-400
                               peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm
                               transition-all">
              Date of Birth
            </label>
            {errors.dob && (
              <p className="mt-1 text-xs text-red-500 sm:text-sm">
                {errors.dob.message}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col justify-center gap-4 mt-8 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-1/3"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-1/3"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
