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
  availableSlotsCount: number;
  nextAvailable: string | null;
   profileImageUrl: string;
  consultationFee: number;
  
}

interface DoctorDetail extends Doctor {
  bio?: string;
  qualifications?: string[];
  languages?: string[];

  availabilitySlots: string[]; // full array for booking
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
const [slots, setSlots] = useState<Slot[]>([]);

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
            availableSlotsCount:
              typeof d.availableSlotsCount === 'number' ? d.availableSlotsCount : 0,
            nextAvailable: d.nextAvailable || null,
            consultationFee: typeof d.consultationFee === 'number' ? d.consultationFee : 0,
             profileImageUrl: d.profileImageUrl || buildUrl(`/medical/doctor/${id}/profile-image`),
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
        const id2 = d.id || d._id;
        const docDetail: DoctorDetail = {
          id: id2,
          name: d.name,
          specialty: d.specialty || '',
          rating: typeof d.rating === 'number' ? d.rating : 0,
          reviewCount: typeof d.reviewCount === 'number' ? d.reviewCount : 0,
          experience: d.experience || '',
          hospitalAffiliation: d.hospitalAffiliation || '',
          location: d.location || '',
          availableSlotsCount:
            typeof d.availabilitySlots === 'object' && Array.isArray(d.availabilitySlots)
              ? d.availabilitySlots.filter((s: string) => {
                  const dt = new Date(s);
                  return !isNaN(dt.getTime()) && dt > new Date();
                }).length
              : 0,
          nextAvailable:
            Array.isArray(d.availabilitySlots)
              ? (() => {
                  const now = new Date();
                  const future = d.availabilitySlots
                    .map((s: string) => new Date(s))
                    .filter((dt: Date) => !isNaN(dt.getTime()) && dt > now)
                    .sort((a, b) => a.getTime() - b.getTime());
                  return future.length > 0 ? future[0].toISOString() : null;
                })()
              : null,
          consultationFee: typeof d.consultationFee === 'number' ? d.consultationFee : 0,
         
          profileImageUrl: d.profileImageUrl || buildUrl(`/medical/doctor/${id2}/profile-image`),
          bio: d.bio || '',
          qualifications: Array.isArray(d.qualifications)
            ? d.qualifications
            : [],
          languages: Array.isArray(d.languages) ? d.languages : [],
          availabilitySlots: Array.isArray(d.availabilitySlots)
            ? d.availabilitySlots.filter((s: string) => {
                const dt = new Date(s);
                return !isNaN(dt.getTime()) && dt > new Date();
              })
            : [],
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

      <main className="relative z-10 min-h-screen overflow-y-auto text-gray-100">
        <div className="px-6 py-10 mx-auto max-w-7xl sm:px-8 lg:px-10">
          {/* Animated Header */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mb-8 text-center"
          >
            <motion.h1
              className="mb-2 text-4xl font-bold text-transparent md:text-5xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              Find the Right Doctor
            </motion.h1>
            <motion.p
              className="text-lg text-gray-300"
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
  className="p-6 mb-10 border shadow-xl bg-white/10 backdrop-blur-2xl border-white/20 rounded-3xl shadow-indigo-500/10"
>
  <div className="flex flex-col items-center gap-4 md:flex-row">
    {/* Search Input */}
    <div className="relative flex-1 w-full">
      <motion.div
        whileHover={{ scale: 1.03, rotateX: 2, rotateY: -2 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="relative border shadow-md bg-gradient-to-br to-gray-800/60 backdrop-blur-xl border-white/20 rounded-xl"
      >
        <Search
          className="absolute text-gray-300 transform -translate-y-1/2 left-3 top-1/2"
          size={20}
        />
        <Input
          placeholder="Search by name or specialty..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
          className="py-2 pl-10 pr-10 text-black placeholder-gray-400 bg-transparent border-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        <motion.button
          onClick={onSearch}
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.95 }}
          className="absolute text-gray-300 transform -translate-y-1/2 right-3 top-1/2 hover:text-white"
        >
          <Search size={20} />
        </motion.button>
      </motion.div>
    </div>

    {/* Specialty Dropdown */}
    <motion.select
      whileHover={{ scale: 1.05 }}
      value={selectedSpecialty}
      onChange={e => setSelectedSpecialty(e.target.value)}
      className="px-4 py-2 text-white border rounded-lg shadow-md bg-gradient-to-br from-gray-700/40 to-gray-800/60 border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {specialties.map(s => (
        <option key={s} value={s} className="text-white bg-gray-800">
          {s}
        </option>
      ))}
    </motion.select>

    {/* Filters Toggle */}
    <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.97 }}>
      <Button
        variant="outline"
        onClick={() => setShowFilters(f => !f)}
        icon={<Filter size={18} className="text-white" />}
        className="text-white transition-all duration-200 border bg-gradient-to-br from-gray-700/40 to-gray-800/60 border-white/20 hover:shadow-md hover:shadow-indigo-500/30"
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
        className="pt-4 mt-6 border-t border-white/20"
      >
        {/* TODO: Add animated advanced filters here */}
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>


          {/* Results Count */}
          <motion.div variants={fadeInUp} className="mb-4 text-gray-300">
            Showing{' '}
            <span className="font-semibold text-blue-400">{filteredDoctors.length}</span>{' '}
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
    className="p-6 space-y-8 bg-white border border-white bg-opacity-20 backdrop-blur-lg rounded-3xl border-opacity-30"
  >
              {filteredDoctors.map((doctor, idx) => (
                <motion.div
                  key={doctor.id}
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className="overflow-hidden border bg-opacity-60 backdrop-blur-xl rounded-3xl border-gray-700/50"
                >
                  <div className="md:flex">
                    {/* Left: Image */}
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
                    {/* Right: Details */}
                    <div className="flex flex-col flex-1 p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <motion.h2
                            className="text-2xl font-semibold text-white md:text-3xl"
                            whileHover={{ scale: 1.02 }}
                          >
                            Dr. {doctor.name}
                          </motion.h2>
                          <p className="text-indigo-400">{doctor.specialty}</p>
                          {/* Rating */}
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
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-200 bg-green-700 rounded-full"
                          >
                            <Clock size={14} className="mr-1" />
                            {`Next: ${new Date(doctor.nextAvailable).toLocaleString()}`}
                          </motion.div>
                        )}
                      </div>

                      {/* Stats Grid */}
                      <div className="grid flex-1 grid-cols-1 gap-4 mt-4 md:grid-cols-3">
                        <div>
                          <p className="text-sm text-black">Experience </p>
                          <p className="text-gray-100">{doctor.experience} years</p>
                        </div>
                        <div>
                          <p className="text-sm text-black">Hospital</p>
                          <p className="text-gray-100">{doctor.hospitalAffiliation}</p>
                        </div>
                        <div>
                          <p className="text-sm text-black">Location</p>
                          <div className="flex items-center">
                            <MapPin size={14} className="mr-1 text-gray-500" />
                            <p className="text-gray-100">{doctor.location}</p>
                          </div>
                        </div>
                      </div>

                      {/* Fee & Slots */}
                      <div className="flex flex-col gap-4 mt-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm text-black">Consultation Fee</p>
                          <p className="font-medium text-gray-100">₹ {doctor.consultationFee}</p>
                        </div>
                        <div>
                          <p className="text-sm text-black">Slots Available</p>
                          <p className="font-medium text-white">{doctor.availableSlotsCount}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap justify-between gap-4 mt-6">
                        <div className="flex items-center">
                          <Calendar size={18} className="mr-2 text-indigo-400" />
                          <span className="text-gray-400">
                            {doctor.availableSlotsCount} slot{doctor.availableSlotsCount !== 1 ? 's' : ''} available
                          </span>
                        </div>
                        <div className="flex space-x-3">
                          <Button
                            variant="outline"
                            onClick={() => handleViewProfileClick(doctor.id)}
                            className="text-gray-300 border-gray-600 hover:bg-slate-400"
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => handleBookClick(doctor.id)}
                            className={`bg-indigo-600 hover:bg-indigo-700 ${
                              doctor.availableSlotsCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={doctor.availableSlotsCount === 0}
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
              className="py-16 text-center bg-gray-800 border bg-opacity-60 backdrop-blur-xl rounded-3xl border-gray-700/50"
            >
              <Search size={32} className="mx-auto mb-4 text-gray-600" />
              <h3 className="mb-2 text-2xl font-medium text-gray-100">
                No doctors found
              </h3>
              <p className="mb-6 text-gray-400">
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
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[4px]"
      onClick={closeViewProfileModal}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotateX: -30 }}
        animate={{
          opacity: 1,
          scale: 1,
          rotateX: 0,
          transition: {
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1],
            type: 'spring',
            bounce: 0.4,
          },
        }}
        exit={{
          opacity: 0,
          scale: 0.6,
          rotateX: -30,
          transition: { duration: 0.3 },
        }}
        style={{
          perspective: 1000,
        }}
        className="relative w-full max-w-2xl p-8 overflow-hidden text-white transition-all border shadow-2xl rounded-3xl border-white/10 bg-white/5 backdrop-blur-xl ring-1 ring-white/20 hover:ring-pink-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <motion.button
          onClick={closeViewProfileModal}
          whileHover={{ scale: 1.2, rotate: 90 }}
          className="absolute text-gray-300 transition-all top-4 right-4 hover:text-pink-400"
        >
          <X size={22} />
        </motion.button>

        {/* Loading */}
        {profileLoading && <p className="text-center text-gray-300">Loading...</p>}

        {/* Profile Content */}
        {!profileLoading && selectedDoctorProfile && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="space-y-6"
          >
            {selectedDoctorProfile.profileImageUrl && (
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                src={selectedDoctorProfile.profileImageUrl}
                alt={selectedDoctorProfile.name}
                className="object-cover mx-auto rounded-full shadow-lg w-28 h-28 ring-4 ring-pink-500/30"
              />
            )}

            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-bold tracking-wide text-white">
                Dr. {selectedDoctorProfile.name}
              </h2>
              <p className="text-pink-300">{selectedDoctorProfile.specialty}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 text-sm text-gray-200 md:grid-cols-2">
              <div>
                <h3 className="mb-1 font-semibold text-white">Experience</h3>
                <p>{selectedDoctorProfile.experience} years</p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-white">Consultation Fee</h3>
                <p>₹ {selectedDoctorProfile.consultationFee}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="mb-1 font-semibold text-white">Available Slots</h3>
                {selectedDoctorProfile.availabilitySlots.length > 0 ? (
                  <ul className="pl-5 list-disc">
                    {selectedDoctorProfile.availabilitySlots.map((slot, i) => {
                      let disp = slot;
                      try {
                        const dt = new Date(slot);
                        if (!isNaN(dt.getTime())) {
                          disp = dt.toLocaleString();
                        }
                      } catch {}
                      return <li key={i}>{disp}</li>;
                    })}
                  </ul>
                ) : (
                  <p>No upcoming slots</p>
                )}
              </div>

              {selectedDoctorProfile.qualifications?.length > 0 && (
                <div className="md:col-span-2">
                  <h3 className="mb-1 font-semibold text-white">Qualifications</h3>
                  <ul className="pl-5 list-disc">
                    {selectedDoctorProfile.qualifications.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedDoctorProfile.languages?.length > 0 && (
                <div className="md:col-span-2">
                  <h3 className="mb-1 font-semibold text-white">Languages</h3>
                  <p>{selectedDoctorProfile.languages.join(', ')}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {!profileLoading && !selectedDoctorProfile && (
          <p className="text-center text-gray-300">No profile data available.</p>
        )}
      </motion.div>
    </div>
  )}
</AnimatePresence>

        </div>
      </main>

      {/* Floating Chatbot */}
      <div className="fixed z-50 bottom-6 right-6">
        <Chatbot />
      </div>
    </div>
  );
};

export default DoctorsPage1;
