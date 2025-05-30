import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, Calendar, MapPin, Clock, X } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  FadeIn,
  StaggeredContainer,
  staggeredItemVariants,
} from '../../components/animations/Transitions';
import Chatbot from '../../components/common/chatbot/chatbot';

// Mock data for doctors
const mockDoctors = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    rating: 4.9,
    reviewCount: 124,
    experience: '15 years',
    hospitalAffiliation: 'Memorial Hospital',
    location: 'New York, NY',
    availableSlots: 5,
    nextAvailable: 'Tomorrow',
    image:
      'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  },
  // More doctors
];

// Mock specialties
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [showFilters, setShowFilters] = useState(false);
  const [bookingDoctorId, setBookingDoctorId] = useState<string | null>(null);
  const [viewingDoctorId, setViewingDoctorId] = useState<string | null>(null);

  // Booking form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    bloodGroup: '',
  });

  // Filtering logic
  const filteredDoctors = mockDoctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === 'All Specialties' ||
      doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const handleBookClick = (doctorId: string) => {
    setBookingDoctorId(doctorId);
  };

  const closeBookingForm = () => {
    setBookingDoctorId(null);
    setFormData({ name: '', phone: '', email: '', message: '', bloodGroup: '' });
  };

  const handleViewProfileClick = (doctorId: string) => {
    setViewingDoctorId(doctorId);
  };

  const closeViewProfileModal = () => {
    setViewingDoctorId(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Booking request:', { doctorId: bookingDoctorId, ...formData });
    closeBookingForm();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find the Right Doctor
          </h1>
          <p className="text-gray-600 text-lg">
            Search for specialists, read reviews, and book appointments
          </p>
        </div>
      </FadeIn>

      {/* Search & Filters */}
      <motion.div
        variants={FadeIn.variants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8"
      >
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Search by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              fullWidth
            />
          </div>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="appearance-none px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={() => setShowFilters((prev) => !prev)}
            icon={<Filter size={18} />}
          >
            Filters
          </Button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 pt-4 border-t border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability
                </label>
                <select className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none">
                  <option>Any time</option>
                  <option>Today</option>
                  <option>Tomorrow</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance
                </label>
                <select className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none">
                  <option>Any distance</option>
                  <option>Within 5 miles</option>
                  <option>Within 10 miles</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <select className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none">
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
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSpecialty('All Specialties');
                  setShowFilters(false);
                }}
              >
                Reset
              </Button>
              <Button variant="primary" size="sm">
                Apply
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Results */}
      <div className="mb-4 text-gray-600">
        Showing {filteredDoctors.length} doctor(s)
        {selectedSpecialty !== 'All Specialties' && ` in ${selectedSpecialty}`}
      </div>

      {/* Doctor List */}
      <StaggeredContainer>
        <div className="space-y-8">
          {filteredDoctors.map((doctor) => (
            <motion.div
              key={doctor.id}
              variants={staggeredItemVariants}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
            >
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
                      <h2 className="text-2xl font-semibold text-gray-900">
                        {doctor.name}
                      </h2>
                      <p className="text-primary-600">
                        {doctor.specialty}
                      </p>
                      <div className="flex items-center mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            fill={i < Math.floor(doctor.rating) ? 'currentColor' : 'none'}
                            className={i < Math.floor(doctor.rating) ? 'text-yellow-500' : 'text-gray-300'}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {doctor.rating} ({doctor.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      <Clock size={14} className="mr-1" />
                      Available {doctor.nextAvailable}
                    </motion.div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 flex-1">
                    <div>
                      <p className="text-sm text-gray-500">Experience</p>
                      <p className="text-gray-900">{doctor.experience}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hospital</p>
                      <p className="text-gray-900">{doctor.hospitalAffiliation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <div className="flex items-center">
                        <MapPin size={14} className="text-gray-400 mr-1" />
                        <p className="text-gray-900">{doctor.location}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap justify-between gap-4">
                    <div className="flex items-center">
                      <Calendar size={18} className="text-primary-500 mr-2" />
                      <span className="text-gray-600">
                        {doctor.availableSlots} slots available this week
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => handleViewProfileClick(doctor.id)}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleBookClick(doctor.id)}
                      >
                        Book Appointment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </StaggeredContainer>

      {/* Empty State */}
      {filteredDoctors.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200"
        >
          <Search size={32} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-2xl font-medium text-gray-900 mb-2">
            No doctors found
          </h3>
          <p className="text-gray-600 mb-6">
            We couldn't find any doctors. Try different keywords or filters.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedSpecialty('All Specialties');
              setShowFilters(false);
            }}
          >
            Clear Filters
          </Button>
        </motion.div>
      )}

      {/* Booking Modal */}
      {bookingDoctorId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 relative"
          >
            <button
              onClick={closeBookingForm}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Book Appointment
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                fullWidth
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                fullWidth
              />
              <Input
                label="Email (optional)"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
              />
              <div>
                <label
                  htmlFor="bloodGroup"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Blood Group
                </label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="">Select blood group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
               <div>
                <label
                  htmlFor="bloodGroup"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Time Slots
                </label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="">Select Time Slots</option>
                  {['10:00 a.m - 12:00 p.m', '3:00 p.m  -  6:00 p.m'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Additional info..."
                />
              </div>
              <Button type="submit" variant="primary" fullWidth>
                Confirm Booking
              </Button>
            </form>
          </motion.div>
        </div>
      )}

      {/* View Profile Modal */}
      {viewingDoctorId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 relative"
          >
            <button
              onClick={closeViewProfileModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            {filteredDoctors
              .filter((doctor) => doctor.id === viewingDoctorId)
              .map((doctor) => (
                <div key={doctor.id}>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    {doctor.name}'s Profile
                  </h2>
                  <div className="flex gap-6">
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="w-36 h-36 rounded-full object-cover"
                    />
                    <div className="space-y-4">
                      <p className="text-lg font-medium">{doctor.specialty}</p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={20}
                            fill={i < Math.floor(doctor.rating) ? 'currentColor' : 'none'}
                            className={i < Math.floor(doctor.rating) ? 'text-yellow-500' : 'text-gray-300'}
                          />
                        ))}
                        <span className="ml-2">{doctor.rating} ({doctor.reviewCount} reviews)</span>
                      </div>
                      <p className="text-gray-700">Experience: {doctor.experience}</p>
                      <p className="text-gray-700">Hospital: {doctor.hospitalAffiliation}</p>
                      <p className="text-gray-700">Location: {doctor.location}</p>
                      <p className="text-gray-700">Next Available: {doctor.nextAvailable}</p>
                    </div>
                  </div>
                </div>
              ))}
          </motion.div>
        </div>
      )}

      <Chatbot />
    </div>
  );
};

export default DoctorsPage;
