// File: src/pages/DoctorsPage1.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  X,
} from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import Chatbot from '../../components/common/chatbot/chatbot';
import BookAppointment from '../../components/common/bookappointment/bookappointment';
import { BackgroundAnimation } from '../../components/animations/BackGroundAnimations';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  experience: string;
  hospitalAffiliation: string;
  location: string;
  availableSlotsCount: number;
  nextAvailable: string | null;
  profileImageUrl: string;
  consultationFee: number;
}

interface DoctorDetail extends Doctor {
  bio?: string;
  qualifications?: string[];
  languages?: string[];
  availabilitySlots: string[];
}

const specialties = [
  'All Specialties',
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

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.3 + i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
  hover: { scale: 1.03, boxShadow: '0 10px 20px rgba(0,0,0,0.5)' },
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const DoctorsPage1: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [showFilters, setShowFilters] = useState(false);

  const [viewingDoctorId, setViewingDoctorId] = useState<string | null>(null);
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState<DoctorDetail | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [bookingDoctorId, setBookingDoctorId] = useState<string | null>(null);

  // Build API base URL
  let API_BASE = import.meta.env.VITE_API_URL || '';
  API_BASE = API_BASE.replace(/\/$/, '');
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api') ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;

  // Fetch doctors
  useEffect(() => {
    axios
      .get(buildUrl('/medical/doctors'))
      .then(resp => {
        const docsArray = Array.isArray(resp.data.doctors)
          ? resp.data.doctors
          : Array.isArray(resp.data)
          ? resp.data
          : [];
        const mapped: Doctor[] = docsArray.map((d: any) => ({
          id: d.id || d._id,
          name: d.name,
          specialty: d.specialty || '',
          rating: d.rating || 0,
          reviewCount: d.reviewCount || 0,
          experience: d.experience || '',
          hospitalAffiliation: d.hospitalAffiliation || '',
          location: d.location || '',
          availableSlotsCount: d.availableSlotsCount || 0,
          nextAvailable: d.nextAvailable || null,
          consultationFee: d.consultationFee || 0,
          profileImageUrl: d.profileImageUrl || buildUrl(`/medical/doctor/${d._id}/profile-image`),
        }));
        setDoctors(mapped);
        setFilteredDoctors(mapped);
      })
      .catch(err => {
        console.error('Error fetching doctors:', err);
      });
  }, []);

  // Filter effect
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    setFilteredDoctors(
      doctors.filter(doc => {
        const matchesText =
          doc.name.toLowerCase().includes(term) ||
          doc.specialty.toLowerCase().includes(term);
        const matchesSpec =
          selectedSpecialty === 'All Specialties' ||
          doc.specialty === selectedSpecialty;
        return matchesText && matchesSpec;
      })
    );
  }, [searchTerm, selectedSpecialty, doctors]);

  const onSearch = () => setSearchTerm(searchInput);

  const handleViewProfileClick = (id: string) => {
    setViewingDoctorId(id);
    setProfileLoading(true);
    setSelectedDoctorProfile(null);

    axios
      .get(buildUrl(`/medical/doctors/${id}`))
      .then(res => {
        const d = res.data;
        const id2 = d.id || d._id;
        const futureSlots = Array.isArray(d.availabilitySlots)
          ? d.availabilitySlots
              .map((s: string) => new Date(s))
              .filter(dt => !isNaN(dt.getTime()) && dt > new Date())
              .sort((a, b) => a.getTime() - b.getTime())
          : [];
        setSelectedDoctorProfile({
          id: id2,
          name: d.name,
          specialty: d.specialty || '',
          rating: d.rating || 0,
          reviewCount: d.reviewCount || 0,
          experience: d.experience || '',
          hospitalAffiliation: d.hospitalAffiliation || '',
          location: d.location || '',
          availableSlotsCount: futureSlots.length,
          nextAvailable: futureSlots[0]?.toISOString() || null,
          consultationFee: d.consultationFee || 0,
          profileImageUrl:
            d.profileImageUrl || buildUrl(`/medical/doctor/${id2}/profile-image`),
          bio: d.bio || '',
          qualifications: Array.isArray(d.qualifications) ? d.qualifications : [],
          languages: Array.isArray(d.languages) ? d.languages : [],
          availabilitySlots: futureSlots.map(dt => dt.toISOString()),
        });
      })
      .catch(err => console.error('Error loading profile:', err))
      .finally(() => setProfileLoading(false));
  };

  const closeViewProfileModal = () => {
    setViewingDoctorId(null);
    setSelectedDoctorProfile(null);
  };

  const handleBookClick = (id: string) => setBookingDoctorId(id);
  const closeBookingForm = () => setBookingDoctorId(null);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundAnimation />

      <main className="relative z-10 min-h-screen overflow-y-auto text-gray-100">
        <div className="px-4 py-8 mx-auto sm:px-6 lg:px-10 xl:px-20 max-w-7xl">
          {/* Header */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mb-8 text-center"
          >
            <motion.h1
              className="mb-2 text-2xl font-bold text-transparent sm:text-3xl md:text-4xl lg:text-5xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              Find the Right Doctor
            </motion.h1>
            <motion.p
              className="text-sm text-gray-300 sm:text-base md:text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Search specialists, read reviews, and book appointments
            </motion.p>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="p-4 mb-10 border bg-white/10 backdrop-blur-xl border-white/20 rounded-3xl md:p-6 lg:p-8"
          >
            <div className="flex flex-col items-center gap-4 md:flex-row">
              {/* Search */}
              <div className="relative flex-1 w-full">
                
                <Input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onSearch()}
                  placeholder="Search by name or specialty..."
                  className="w-full py-2 pl-10 pr-12 text-white bg-transparent border-black rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={onSearch}
                  className="absolute text-gray-300 transform -translate-y-1/2 right-3 top-1/2 hover:text-white"
                >
                  <Search size={20} />
                </button>
              </div>
              {/* Specialty */}
              <select
                value={selectedSpecialty}
                onChange={e => setSelectedSpecialty(e.target.value)}
                className="w-full px-4 py-2 text-black bg-transparent border-gray-400 rounded-lg md:w-auto focus:ring-2 focus:ring-indigo-500"
              >
                {specialties.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {/* Filters button */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(f => !f)}
                icon={<Filter size={18} className="text-white" />}
                className="px-4 py-2 text-white border border-gray-600 rounded-lg hover:bg-gray-700"
              >
                Filters
              </Button>
            </div>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="pt-4 mt-4 border-t border-white/20"
                >
                  {/* Advanced filters placeholder */}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results count */}
          <motion.div variants={fadeInUp} className="mb-4 text-gray-300 ">
            Showing{' '}
            <span className="font-semibold text-blue-400">{filteredDoctors.length}</span>{' '}
            doctor{filteredDoctors.length !== 1 ? 's' : ''}{' '}
            {selectedSpecialty !== 'All Specialties' && (
              <>in <span className="text-purple-400">{selectedSpecialty}</span></>
            )}
          </motion.div>

          {/* Doctor list */}
          {filteredDoctors.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {filteredDoctors.map((doctor, idx) => (
                <motion.div
                  key={doctor.id}
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className="overflow-hidden border bg-white/5 backdrop-blur-lg rounded-3xl border-white/20"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="relative md:w-1/4 lg:w-1/5">
                      <motion.img
                        src={doctor.profileImageUrl}
                        alt={doctor.name}
                        className="object-cover w-full h-56 md:h-full"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                    {/* Details */}
                    <div className="flex flex-col justify-between flex-1 p-4 md:p-6 lg:p-8">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="text-lg font-semibold text-white sm:text-xl md:text-2xl">
                              Dr. {doctor.name}
                            </h2>
                            <p className="text-indigo-400">{doctor.specialty}</p>
                          </div>
                          {doctor.nextAvailable && (
                            <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-200 bg-green-700 rounded-full">
                              <Clock size={14} className="mr-1" />
                              Next: {new Date(doctor.nextAvailable).toLocaleString()}
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 gap-4 mt-4 text-gray-300 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <p className="text-sm">Experience</p>
                            <p>{doctor.experience} yrs</p>
                          </div>
                          <div>
                            <p className="text-sm">Hospital</p>
                            <p>{doctor.hospitalAffiliation}</p>
                          </div>
                          <div>
                            <p className="text-sm">Location</p>
                            <div className="flex items-center">
                              <MapPin size={14} className="mr-1" />
                              {doctor.location}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 mt-6 sm:flex-row sm:justify-between">
                        <div>
                          <p className="text-sm">Fee</p>
                          <p className="font-medium">₹ {doctor.consultationFee}</p>
                        </div>
                        <div>
                          <p className="text-sm">Slots</p>
                          <p className="font-medium">{doctor.availableSlotsCount}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => handleViewProfileClick(doctor.id)}
                            className="text-gray-300 border-gray-600 hover:bg-gray-700"
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="primary"
                            disabled={doctor.availableSlotsCount === 0}
                            onClick={() => handleBookClick(doctor.id)}
                            className={`${
                              doctor.availableSlotsCount === 0 ? 'opacity-50 cursor-not-allowed w-full' : ''
                            }`}
                          >
                            Book Session
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              variants={fadeInUp}
              className="py-16 text-center bg-transparent border backdrop-blur-xl rounded-3xl border-gray-700/50"
            >
              <Search size={32} className="mx-auto mb-4 text-gray-600" />
              <h3 className="mb-2 text-xl font-medium text-gray-100 md:text-2xl">No doctors found</h3>
              <p className="mb-6 text-gray-400">Try different keywords or filters.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                  setSelectedSpecialty('All Specialties');
                  setShowFilters(false);
                }}
                className="text-gray-300 bg-transparent border-gray-600 hover:bg-gray-700"
              >
                Clear Filters
              </Button>
            </motion.div>
          )}

          {/* Booking Modal */}
          <AnimatePresence>
            {bookingDoctorId && (
              <BookAppointment doctorId={bookingDoctorId} onClose={closeBookingForm} />
            )}
          </AnimatePresence>

          {/* Profile Modal */}
          <AnimatePresence>
            {viewingDoctorId && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                onClick={closeViewProfileModal}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.5 }}
                  className="relative w-full max-w-md p-4 text-white border bg-white/5 backdrop-blur-xl border-white/20 rounded-3xl sm:p-6 md:p-8"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={closeViewProfileModal}
                    className="absolute text-gray-300 top-3 right-3 hover:text-white"
                  >
                    <X size={20} />
                  </button>

                  {profileLoading && <p className="text-center">Loading...</p>}

                  {!profileLoading && selectedDoctorProfile && (
                    <div className="space-y-4">
                      <img
                        src={selectedDoctorProfile.profileImageUrl}
                        alt={selectedDoctorProfile.name}
                        className="w-20 h-20 mx-auto rounded-full shadow-lg ring-4 ring-indigo-500/30"
                      />
                      <div className="text-center">
                        <h2 className="text-lg font-bold">Dr. {selectedDoctorProfile.name}</h2>
                        <p className="text-indigo-300">{selectedDoctorProfile.specialty}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 text-sm text-gray-200 sm:grid-cols-2">
                        <div>
                          <p className="font-semibold">Experience</p>
                          <p>{selectedDoctorProfile.experience} yrs</p>
                        </div>
                        <div>
                          <p className="font-semibold">Fee</p>
                          <p>₹ {selectedDoctorProfile.consultationFee}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="font-semibold">Slots</p>
                          {selectedDoctorProfile.availabilitySlots.length > 0 ? (
  <ul className="ml-4 list-disc list-inside">
    {selectedDoctorProfile.availabilitySlots.map((slot, i) => (
      <li key={i}>{new Date(slot).toLocaleString()}</li>
    ))}
  </ul>
) : (
  <p>No upcoming slots</p>
)}
                        </div>
                        {selectedDoctorProfile.qualifications?.length && (
                          <div className="sm:col-span-2">
                            <p className="font-semibold">Qualifications</p>
                            <ul className="ml-4 list-disc list-inside">
                              {selectedDoctorProfile.qualifications.map((q, i) => (
                                <li key={i}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedDoctorProfile.languages?.length && (
                          <div className="sm:col-span-2">
                            <p className="font-semibold">Languages</p>
                            <p>{selectedDoctorProfile.languages.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Chatbot */}
      <div className="fixed z-50 bottom-6 right-6">
        <Chatbot />
      </div>
    </div>
  );
};

export default DoctorsPage1;
