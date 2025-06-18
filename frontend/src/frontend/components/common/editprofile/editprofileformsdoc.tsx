// File: frontend/src/components/common/editprofile/EditProfileForm.tsx

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { X as CloseIcon, Pencil } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export interface LocationType {
  lat: number;
  lng: number;
  address: string;
}

interface EditProfileFormProps {
  currentName: string;
  currentEmail: string;
  currentSpecialty: string;
  currentProfileImageUrl?: string;
  currentAvailabilitySlots?: string[]; // ISO strings truncated "YYYY-MM-DDTHH:mm"
  currentLocation?: LocationType;
  currentMaxPatients?: number;
  currentDob?: string; // "YYYY-MM-DD"
  currentExperience?: string;
  currentHospitalAffiliation?: string;
  currentBio?: string;
  currentQualifications?: string[];
  currentLanguages?: string[];
  currentConsultationFee?: number;
  onCancel: () => void;
  onSave: (
    name: string,
    email: string,
    specialty: string,
    profileImageFile: File | null,
    availabilitySlots: string[],
    location: LocationType,
    maxPatients: number,
    dob: string,
    experience?: string,
    hospitalAffiliation?: string,
    bio?: string,
    qualifications?: string[],
    languages?: string[],
    consultationFee?: number
  ) => Promise<void>;
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

// Helper: click-to-place-marker on map
const LocationPicker: React.FC<{
  position: { lat: number; lng: number } | null;
  onSelect: (pos: { lat: number; lng: number }) => void;
}> = ({ position, onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return position ? <Marker position={position} /> : null;
};

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  currentName,
  currentEmail,
  currentSpecialty,
  currentProfileImageUrl,
  currentAvailabilitySlots,
  currentLocation,
  currentMaxPatients,
  currentDob,
  currentExperience,
  currentHospitalAffiliation,
  currentBio,
  currentQualifications,
  currentLanguages,
  currentConsultationFee,
  onCancel,
  onSave,
}) => {
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [specialty, setSpecialty] = useState(currentSpecialty);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentProfileImageUrl);

  const [availabilitySlots, setAvailabilitySlots] = useState<string[]>(
    currentAvailabilitySlots && currentAvailabilitySlots.length > 0
      ? currentAvailabilitySlots.map(s => s.slice(0, 16))
      : ['']
  );
  const [location, setLocation] = useState<LocationType | null>(currentLocation || null);
  const [maxPatients, setMaxPatients] = useState<number>(currentMaxPatients || 1);
  const [dob, setDob] = useState<string>(currentDob || '');
  const [experience, setExperience] = useState<string>(currentExperience || '');
  const [hospitalAffiliation, setHospitalAffiliation] = useState<string>(currentHospitalAffiliation || '');
  const [bio, setBio] = useState<string>(currentBio || '');
  const [qualifications, setQualifications] = useState<string[]>(currentQualifications || []);
  const [languages, setLanguages] = useState<string[]>(currentLanguages || []);
  const [consultationFee, setConsultationFee] = useState<number>(currentConsultationFee ?? 0);

  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [geocoding, setGeocoding] = useState<boolean>(false);

  // Reverse-geocode using Nominatim
  const fetchAddress = async (lat: number, lng: number): Promise<string> => {
    try {
      setGeocoding(true);
      const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: { format: 'jsonv2', lat, lon: lng, addressdetails: 0 },
      });
      const data = res.data;
      return data?.display_name || `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
    } catch (err) {
      console.error('Reverse geocoding failed', err);
      return `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
    } finally {
      setGeocoding(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setProfileImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleMapSelect = async (pos: { lat: number; lng: number }) => {
    const address = await fetchAddress(pos.lat, pos.lng);
    setLocation({ lat: pos.lat, lng: pos.lng, address });
  };

  // Slot handling
  const handleSlotChange = (index: number, value: string) => {
    setAvailabilitySlots(prev => {
      const arr = [...prev];
      arr[index] = value;
      return arr;
    });
  };
  const handleAddSlot = () => {
    if (availabilitySlots.length < 5) {
      setAvailabilitySlots(prev => [...prev, '']);
    }
  };
  const handleRemoveSlot = (index: number) => {
    setAvailabilitySlots(prev =>
      prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev
    );
  };

  // Qualifications and languages: comma-separated to array
  const handleQualificationsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const arr = e.target.value.split(',').map(s => s.trim()).filter(s => s);
    setQualifications(arr);
  };
  const handleLanguagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const arr = e.target.value.split(',').map(s => s.trim()).filter(s => s);
    setLanguages(arr);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Required checks
    if (!name.trim() || !email.trim() || !specialty || !dob || !location) {
      setError('Fill required fields: name, email, specialty, DOB, location, and at least one slot.');
      return;
    }
    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setError('Invalid email address.');
      return;
    }
    // DOB past
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime()) || dobDate >= new Date()) {
      setError('Date of birth must be in the past.');
      return;
    }
    // Max patients
    if (maxPatients < 1) {
      setError('Max patients must be at least 1.');
      return;
    }
    // Slots: non-empty and future
    for (let i = 0; i < availabilitySlots.length; i++) {
      const slotStr = availabilitySlots[i];
      if (!slotStr) {
        setError(`Slot #${i + 1} is empty.`);
        return;
      }
      const slotDate = new Date(slotStr);
      if (isNaN(slotDate.getTime()) || slotDate <= new Date()) {
        setError(`Slot #${i + 1} must be a future date-time.`);
        return;
      }
    }
    // Consultation fee: should be >= 0
    if (consultationFee < 0) {
      setError('Consultation fee cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      await onSave(
        name.trim(),
        email.trim(),
        specialty,
        profileImageFile,
        availabilitySlots.map(s => s.slice(0, 16)),
        location as LocationType,
        maxPatients,
        dob,
        experience,
        hospitalAffiliation,
        bio,
        qualifications,
        languages,
        consultationFee
      );
      // Parent should close form on success
    } catch (err: any) {
      setError(err?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India center

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-2xl overflow-y-auto max-h-[90vh]"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-100 flex items-center space-x-2">
            <Pencil /> <span>Edit Profile & Availability</span>
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Close edit profile"
            disabled={saving}
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
          {/* Profile Image */}
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
                disabled={saving}
              />
            </label>
          </motion.div>

          {/* Name, Email, Specialty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="edit-name" className="block text-sm text-gray-400 mb-1">
                Full Name
              </label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                required
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="edit-email" className="block text-sm text-gray-400 mb-1">
                Email Address
              </label>
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                required
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="edit-specialty" className="block text-sm text-gray-400 mb-1">
                Specialty
              </label>
              <select
                id="edit-specialty"
                value={specialty}
              
                onChange={e => setSpecialty(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                required
                disabled={saving}
              >
                <option value="" disabled>
                  Select specialty...
                </option>
                {SPECIALTIES.map(spec => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dob-input" className="block text-sm text-gray-400 mb-1">
              Date of Birth
            </label>
            <input
              id="dob-input"
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              required
              disabled={saving}
            />
          </div>

          {/* Availability Slots */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Available Slots</label>
            <div className="space-y-3">
              {availabilitySlots.map((slot, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="datetime-local"
                    value={slot}
                    onChange={e => handleSlotChange(idx, e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                    required
                    disabled={saving}
                  />
                  {availabilitySlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(idx)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
                      disabled={saving}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2">
              <button
                type="button"
                onClick={handleAddSlot}
                className={`px-3 py-1 bg-green-600 text-white rounded hover:bg-green-500 transition-colors ${
                  availabilitySlots.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={saving || availabilitySlots.length >= 5}
              >
                Add Slot ({availabilitySlots.length}/5)
              </button>
            </div>
          </div>

          {/* Max Patients */}
          <div>
            <label htmlFor="max-patients" className="block text-sm text-gray-400 mb-1">
              Max Patients
            </label>
            <input
              id="max-patients"
              type="number"
              min={1}
              value={maxPatients}
              onChange={e => setMaxPatients(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              required
              disabled={saving}
            />
          </div>

          {/* Location (read-only) */}
          <div>
            <label htmlFor="location-input" className="block text-sm text-gray-400 mb-1">
              Location
            </label>
            <input
              id="location-input"
              type="text"
              value={location?.address || ''}
              readOnly
              placeholder={geocoding ? 'Resolving address...' : 'Click map below to select'}
              className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              required
              disabled
            />
          </div>

          {/* Map Picker */}
          <motion.div
            className="h-64 rounded-lg overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <MapContainer
              center={location ? [location.lat, location.lng] : DEFAULT_CENTER}
              zoom={location ? 13 : 5}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationPicker
                position={location ? { lat: location.lat, lng: location.lng } : null}
                onSelect={handleMapSelect}
              />
            </MapContainer>
          </motion.div>

          {/* Experience & Consultation Fee */}
          <div className="space-y-4">
            <div>
              <label htmlFor="experience-input" className="block text-sm text-gray-400 mb-1">
                Experience
              </label>
              <input
                id="experience-input"
                type="text"
                value={experience}
                onChange={e => setExperience(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="consultationFee-input" className="block text-sm text-gray-400 mb-1">
                Consultation Fee (INR)
              </label>
              <input
                id="consultationFee-input"
                type="number"
                min={0}
                value={consultationFee}
                onChange={e => setConsultationFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                disabled={saving}
              />
            </div>
            {/* Optional: hospital, bio, qualifications, languages */}
            <div>
              <label htmlFor="hospital-input" className="block text-sm text-gray-400 mb-1">
                Hospital Affiliation
              </label>
              <input
                id="hospital-input"
                type="text"
                value={hospitalAffiliation}
                onChange={e => setHospitalAffiliation(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="bio-input" className="block text-sm text-gray-400 mb-1">
                Bio
              </label>
              <textarea
                id="bio-input"
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                rows={3}
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="qualifications-input" className="block text-sm text-gray-400 mb-1">
                Qualifications (comma-separated)
              </label>
              <input
                id="qualifications-input"
                type="text"
                value={qualifications.join(', ')}
                onChange={handleQualificationsChange}
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="languages-input" className="block text-sm text-gray-400 mb-1">
                Languages (comma-separated)
              </label>
              <input
                id="languages-input"
                type="text"
                value={languages.join(', ')}
                onChange={handleLanguagesChange}
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                disabled={saving}
              />
            </div>
          </div>

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
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditProfileForm;
