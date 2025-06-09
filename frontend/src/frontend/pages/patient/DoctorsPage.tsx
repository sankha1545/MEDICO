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

  const [bookingDoctorId, setBookingDoctorId] = useState<string | null>(null);
  const [viewingDoctorId, setViewingDoctorId] = useState<string | null>(null);
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState<DoctorDetail | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    bloodGroup: '',
    timeSlot: '',
  });

  // New: rating input
  const [userRating, setUserRating] = useState<number>(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Fetch doctors list
  useEffect(() => {
    axios
      .get<Doctor[]>(`${import.meta.env.VITE_API_URL}/medical/doctors`)
      .then(res => {
        setDoctors(res.data);
        setFilteredDoctors(res.data);
      })
      .catch(err => console.error('Error fetching doctors:', err));
  }, []);

  // Filter by searchTerm & specialty
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Booking handlers (unchanged)
  const handleBookClick = (id: string) => setBookingDoctorId(id);
  const closeBookingForm = () => {
    setBookingDoctorId(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      message: '',
      bloodGroup: '',
      timeSlot: '',
    });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Booking:', { doctorId: bookingDoctorId, ...formData });
    closeBookingForm();
  };

  // View profile handlers (unchanged except reset rating)
  const handleViewProfileClick = (id: string) => {
    setViewingDoctorId(id);
    setProfileLoading(true);
    setSelectedDoctorProfile(null);
    setUserRating(0);
    axios
      .get<DoctorDetail>(`${import.meta.env.VITE_API_URL}/medical/doctors/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then(res => setSelectedDoctorProfile(res.data))
      .catch(err => console.error('Error loading profile:', err))
      .finally(() => setProfileLoading(false));
  };
  const closeViewProfileModal = () => {
    setViewingDoctorId(null);
    setSelectedDoctorProfile(null);
    setUserRating(0);
  };

  // Search button or Enter
  const onSearch = () => setSearchTerm(searchInput);

  // Submit rating
  const submitRating = () => {
    if (!viewingDoctorId || userRating < 1 || userRating > 5) return;
    setRatingSubmitting(true);
    axios
      .post(
        `${import.meta.env.VITE_API_URL}/medical/doctors/${viewingDoctorId}/rate`,
        { rating: userRating },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      .then(res => {
        // update selectedDoctorProfile rating & count
        setSelectedDoctorProfile(prev =>
          prev
            ? { ...prev, rating: res.data.rating, reviewCount: res.data.reviewCount }
            : prev
        );
      })
      .catch(err => console.error('Error submitting rating:', err))
      .finally(() => setRatingSubmitting(false));
  };

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
                style={{ color: '#000' }}
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
                {/* Filters panel (unchanged) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Availability
                    </label>
                    <select className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                      <option>Any time</option>
                      <option>Today</option>
                      <option>Tomorrow</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Distance
                    </label>
                    <select className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                      <option>Any distance</option>
                      <option>Within 5 miles</option>
                      <option>Within 10 miles</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Rating
                    </label>
                    <select className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                      <option>Any rating</option>
                      <option>4+ stars</option>
                      <option>3+ stars</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:bg-gray-700"
                    onClick={() => {
                      setSearchInput('');
                      setSearchTerm('');
                      setSelectedSpecialty('All Specialties');
                      setShowFilters(false);
                    }}
                  >
                    Reset
                  </Button>
                  <Button variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    Apply
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        <motion.div variants={fadeInUp} className="mb-4 text-gray-400">
          Showing {filteredDoctors.length} doctor
          {filteredDoctors.length !== 1 ? 's' : ''}{' '}
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
                {/* Card content unchanged (image, name, specialty, avg rating, etc.) */}
                <div className="md:flex">
                  
                  <div className="md:w-1/4 lg:w-1/5">
                  
                    <motion.img
                      src={doctor.image}
                       alt={doctor.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="w-full h-56 md:h-full object-cover"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-semibold text-white">{doctor.name}</h2>
                        <p className="text-indigo-400">{doctor.specialty}</p>
                        <div className="flex items-center mt-2">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              size={16}
                              fill={i < Math.floor(doctor.rating) ? 'currentColor' : 'none'}
                              className={i < Math.floor(doctor.rating) ? 'text-yellow-500' : 'text-gray-600'}
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

        {/* Booking Modal (unchanged) */}
        <AnimatePresence>
          {bookingDoctorId && (
            /* ... your existing booking form ... */
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
              {/* ... */}
            </div>
          )}
        </AnimatePresence>

        {/* Profile & Rating Modal */}
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

                {profileLoading ? (
                  <div className="text-center py-16 text-gray-400">Loading profile…</div>
                ) : selectedDoctorProfile ? (
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-4">
                      {selectedDoctorProfile.name}’s Profile
                    </h2>
                    <div className="flex gap-6 mb-6">
                      <img
                        src={selectedDoctorProfile.image}
                        alt={selectedDoctorProfile.name}
                        className="w-36 h-36 rounded-full object-cover border-2 border-gray-700"
                      />
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-indigo-400">
                          {selectedDoctorProfile.specialty}
                        </p>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              size={20}
                              fill={
                                i < Math.floor(selectedDoctorProfile.rating)
                                  ? 'currentColor'
                                  : 'none'
                              }
                              className={
                                i < Math.floor(selectedDoctorProfile.rating)
                                  ? 'text-yellow-500'
                                  : 'text-gray-600'
                              }
                            />
                          ))}
                          <span className="ml-2 text-gray-300">
                            {selectedDoctorProfile.rating} (
                            {selectedDoctorProfile.reviewCount} reviews)
                          </span>
                        </div>
                        <p className="text-gray-300">
                          Experience: {selectedDoctorProfile.experience}
                        </p>
                        <p className="text-gray-300">
                          Hospital: {selectedDoctorProfile.hospitalAffiliation}
                        </p>
                        <p className="text-gray-300">
                          Location: {selectedDoctorProfile.location}
                        </p>
                        <p className="text-gray-300">
                          Next Available: {selectedDoctorProfile.nextAvailable}
                        </p>
                      </div>
                    </div>

                    {/* Star Rating Input */}
                    <div className="mb-4">
                      <p className="text-gray-200 mb-1">Your Rating:</p>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <StarIcon
                            key={i}
                            size={28}
                            onClick={() => !ratingSubmitting && setUserRating(i)}
                            fill={i <= userRating ? 'currentColor' : 'none'}
                            className={
                              i <= userRating ? 'cursor-pointer text-yellow-500' : 'cursor-pointer text-gray-600'
                            }
                          />
                        ))}
                      </div>
                      <Button
                        onClick={submitRating}
                        disabled={ratingSubmitting || userRating < 1}
                        className="mt-3 bg-indigo-600 hover:bg-indigo-700"
                      >
                        {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                      </Button>
                    </div>

                    {/* About / Qualifications / Languages */}
                    {selectedDoctorProfile.bio && (
                      <>
                        <h3 className="text-white font-medium">About</h3>
                        <p className="text-gray-300 mb-4">{selectedDoctorProfile.bio}</p>
                      </>
                    )}
                    {selectedDoctorProfile.qualifications?.length > 0 && (
                      <>
                        <h3 className="text-white font-medium">Qualifications</h3>
                        <ul className="list-disc list-inside text-gray-300 mb-4">
                          {selectedDoctorProfile.qualifications.map((q) => (
                            <li key={q}>{q}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {selectedDoctorProfile.languages?.length > 0 && (
                      <p className="text-gray-300 mb-4">
                        Languages: {selectedDoctorProfile.languages.join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-400">Unable to load profile.</div>
                )}
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
