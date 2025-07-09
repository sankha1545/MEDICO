// File: frontend/src/components/common/editprofile/editprofileformsdoc.tsx

import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  FormEvent
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X as CloseIcon, Trash2, Pencil } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios, { AxiosError } from 'axios';

// Leaflet icon asset imports
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Configure Leaflet icon paths
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

// Axios instance via Vite proxy
const api = axios.create({
  baseURL: '/api/medical',
});

const getAuthHeader = () => {
  const token = localStorage.getItem('authToken') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchAddress = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { format: 'jsonv2', lat, lon: lng }
    });
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
    click(e) {
      onSelect(e.latlng);
    }
  });
  return position ? <Marker position={position} /> : null;
};

export default function EditProfileForm({
  onCancel
}: {
  onCancel: () => void;
}) {
  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [availability, setAvailability] = useState<string[]>(['']);
  const [location, setLocation] = useState<LocationType | null>(null);
  const [maxPatients, setMaxPatients] = useState(1);
  const [dob, setDob] = useState('');
  const [experience, setExperience] = useState('');
  const [hospitalAff, setHospitalAff] = useState('');
  const [bio, setBio] = useState('');
  const [quals, setQuals] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [fee, setFee] = useState(0);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string>('');
  const [geocoding, setGeocoding] = useState(false);

  // Load initial profile
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/doctor/me', { headers: getAuthHeader() });
        const d = res.data as any;
        setName(d.name || '');
        setEmail(d.email || '');
        setSpecialty(d.specialty || '');
        setPreviewUrl(d.profileImageUrl);
        setAvailability(
          Array.isArray(d.availabilitySlots) && d.availabilitySlots.length
            ? d.availabilitySlots.map((s: string) => s.slice(0, 16))
            : ['']
        );
        setLocation(d.locationObj || null);
        setMaxPatients(d.maxPatients ?? 1);
        setDob(d.dob || '');  // Ensure DOB is loaded
        setExperience(d.experience || '');
        setHospitalAff(d.hospitalAffiliation || '');
        setBio(d.bio || '');
        setQuals(d.qualifications || []);
        setLangs(d.languages || []);
        setFee(d.consultationFee ?? 0);
      } catch (err) {
        const msg = (err as AxiosError).response?.data?.message
          || (err as Error).message
          || 'Failed to load profile';
        console.error('Load profile error:', err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handlers
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setProfileFile(f);
    if (f) setPreviewUrl(URL.createObjectURL(f));
  }, []);

  const handleMapSelect = useCallback(async (pos: { lat: number; lng: number }) => {
    setGeocoding(true);
    const addr = await fetchAddress(pos.lat, pos.lng);
    setGeocoding(false);
    setLocation({ lat: pos.lat, lng: pos.lng, address: addr });
  }, []);

  const updateSlot = useCallback((i: number, v: string) =>
    setAvailability(slots => slots.map((s, idx) => idx === i ? v : s))
  , []);

  const addSlot = useCallback(() =>
    setAvailability(slots => slots.length < 5 ? [...slots, ''] : slots)
  , []);

  const removeSlot = useCallback((i: number) =>
    setAvailability(slots => slots.length > 1 ? slots.filter((_, idx) => idx !== i) : slots)
  , []);

  const handleQualsChange = useCallback((e: ChangeEvent<HTMLInputElement>) =>
    setQuals(e.target.value.split(',').map(s => s.trim()))
  , []);

  const handleLangsChange = useCallback((e: ChangeEvent<HTMLInputElement>) =>
    setLangs(e.target.value.split(',').map(s => s.trim()))
  , []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!specialty || !dob || !location) {
      setError('Please fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.append('specialty', specialty);
      if (profileFile) form.append('photo', profileFile);
      form.append('availabilitySlots', JSON.stringify(availability));
      form.append('locationObj', JSON.stringify(location));
      form.append('maxPatients', String(maxPatients));
      form.append('dob', dob);  // Include DOB now
      form.append('experience', experience);
      form.append('hospitalAffiliation', hospitalAff);
      form.append('bio', bio);
      form.append('qualifications', JSON.stringify(quals));
      form.append('languages', JSON.stringify(langs));
      form.append('consultationFee', String(fee));

      const res = await api.put('/doctor/me', form, {
        headers: { 
          ...getAuthHeader(), 
          'Content-Type': 'multipart/form-data' 
        }
      });

      if (res.data.profileImageUrl) {
        setPreviewUrl(res.data.profileImageUrl);
      }
    } catch (err) {
      const msg = (err as AxiosError).response?.data?.message
        || (err as Error).message
        || 'Save failed';
      console.error('Save error:', err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [
    specialty, profileFile, availability, location,
    maxPatients, experience, hospitalAff, bio, quals, langs, fee, dob
  ]);

  const handleClear = useCallback(async () => {
    setError('');
    setClearing(true);
    try {
      // only clear editable fields
      setProfileFile(null);
      setPreviewUrl(undefined);
      setAvailability(['']);
      setLocation(null);
      setMaxPatients(1);
      // keep name, email, dob, specialty
      setExperience('');
      setHospitalAff('');
      setBio('');
      setQuals([]);
      setLangs([]);
      setFee(0);
      // inform backend if needed
      await api.post('/doctor/me/clear', {}, { headers: getAuthHeader() });
    } catch (err) {
      const msg = (err as AxiosError).response?.data?.message
        || (err as Error).message
        || 'Clear failed';
      console.error('Clear error:', err);
      setError(msg);
    } finally {
      setClearing(false);
    }
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-white">Loading profile…</div>;
  }

  const inputClass = 'w-full p-4 bg-gray-900/70 backdrop-blur-md text-white rounded-2xl border-2 border-transparent focus:outline-none';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gradient-to-br from-indigo-900 via-purple-800 to-cyan-900 rounded-3xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="flex items-center gap-3 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              <Pencil className="w-7 h-7"/> Edit Profile
            </h2>
            <button onClick={onCancel} disabled={saving || clearing}>
              <CloseIcon className="text-gray-400 transition-colors w-7 h-7 hover:text-white"/>
            </button>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              className="p-4 mb-6 text-white bg-red-600 rounded-2xl"
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
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
                  <Pencil/> Upload Photo
                  <input
                    type="file" accept="image/*" className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </Button>
            </div>

            {/* Name & Email (read-only) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <input
                type="text" value={name} readOnly
                className={`${inputClass} cursor-not-allowed opacity-80`}
              />
              <input
                type="email" value={email} readOnly
                className={`${inputClass} cursor-not-allowed opacity-80`}
              />
            </div>

            {/* Specialty & DOB */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <select
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select Specialty</option>
                {SPECIALTIES.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
              <input
                type="date" value={dob}
                onChange={e => setDob(e.target.value)}  // Make DOB editable
                className={inputClass}
                required
              />
            </div>

            {/* Location Picker */}
            <div className="space-y-2">
              <input
                type="text" readOnly
                value={location?.address || ''}
                placeholder="Click map to set location"
                className={`${inputClass} cursor-pointer`}
              />
              <div className="h-56 overflow-hidden border-2 border-gray-700 rounded-2xl">
                <MapContainer
                  center={location ? [location.lat, location.lng] : DEFAULT_CENTER}
                  zoom={location ? 13 : 5}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker position={location} onSelect={handleMapSelect} />
                </MapContainer>
              </div>
              {geocoding && <p className="text-sm text-gray-300">Fetching address…</p>}
            </div>

            {/* Availability Slots */}
            <div className="space-y-4">
              <p className="font-medium text-white">Availability Slots</p>
              {availability.map((slot, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="datetime-local"
                    value={slot}
                    onChange={e => updateSlot(i, e.target.value)}
                    className={inputClass}
                  />
                  {availability.length > 1 && (
                    <Button variant="danger" onClick={() => removeSlot(i)} disabled={saving || clearing}>
                      <Trash2 size={16}/> Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="secondary" onClick={addSlot} disabled={availability.length >= 5 || saving || clearing}>
                + Add Slot ({availability.length}/5)
              </Button>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <input
                type="number" min={1}
                value={maxPatients}
                onChange={e => setMaxPatients(+e.target.value)}
                placeholder="Max Patients"
                className={inputClass}
              />
              <input
                type="number" min={0}
                value={fee}
                onChange={e => setFee(+e.target.value)}
                placeholder="Consultation Fee (₹)"
                className={inputClass}
              />
              <input
                type="text"
                value={experience}
                onChange={e => setExperience(e.target.value)}
                placeholder="Experience"
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
                onChange={handleQualsChange}
                placeholder="Qualifications (comma-separated)"
                className={inputClass}
              />
              <input
                type="text"
                value={langs.join(', ')}
                onChange={handleLangsChange}
                placeholder="Languages (comma-separated)"
                className={inputClass}
              />
            </div>

            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Short Bio (optional)"
              rows={4}
              className={`${inputClass} resize-none`}
            />

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-700">
              <Button variant="outline" onClick={handleClear} disabled={saving || clearing}>
                {clearing ? 'Clearing…' : (<><Trash2 size={16}/> Clear Form</>)}
              </Button>
              <div className="flex gap-4">
                <Button variant="outline" onClick={onCancel} disabled={saving || clearing}>Cancel</Button>
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
