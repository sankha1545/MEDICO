// File: frontend/src/components/common/editprofile/EditDocProfile.tsx

import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  FormEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X as CloseIcon, Pencil, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default leaflet icons
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

export interface LocationType {
  lat: number;
  lng: number;
  address: string;
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

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const api = axios.create({ baseURL: '/api/medical' });

const getAuthHeader = () => {
  const token = localStorage.getItem('authToken') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchAddress = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await axios.get(
      'https://nominatim.openstreetmap.org/reverse',
      {
        params: { format: 'jsonv2', lat, lon: lng },
      }
    );
    return res.data.display_name;
  } catch {
    return `Lat ${lat}, Lng ${lng}`;
  }
};

const LocationPicker: React.FC<{
  position: { lat: number; lng: number } | null;
  onSelect: (pos: { lat: number; lng: number }) => void;
}> = ({ position, onSelect }) => {
  useMapEvents({
    click: (e) => onSelect(e.latlng),
  });
  return position ? <Marker position={position} /> : null;
};

const isValidDate = (d: Date) => d instanceof Date && !isNaN(d.getTime());

export default function EditDocProfile({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave?: () => void;
}) {
  // form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [dob, setDob] = useState('');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [availability, setAvailability] = useState<string[]>(['']);
  const [location, setLocation] = useState<LocationType | null>(null);
  const [experience, setExperience] = useState('');
  const [fee, setFee] = useState(0);
  const [maxPatients, setMaxPatients] = useState(1);
  const [hospitalAff, setHospitalAff] = useState('');
  const [bio, setBio] = useState('');
  const [quals, setQuals] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  // Load profile + image
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1) fetch doctor data
      const res = await api.get('/doctor/me', { headers: getAuthHeader() });
      const d = res.data;
      setName(d.name || '');
      setEmail(d.email || '');
      setSpecialty(d.specialty || '');
      setDob(d.dob || '');

      setAvailability(
        Array.isArray(d.availabilitySlots) && d.availabilitySlots.length
          ? d.availabilitySlots
              .map((s: string) => {
                const dt = new Date(s);
                if (isNaN(dt.getTime())) return null;
                const local = new Date(
                  dt.getTime() - dt.getTimezoneOffset() * 60000
                );
                return local.toISOString().slice(0, 16);
              })
              .filter(Boolean)
          : ['']
      );

      setLocation(d.locationObj || null);
      setExperience(d.experience || '');
      setFee(d.consultationFee ?? 0);
      setMaxPatients(d.maxPatients ?? 1);
      setHospitalAff(d.hospitalAffiliation || '');
      setBio(d.bio || '');
      setQuals(d.qualifications || []);
      setLangs(d.languages || []);

      // 2) now fetch the protected image as a blob
      try {
        const imgRes = await api.get('/doctor/me/profile-image', {
          headers: getAuthHeader(),
          responseType: 'blob',
        });
        const blobUrl = URL.createObjectURL(imgRes.data);
        setPreviewUrl(blobUrl);
      } catch (imgErr) {
        console.warn('No existing profile image or fetch failed', imgErr);
        setPreviewUrl(undefined);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handlers
  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] ?? null;
      setProfileFile(f);
      if (f) setPreviewUrl(URL.createObjectURL(f));
    },
    []
  );

  const handleMapSelect = useCallback(
    async (pos: { lat: number; lng: number }) => {
      setGeocoding(true);
      const addr = await fetchAddress(pos.lat, pos.lng);
      setLocation({ lat: pos.lat, lng: pos.lng, address: addr });
      setGeocoding(false);
    },
    []
  );

  const updateSlot = (i: number, v: string) =>
    setAvailability((slots) =>
      slots.map((s, idx) => (idx === i ? v : s))
    );
  const addSlot = () =>
    availability.length < 5 && setAvailability([...availability, '']);
  const removeSlot = (i: number) =>
    setAvailability((slots) => slots.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const form = new FormData();
      form.append('specialty', specialty);
      if (profileFile) form.append('profileImage', profileFile);
      form.append('availabilitySlots', JSON.stringify(availability));
      form.append('locationObj', JSON.stringify(location));
      form.append('dob', dob);
      form.append('experience', experience);
      form.append('consultationFee', String(fee));
      form.append('maxPatients', String(maxPatients));
      form.append('hospitalAffiliation', hospitalAff);
      form.append('bio', bio);
      form.append('qualifications', JSON.stringify(quals));
      form.append('languages', JSON.stringify(langs));
      
      await api.put('/doctor/me', form, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        },
      });

      // reload both data + image
      await loadProfile();
      onSave && onSave();
    } catch (err) {
      console.error(err);
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full p-4 bg-gray-900/70 text-white rounded-2xl border focus:outline-none';

  if (loading) {
    return <div className="p-8 text-center text-white">Loading…</div>;
  }

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
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Header */}
          <div className="flex justify-between mb-6">
            <h2 className="flex items-center gap-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              <Pencil /> Edit Profile
            </h2>
            <button onClick={onCancel}>
              <CloseIcon className="text-gray-300 w-7 h-7 hover:text-white" />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 mb-4 text-white bg-red-600 rounded">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 mb-3 overflow-hidden rounded-full bg-gradient-to-br from-purple-700 to-indigo-700">
                <img
                  src={previewUrl || '/default-profile.jpg'}
                  className="object-cover w-full h-full"
                  alt="Profile preview"
                />
              </div>
              <Button variant="primary">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Pencil /> Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </Button>
            </div>

            {/* Basic fields */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="text"
                value={name}
                readOnly
                className={`${inputClass} opacity-70`}
              />
              <input
                type="email"
                value={email}
                readOnly
                className={`${inputClass} opacity-70`}
              />
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className={inputClass}
              >
                <option value="">Select Specialty</option>
                {SPECIALTIES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Location Picker */}
            <input
              type="text"
              readOnly
              value={location?.address || ''}
              placeholder="Click map to set location"
              className={`${inputClass} cursor-pointer`}
            />
            <div className="overflow-hidden border border-gray-700 rounded h-52">
              <MapContainer
                center={
                  location
                    ? [location.lat, location.lng]
                    : DEFAULT_CENTER
                }
                zoom={5}
                style={{ height: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker position={location} onSelect={handleMapSelect} />
              </MapContainer>
            </div>
            {geocoding && (
              <p className="text-sm text-gray-300">Fetching address…</p>
            )}

            {/* Availability Slots */}
            <div>
              <p className="mb-2 font-semibold text-white">
                Availability Slots
              </p>
              {availability.map((slot, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    type="datetime-local"
                    value={slot}
                    onChange={e => updateSlot(i, e.target.value)}
                    className={inputClass}
                  />
                  {availability.length > 1 && (
                    <Button
                      variant="danger"
                      onClick={() => removeSlot(i)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="secondary" onClick={addSlot}>
                + Add Slot ({availability.length}/5)
              </Button>
            </div>

            {/* Other details */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="text"
                value={experience}
                onChange={e => setExperience(e.target.value)}
                placeholder="Experience"
                className={inputClass}
              />
              <input
                type="number"
                value={fee}
                onChange={e => setFee(+e.target.value)}
                placeholder="Consultation Fee (₹)"
                className={inputClass}
              />
              <input
                type="number"
                value={maxPatients}
                onChange={e => setMaxPatients(+e.target.value)}
                placeholder="Max Patients"
                className={inputClass}
              />
              <input
                type="text"
                value={hospitalAff}
                onChange={e => setHospitalAff(e.target.value)}
                placeholder="Hospital Affiliation"
                className={inputClass}
              />
              <input
                type="text"
                value={quals.join(', ')}
                onChange={(e) =>
                  setQuals(e.target.value.split(',').map((s) => s.trim()))
                }
                placeholder="Qualifications"
                className={inputClass}
              />
              <input
                type="text"
                value={langs.join(', ')}
                onChange={(e) =>
                  setLangs(e.target.value.split(',').map((s) => s.trim()))
                }
                placeholder="Languages"
                className={inputClass}
              />
            </div>

            {/* Bio */}
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short Bio"
              rows={3}
              className={`${inputClass} resize-none`}
            />

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
