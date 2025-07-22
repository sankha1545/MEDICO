// File: frontend/src/components/common/medicalinfo/UpdateMedicalInfoForm.tsx

import React, { useState, FormEvent, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../../../contexts/AuthContext'
import { Button } from '../Button'
import { Droplet, AlertTriangle, Pill, Heart } from 'lucide-react'

export interface MedicalInfo {
  bloodType: string
  allergies: string
  currentMedications: string
  medicalConditions: string
}

interface UpdateMedicalInfoFormProps {
  medicalInfo: MedicalInfo
  onClose: () => void
  onSave: (info: MedicalInfo) => void
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 250, damping: 20 },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
}

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

const UpdateMedicalInfoForm: React.FC<UpdateMedicalInfoFormProps> = ({
  medicalInfo,
  onClose,
  onSave,
}) => {
  const { updateMedicalInfo } = useAuth()
  const [formState, setFormState] = useState<MedicalInfo>({ ...medicalInfo })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setFormState({ ...medicalInfo })
  }, [medicalInfo])

  const handleChange =
    (field: keyof MedicalInfo) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormState((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)
    try {
      const updated = await updateMedicalInfo(formState)
      onSave(updated)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Unable to save.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <motion.div
          className="w-full max-w-md overflow-hidden bg-white shadow-xl sm:max-w-lg md:max-w-xl rounded-3xl"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div className="relative px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
            <h3 className="flex items-center text-xl font-semibold text-white sm:text-2xl">
              <span className="mr-2 text-2xl animate-pulse">🩺</span>
              Update Medical Info
            </h3>
            <button
              className="absolute text-xl text-white top-3 right-4"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="p-6 space-y-6 sm:p-8 sm:space-y-8"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
            }}
          >
            {error && (
              <div className="text-sm text-center text-red-600">{error}</div>
            )}

            {/* Blood Type */}
            <motion.div variants={fieldVariants}>
              <label className="flex items-center text-sm font-medium text-gray-700 sm:text-base">
                <Droplet className="mr-2 text-indigo-500" size={18} />
                Blood Type
              </label>
              <select
                value={formState.bloodType}
                onChange={handleChange('bloodType')}
                className="w-full px-3 py-2 mt-1 text-sm border rounded-lg sm:py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:text-base"
                required
              >
                <option value="" disabled>
                  Select type
                </option>
                {BLOOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Allergies */}
            <motion.div variants={fieldVariants}>
              <label className="flex items-center text-sm font-medium text-gray-700 sm:text-base">
                <AlertTriangle className="mr-2 text-red-500" size={18} />
                Allergies
              </label>
              <input
                type="text"
                value={formState.allergies}
                onChange={handleChange('allergies')}
                placeholder="e.g. Peanuts"
                className="w-full px-3 py-2 mt-1 text-sm border rounded-lg sm:py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:text-base"
                required
              />
            </motion.div>

            {/* Current Medications */}
            <motion.div variants={fieldVariants}>
              <label className="flex items-center text-sm font-medium text-gray-700 sm:text-base">
                <Pill className="mr-2 text-green-500" size={18} />
                Current Medications
              </label>
              <input
                type="text"
                value={formState.currentMedications}
                onChange={handleChange('currentMedications')}
                placeholder="e.g. Metformin"
                className="w-full px-3 py-2 mt-1 text-sm border rounded-lg sm:py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:text-base"
              />
            </motion.div>

            {/* Medical Conditions */}
            <motion.div variants={fieldVariants}>
              <label className="flex items-center text-sm font-medium text-gray-700 sm:text-base">
                <Heart className="mr-2 text-pink-500" size={18} />
                Medical Conditions
              </label>
              <input
                type="text"
                value={formState.medicalConditions}
                onChange={handleChange('medicalConditions')}
                placeholder="e.g. Hypertension"
                className="w-full px-3 py-2 mt-1 text-sm border rounded-lg sm:py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:text-base"
              />
            </motion.div>

            {/* Actions */}
            <motion.div
              className="flex flex-col justify-end gap-4 pt-4 border-t sm:flex-row"
              variants={fieldVariants}
            >
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </motion.div>
          </motion.form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default UpdateMedicalInfoForm
