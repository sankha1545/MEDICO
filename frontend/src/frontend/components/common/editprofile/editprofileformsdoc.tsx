// File: frontend/src/components/doctor/EditProfileForm.tsx

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { X as CloseIcon, Pencil } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ES imports for Leaflet’s built‑in marker images:
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl       from 'leaflet/dist/images/marker-icon.png';
import shadowUrl     from 'leaflet/dist/images/marker-shadow.png';

// ─── Fix Leaflet’s default icon paths ─────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface EditProfileFormProps {
  currentName: string;
  currentEmail: string;
  currentSpecialty: string;
  currentProfileImageUrl?: string;
  currentSlotDateTime?: string; // ISO string
  currentLocation?: { lat: number; lng: number; address: string };
  currentMaxPatients?: number;
  onCancel: () => void;
  onSave: (
    name: string,
    email: string,
    specialty: string,
    profileImageFile: File | null,
    slotDateTime: string,
    location: { lat: number; lng: number; address: string },
    maxPatients: number
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

// Helper component: click-to-place-marker on the map
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
  currentSlotDateTime,
  currentLocation,
  currentMaxPatients,
  onCancel,
  onSave,
}) => {
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [specialty, setSpecialty] = useState(currentSpecialty);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentProfileImageUrl);
  const [slotDateTime, setSlotDateTime] = useState(
    currentSlotDateTime ? currentSlotDateTime.slice(0, 16) : ''
  );
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(
    currentLocation || null
  );
  const [maxPatients, setMaxPatients] = useState<number>(currentMaxPatients || 1);
  const [error, setError] = useState<string>('');

  // Dummy reverse‑geocode – swap this out for your real API call
  const fetchAddress = async (lat: number, lng: number) => {
    return `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setProfileImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleMapSelect = async (pos: { lat: number; lng: number }) => {
    const addr = await fetchAddress(pos.lat, pos.lng);
    setLocation({ lat: pos.lat, lng: pos.lng, address: addr });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !specialty || !slotDateTime || !location) {
      setError('Please fill in all fields, including availability and location.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (maxPatients < 1) {
      setError('Max patients must be at least 1.');
      return;
    }

    onSave(
      name.trim(),
      email.trim(),
      specialty,
      profileImageFile,
      slotDateTime,
      location,
      maxPatients
    );
  };

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
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </motion.div>

          {/* Name, Email, Specialty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="edit-name" className="block text-sm text-gray-400 mb-1">Full Name</label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="edit-email" className="block text-sm text-gray-400 mb-1">Email Address</label>
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="edit-specialty" className="block text-sm text-gray-400 mb-1">Specialty</label>
              <select
                id="edit-specialty"
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <option value="" disabled>Select specialty...</option>
                {SPECIALTIES.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Availability & Patients */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="slot-datetime" className="block text-sm text-gray-400 mb-1">Available Slot</label>
              <input
                id="slot-datetime"
                type="datetime-local"
                value={slotDateTime}
                onChange={e => setSlotDateTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="max-patients" className="block text-sm text-gray-400 mb-1">Max Patients</label>
              <input
                id="max-patients"
                type="number"
                min={1}
                value={maxPatients}
                onChange={e => setMaxPatients(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="location-input" className="block text-sm text-gray-400 mb-1">Location</label>
              <input
                id="location-input"
                type="text"
                value={location?.address || ''}
                readOnly
                placeholder="Click map to select"
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              />
            </div>
          </div>

          {/* Map Picker */}
          <motion.div
            className="h-64 rounded-lg overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <MapContainer
              center={location ? [location.lat, location.lng] : [20.5937, 78.9629]}
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
