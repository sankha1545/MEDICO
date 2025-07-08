// File: frontend/src/components/common/editprofile/EditProfileForm.tsx

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X as CloseIcon, Trash2, Pencil } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

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
  currentAvailabilitySlots?: string[];
  currentLocation?: LocationType;
  currentMaxPatients?: number;
  currentDob?: string;
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
    location: LocationType | null,
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
  'Cardiology','Dermatology','Neurology','Oncology','Pediatrics',
  'Psychiatry','Radiology','Urology','Orthopedics','Gastroenterology',
];

const LocationPicker: React.FC<{
  position: { lat: number; lng: number } | null;
  onSelect: (pos: { lat: number; lng: number }) => void;
}> = ({ position, onSelect }) => {
  useMapEvents({ click(e) { onSelect(e.latlng); } });
  return position ? <Marker position={position} /> : null;
};

export default function EditProfileForm({
  currentName, currentEmail, currentSpecialty, currentProfileImageUrl,
  currentAvailabilitySlots, currentLocation, currentMaxPatients,
  currentDob, currentExperience, currentHospitalAffiliation,
  currentBio, currentQualifications, currentLanguages,
  currentConsultationFee, onCancel, onSave
}: EditProfileFormProps) {
  // State, initialized from props so data persists on reopen
  const [name] = useState(currentName);
  const [email] = useState(currentEmail);
  const [specialty, setSpecialty] = useState(currentSpecialty);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentProfileImageUrl);

  const [availabilitySlots, setAvailabilitySlots] = useState<string[]>(
    currentAvailabilitySlots?.map(s => s.slice(0,16)) || ['']
  );
  const [location, setLocation] = useState<LocationType | null>(currentLocation || null);
  const [maxPatients, setMaxPatients] = useState(currentMaxPatients || 1);
  const [dob, setDob] = useState(currentDob || '');
  const [experience, setExperience] = useState(currentExperience || '');
  const [hospitalAffiliation, setHospitalAffiliation] = useState(currentHospitalAffiliation || '');
  const [bio, setBio] = useState(currentBio || '');
  const [qualifications, setQualifications] = useState<string[]>(currentQualifications || []);
  const [languages, setLanguages] = useState<string[]>(currentLanguages || []);
  const [consultationFee, setConsultationFee] = useState(currentConsultationFee ?? 0);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // Fetch formatted address from coordinates
  const fetchAddress = async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: { format: 'jsonv2', lat, lon: lng }
      });
      return res.data.display_name || `Lat ${lat}, Lng ${lng}`;
    } catch {
      return `Lat ${lat}, Lng ${lng}`;
    } finally {
      setGeocoding(false);
    }
  };

  const handleMapSelect = async (pos: { lat: number; lng: number }) => {
    const addr = await fetchAddress(pos.lat, pos.lng);
    setLocation({ lat: pos.lat, lng: pos.lng, address: addr });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProfileImageFile(file);
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  // Slot handlers
  const handleSlotChange = (i: number, v: string) => {
    setAvailabilitySlots(slots => {
      const arr = [...slots];
      arr[i] = v;
      return arr;
    });
  };
  const handleAddSlot = () =>
    setAvailabilitySlots(slots => slots.length < 5 ? [...slots, ''] : slots);
  const handleRemoveSlot = (i: number) =>
    setAvailabilitySlots(slots =>
      slots.length > 1 ? slots.filter((_, idx) => idx !== i) : slots
    );

  const handleQualificationsChange = (e: ChangeEvent<HTMLInputElement>) =>
    setQualifications(e.target.value.split(',').map(s => s.trim()));
  const handleLanguagesChange = (e: ChangeEvent<HTMLInputElement>) =>
    setLanguages(e.target.value.split(',').map(s => s.trim()));

  // Save filled data
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!specialty || !dob || !location) {
      return setError('Please fill all required fields.');
    }
    if (new Date(dob) >= new Date()) {
      return setError('Date of birth must be in the past.');
    }
    if (availabilitySlots.some((slot, i) => new Date(slot) <= new Date())) {
      return setError('All slots must be in the future.');
    }
    if (consultationFee < 0) {
      return setError('Consultation fee must be zero or more.');
    }

    setSaving(true);
    try {
      await onSave(
        name, email, specialty, profileImageFile,
        availabilitySlots, location, maxPatients, dob,
        experience, hospitalAffiliation, bio,
        qualifications, languages, consultationFee
      );
    } catch (err: any) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  // Clear all editable fields and database
  const handleClear = async () => {
    setError('');
    setClearing(true);
    try {
      const token = localStorage.getItem('authToken') || '';
      await axios.delete('/api/medical/doctor/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Reset local states (keep name & email)
      setPreviewUrl(undefined);
      setProfileImageFile(null);
      setAvailabilitySlots(['']);
      setLocation(null);
      setMaxPatients(1);
      setDob('');
      setExperience('');
      setHospitalAffiliation('');
      setBio('');
      setQualifications([]);
      setLanguages([]);
      setConsultationFee(0);
    } catch (err: any) {
      setError(err.message || 'Failed to clear data.');
    } finally {
      setClearing(false);
    }
  };

  // Animated input props
  const animatedInput = {
    whileFocus: { scale: 1.02, boxShadow: '0 0 8px rgba(0,255,255,0.7)' },
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  };

  const inputClass =
    'w-full p-4 bg-gray-900/70 backdrop-blur-md text-white rounded-2xl border-2 border-transparent focus:outline-none';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gradient-to-br from-indigo-900 via-purple-800 to-cyan-900 rounded-3xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="flex items-center gap-3 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              <Pencil className="w-7 h-7" /> Edit Profile
            </h2>
            <button onClick={onCancel} disabled={saving || clearing}>
              <CloseIcon className="text-gray-400 transition-colors w-7 h-7 hover:text-white" />
            </button>
          </div>

          {error && (
            <motion.div
              className="p-4 mb-6 text-white bg-red-600 rounded-2xl"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Image */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 p-1 mb-4 overflow-hidden rounded-full bg-gradient-to-br from-purple-700 to-indigo-700">
                <img
                  src={previewUrl || '/default-profile.jpg'}
                  onError={e => (e.currentTarget.src = '/default-profile.jpg')}
                  alt="Profile"
                  className="object-cover w-full h-full rounded-full"
                />
              </div>
              <Button variant="primary" disabled={saving || clearing}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Pencil /> Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </Button>
            </div>

            {/* Basic Info (read-only) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <motion.input
                type="text"
                value={name}
                readOnly
                className={inputClass + ' cursor-not-allowed opacity-80'}
                {...animatedInput}
              />
              <motion.input
                type="email"
                value={email}
                readOnly
                className={inputClass + ' cursor-not-allowed opacity-80'}
                {...animatedInput}
              />
              <motion.select
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className={inputClass}
                required
                {...animatedInput}
              >
                <option value="">Select Specialty</option>
                {SPECIALTIES.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </motion.select>
              <motion.input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className={inputClass}
                required
                {...animatedInput}
              />
            </div>

            {/* Location Picker */}
            <div className="space-y-2">
              <motion.input
                type="text"
                readOnly
                value={location?.address || ''}
                placeholder="Click on map to select location"
                className={inputClass + ' cursor-pointer'}
                {...animatedInput}
              />
              <div className="h-56 overflow-hidden border-2 border-gray-700 rounded-2xl">
                <MapContainer
                  center={location ? [location.lat, location.lng] : DEFAULT_CENTER}
                  zoom={location ? 13 : 5}
                  key={location ? `${location.lat}-${location.lng}` : 'default'}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker
                    position={location ? { lat: location.lat, lng: location.lng } : null}
                    onSelect={handleMapSelect}
                  />
                </MapContainer>
              </div>
              {geocoding && <p className="text-sm text-gray-300">Fetching address…</p>}
            </div>

            {/* Availability Slots */}
            <div className="space-y-4">
              <p className="font-medium text-white">Availability Slots</p>
              {availabilitySlots.map((slot, i) => (
                <div key={i} className="flex items-center gap-3">
                  <motion.input
                    type="datetime-local"
                    value={slot}
                    onChange={e => handleSlotChange(i, e.target.value)}
                    className={inputClass}
                    {...animatedInput}
                  />
                  {availabilitySlots.length > 1 && (
                    <Button
                      variant="danger"
                      onClick={() => handleRemoveSlot(i)}
                      disabled={saving || clearing}
                    >
                      <Trash2 size={16} /> Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="secondary"
                onClick={handleAddSlot}
                disabled={availabilitySlots.length >= 5 || saving || clearing}
              >
                + Add Slot ({availabilitySlots.length}/5)
              </Button>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <motion.input
                type="number"
                min={1}
                value={maxPatients}
                onChange={e => setMaxPatients(+e.target.value)}
                placeholder="Max Patients"
                className={inputClass}
                {...animatedInput}
              />
              <motion.input
                type="number"
                min={0}
                value={consultationFee}
                onChange={e => setConsultationFee(+e.target.value)}
                placeholder="Consultation Fee (₹)"
                className={inputClass}
                {...animatedInput}
              />
              <motion.input
                type="text"
                value={experience}
                onChange={e => setExperience(e.target.value)}
                placeholder="Experience"
                className={inputClass}
                {...animatedInput}
              />
              <motion.input
                type="text"
                value={hospitalAffiliation}
                onChange={e => setHospitalAffiliation(e.target.value)}
                placeholder="Hospital Affiliation"
                className={inputClass}
                {...animatedInput}
              />
              <motion.input
                type="text"
                value={qualifications.join(', ')}
                onChange={handleQualificationsChange}
                placeholder="Qualifications (comma-separated)"
                className={inputClass}
                {...animatedInput}
              />
              <motion.input
                type="text"
                value={languages.join(', ')}
                onChange={handleLanguagesChange}
                placeholder="Languages (comma-separated)"
                className={inputClass}
                {...animatedInput}
              />
            </div>

            <motion.textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Short Bio (optional)"
              rows={4}
              className={inputClass + ' resize-none'}
              {...animatedInput}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={saving || clearing}
              >
                {clearing ? 'Clearing…' : <><Trash2 size={16} /> Clear Form</>}
              </Button>
              <div className="flex gap-4">
                <Button variant="outline" onClick={onCancel} disabled={saving || clearing}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving || clearing}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
