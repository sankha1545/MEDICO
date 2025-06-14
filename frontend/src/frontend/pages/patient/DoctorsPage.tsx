// File: src/pages/DoctorsPage1.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Star as StarIcon,
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
  availableSlots: number;
  nextAvailable: string;
  imageUrl: string;
}

interface DoctorDetail extends Doctor {
  bio?: string;
  qualifications?: string[];
  languages?: string[];
  profileImageUrl?: string;
}

const specialties = [
  'All Specialties',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Gynecology',
  'Ophthalmology',
  'Psychiatry',
  'Dentistry',
];

// Animation variants
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
  const [selectedDoctorProfile, setSelectedDoctorProfile] =
    useState<DoctorDetail | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [bookingDoctorId, setBookingDoctorId] = useState<string | null>(null);

  // Determine API base and avoid double '/api'
  let API_BASE = import.meta.env.VITE_API_URL || '';
  API_BASE = API_BASE.replace(/\/$/, ''); // remove trailing slash
  // If base ends with '/api', we won't add '/api' again when building endpoints.
  const buildUrl = (path: string) => {
    // path: e.g. '/medical/doctors' or '/medical/doctors/{id}'
    if (API_BASE.endsWith('/api')) {
      return `${API_BASE}${path}`;
    } else {
      return `${API_BASE}/api${path}`;
    }
  };

  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const resp = await axios.get(buildUrl('/medical/doctors'));
        // Backend returns { page, limit, total, doctors: [...] }
        let docsArray: any[] = [];
        if (resp.data && Array.isArray(resp.data.doctors)) {
          docsArray = resp.data.doctors;
        } else if (Array.isArray(resp.data)) {
          docsArray = resp.data;
        } else {
          console.error('Unexpected response shape:', resp.data);
          docsArray = [];
        }
        const mapped: Doctor[] = docsArray.map(d => {
          const id = d.id || d._id;
          return {
            id,
            name: d.name,
            specialty: d.specialty || '',
            rating: typeof d.rating === 'number' ? d.rating : 0,
            reviewCount: typeof d.reviewCount === 'number' ? d.reviewCount : 0,
            experience: d.experience || '',
            hospitalAffiliation: d.hospitalAffiliation || '',
            location: d.location || '',
            availableSlots:
              typeof d.availableSlots === 'number' ? d.availableSlots : 0,
            nextAvailable: d.nextAvailable || '',
            // image URL for profile-image endpoint
            imageUrl: buildUrl(`/medical/doctor/${id}/profile-image`),
          };
        });
        setDoctors(mapped);
        setFilteredDoctors(mapped);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setDoctors([]);
        setFilteredDoctors([]);
      }
    };
    fetchDoctors();
  }, []);

  // Filter logic
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    setFilteredDoctors(
      doctors.filter(doc => {
        const matchText =
          doc.name.toLowerCase().includes(term) ||
          doc.specialty.toLowerCase().includes(term);
        const matchSpec =
          selectedSpecialty === 'All Specialties' ||
          doc.specialty === selectedSpecialty;
        return matchText && matchSpec;
      })
    );
  }, [searchTerm, selectedSpecialty, doctors]);

  const onSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleViewProfileClick = (id: string) => {
    setViewingDoctorId(id);
    setProfileLoading(true);
    setSelectedDoctorProfile(null);

    axios
      .get(buildUrl(`/medical/doctors/${id}`))
      .then(res => {
        const d = res.data;
        const docDetail: DoctorDetail = {
          id: d.id || d._id,
          name: d.name,
          specialty: d.specialty || '',
          rating: typeof d.rating === 'number' ? d.rating : 0,
          reviewCount: typeof d.reviewCount === 'number' ? d.reviewCount : 0,
          experience: d.experience || '',
          hospitalAffiliation: d.hospitalAffiliation || '',
          location: d.location || '',
          availableSlots:
            typeof d.availableSlots === 'number' ? d.availableSlots : 0,
          nextAvailable: d.nextAvailable || '',
          imageUrl: buildUrl(`/medical/doctor/${id}/profile-image`),
          profileImageUrl: buildUrl(`/medical/doctor/${id}/profile-image`),
          bio: d.bio || '',
          qualifications: Array.isArray(d.qualifications)
            ? d.qualifications
            : [],
          languages: Array.isArray(d.languages) ? d.languages : [],
        };
        setSelectedDoctorProfile(docDetail);
      })
      .catch(err => {
        console.error('Error loading profile:', err);
      })
      .finally(() => {
        setProfileLoading(false);
      });
  };

  const closeViewProfileModal = () => {
    setViewingDoctorId(null);
    setSelectedDoctorProfile(null);
  };

  const handleBookClick = (id: string) => setBookingDoctorId(id);
  const closeBookingForm = () => setBookingDoctorId(null);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background animations */}
      <BackgroundAnimation />

      <main className="relative z-10 min-h-screen text-gray-100 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10">
          {/* Animated Header */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mb-8 text-center"
          >
            <motion.h1
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              Find the Right Doctor
            </motion.h1>
            <motion.p
              className="text-gray-300 text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Search for specialists, read reviews, and book appointments
            </motion.p>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="bg-gray-800 bg-opacity-60 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-6 mb-10"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Input */}
              <div className="relative flex-1 w-full">
                <motion.div whileHover={{ scale: 1.02 }} className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <Input
                    placeholder="Search by name or specialty..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && onSearch()}
                    className="pl-10 bg-gray-700 text-gray-100 border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                    fullWidth
                  />
                  <motion.button
                    onClick={onSearch}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    <Search size={20} />
                  </motion.button>
                </motion.div>
              </div>

              {/* Specialty Dropdown */}
              <motion.select
                whileHover={{ scale: 1.02 }}
                value={selectedSpecialty}
                onChange={e => setSelectedSpecialty(e.target.value)}
                className="appearance-none px-4 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                {specialties.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </motion.select>

              {/* Filters Toggle */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(f => !f)}
                  icon={<Filter size={18} className="text-gray-300" />}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Filters
                </Button>
              </motion.div>
            </div>

            {/* Advanced Filters Panel (placeholder) */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 pt-4 border-t border-gray-700"
                >
                  {/* TODO: Add advanced filters */}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results Count */}
          <motion.div variants={fadeInUp} className="mb-4 text-gray-300">
            Showing{' '}
            <span className="text-blue-400 font-semibold">{filteredDoctors.length}</span>{' '}
            doctor{filteredDoctors.length !== 1 ? 's' : ''}{' '}
            {selectedSpecialty !== 'All Specialties' && (
              <>in <span className="text-purple-400">{selectedSpecialty}</span></>
            )}
          </motion.div>

          {/* Doctor List */}
          {filteredDoctors.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              {filteredDoctors.map((doctor, idx) => (
                <motion.div
                  key={doctor.id}
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className="bg-gray-800 bg-opacity-60 backdrop-blur-xl rounded-3xl border border-gray-700/50 overflow-hidden"
                >
                  <div className="md:flex">
                    {/* Left: Image */}
                    <div className="md:w-1/4 lg:w-1/5 relative">
                      <motion.img
                        src={doctor.imageUrl}
                        alt={doctor.name}
                        className="w-full h-56 md:h-full object-cover"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                    {/* Right: Details */}
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <motion.h2
                            className="text-2xl md:text-3xl font-semibold text-white"
                            whileHover={{ scale: 1.02 }}
                          >
                            Dr. {doctor.name}
                          </motion.h2>
                          <p className="text-indigo-400">{doctor.specialty}</p>
                          <div className="flex items-center mt-2">
                            {[...Array(5)].map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                <StarIcon
                                  size={16}
                                  fill={
                                    i < Math.floor(doctor.rating)
                                      ? 'currentColor'
                                      : 'none'
                                  }
                                  className={
                                    i < Math.floor(doctor.rating)
                                      ? 'text-yellow-500'
                                      : 'text-gray-600'
                                  }
                                />
                              </motion.div>
                            ))}
                            <span className="ml-2 text-sm text-gray-400">
                              {doctor.rating.toFixed(1)} ({doctor.reviewCount} reviews)
                            </span>
                          </div>
                        </div>
                        {doctor.nextAvailable && (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-700 text-green-200"
                          >
                            <Clock size={14} className="mr-1" />
                            {`Next: ${new Date(doctor.nextAvailable).toLocaleString()}`}
                          </motion.div>
                        )}
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 flex-1">
                        <div>
                          <p className="text-sm text-gray-400">Experience</p>
                          <p className="text-gray-100">{doctor.experience}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Hospital</p>
                          <p className="text-gray-100">{doctor.hospitalAffiliation}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Location</p>
                          <div className="flex items-center">
                            <MapPin size={14} className="text-gray-500 mr-1" />
                            <p className="text-gray-100">{doctor.location}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-6 flex flex-wrap justify-between gap-4">
                        <div className="flex items-center">
                          <Calendar size={18} className="text-indigo-400 mr-2" />
                          <span className="text-gray-400">
                            {doctor.availableSlots} slots available
                          </span>
                        </div>
                        <div className="flex space-x-3">
                          <Button
                            variant="outline"
                            onClick={() => handleViewProfileClick(doctor.id)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => handleBookClick(doctor.id)}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            Book Appointment
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
              className="text-center py-16 bg-gray-800 bg-opacity-60 backdrop-blur-xl rounded-3xl border border-gray-700/50"
            >
              <Search size={32} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-2xl font-medium text-gray-100 mb-2">
                No doctors found
              </h3>
              <p className="text-gray-400 mb-6">
                We couldn’t find any doctors. Try different keywords or filters.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                  setSelectedSpecialty('All Specialties');
                  setShowFilters(false);
                }}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Clear Filters
              </Button>
            </motion.div>
          )}

          {/* Booking Form Modal */}
          <AnimatePresence>
            {bookingDoctorId && (
              <BookAppointment
                doctorId={bookingDoctorId}
                onClose={closeBookingForm}
              />
            )}
          </AnimatePresence>

          {/* Profile Modal */}
          <AnimatePresence>
            {viewingDoctorId && (
              <div
                className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50"
                onClick={closeViewProfileModal}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gray-800 rounded-2xl shadow-lg w-full max-w-lg p-6 relative border border-gray-700"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={closeViewProfileModal}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
                  >
                    <X size={20} />
                  </button>
                  {profileLoading && (
                    <p className="text-gray-300">Loading...</p>
                  )}
                  {!profileLoading && selectedDoctorProfile && (
                    <div className="space-y-4">
                      {selectedDoctorProfile.profileImageUrl && (
                        <img
                          src={selectedDoctorProfile.profileImageUrl}
                          alt={selectedDoctorProfile.name}
                          className="w-24 h-24 rounded-full mx-auto"
                        />
                      )}
                      <h2 className="text-xl md:text-2xl font-semibold text-white text-center">
                        Dr. {selectedDoctorProfile.name}
                      </h2>
                      <p className="text-gray-400 text-center">
                        {selectedDoctorProfile.specialty}
                      </p>
                      {selectedDoctorProfile.bio && (
                        <div>
                          <h3 className="text-white font-medium">Bio</h3>
                          <p className="text-gray-300">{selectedDoctorProfile.bio}</p>
                        </div>
                      )}
                      {selectedDoctorProfile.qualifications && selectedDoctorProfile.qualifications.length > 0 && (
                        <div>
                          <h3 className="text-white font-medium">Qualifications</h3>
                          <ul className="list-disc list-inside text-gray-300">
                            {selectedDoctorProfile.qualifications.map((q, i) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedDoctorProfile.languages && selectedDoctorProfile.languages.length > 0 && (
                        <div>
                          <h3 className="text-white font-medium">Languages</h3>
                          <p className="text-gray-300">
                            {selectedDoctorProfile.languages.join(', ')}
                          </p>
                        </div>
                      )}
                      {/* Add more fields if needed */}
                    </div>
                  )}
                  {!profileLoading && !selectedDoctorProfile && (
                    <p className="text-gray-300">No profile data available.</p>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <Chatbot />
      </div>
    </div>
  );
};

export default DoctorsPage1;
