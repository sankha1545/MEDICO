import React, { useState, useEffect } from 'react';
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
import axios from 'axios';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import Chatbot from '../../components/common/chatbot/chatbot';
import BookAppointment from '../../components/common/bookappointment/bookappointment';

// Framer Motion variants
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
  image: string;
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

const DoctorsPage: React.FC = () => {
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

  // Fetch doctors list on mount
  useEffect(() => {
    axios
      .get<Doctor[]>(`${import.meta.env.VITE_API_URL}/medical/doctors`)
      .then(res => {
        setDoctors(res.data);
        setFilteredDoctors(res.data);
      })
      .catch(err => console.error('Error fetching doctors:', err));
  }, []);

  // Apply search & specialty filters
  useEffect(() => {
    const term = searchTerm.toLowerCase();
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

  const onSearch = () => setSearchTerm(searchInput);

  const handleViewProfileClick = (id: string) => {
    setViewingDoctorId(id);
    setProfileLoading(true);
    setSelectedDoctorProfile(null);

    axios
      .get<DoctorDetail>(`${import.meta.env.VITE_API_URL}/medical/doctors/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      })
      .then(res => setSelectedDoctorProfile(res.data))
      .catch(err => console.error('Error loading profile:', err))
      .finally(() => setProfileLoading(false));
  };

  const closeViewProfileModal = () => {
    setViewingDoctorId(null);
    setSelectedDoctorProfile(null);
  };

  // When user clicks Book Appointment, open the imported form for that doctor
  const handleBookClick = (id: string) => setBookingDoctorId(id);
  const closeBookingForm = () => setBookingDoctorId(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-gray-100 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10">
        {/* Header */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Find the Right Doctor</h1>
          <p className="text-gray-400 text-lg">
            Search for specialists, read reviews, and book appointments
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6 mb-10"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Input
                placeholder="Search by name or specialty..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSearch()}
                className="pl-10 bg-gray-700 text-gray-100 border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                fullWidth
              />
              <button
                onClick={onSearch}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                <Search size={20} />
              </button>
            </div>

            <select
              value={selectedSpecialty}
              onChange={e => setSelectedSpecialty(e.target.value)}
              className="appearance-none px-4 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              {specialties.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={() => setShowFilters(prev => !prev)}
              icon={<Filter size={18} className="text-gray-300" />}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
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
                className="mt-6 pt-4 border-t border-gray-700"
              >
                {/* Filters panel - keep as is */}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        <motion.div variants={fadeInUp} className="mb-4 text-gray-400">
          Showing {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}{' '}
          {selectedSpecialty !== 'All Specialties' && `in ${selectedSpecialty}`}
        </motion.div>

        {/* Doctor List */}
        {filteredDoctors.length > 0 ? (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
            {filteredDoctors.map((doctor, idx) => (
              <motion.div
                key={doctor.id}
                custom={idx}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden"
              >
                <div className="md:flex">
                  {/* Doctor info left */}
                  <div className="md:w-1/4 lg:w-1/5">
                    <motion.img
                      src={doctor.image}
                      alt={doctor.name}
                      className="w-full h-56 md:h-full object-cover"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-semibold text-white">Dr. {doctor.name}</h2>
                        <p className="text-indigo-400">{doctor.specialty}</p>
                        <div className="flex items-center mt-2">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              size={16}
                              fill={i < Math.floor(doctor.rating) ? 'currentColor' : 'none'}
                              className={
                                i < Math.floor(doctor.rating) ? 'text-yellow-500' : 'text-gray-600'
                              }
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-400">
                            {doctor.rating} ({doctor.reviewCount} reviews)
                          </span>
                        </div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-700 text-green-200"
                      >
                        <Clock size={14} className="mr-1" />
                        Available {doctor.nextAvailable}
                      </motion.div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 flex-1">
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
                        <span className="text-gray-400">{doctor.availableSlots} slots available</span>
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
          <motion.div variants={fadeInUp} className="text-center py-16 bg-gray-800 rounded-2xl border border-gray-700">
            <Search size={32} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-2xl font-medium text-gray-100 mb-2">No doctors found</h3>
            <p className="text-gray-400 mb-6">
              We couldn't find any doctors. Try different keywords or filters.
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

        {/* Imported Booking Form */}
        <AnimatePresence>
          {bookingDoctorId && (
            <BookAppointment doctorId={bookingDoctorId} onClose={closeBookingForm} />
          )}
        </AnimatePresence>

        {/* Profile Modal (unchanged) */}
        <AnimatePresence>
          {viewingDoctorId && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-800 rounded-2xl shadow-lg w-full max-w-lg p-6 relative border border-gray-700"
              >
                <button
                  onClick={closeViewProfileModal}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
                >
                  <X size={20} />
                </button>
                {/* Profile content here */}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <Chatbot />
      </div>
    </main>
  );
};

export default DoctorsPage;