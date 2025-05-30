import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Calendar, ArrowLeft, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface DoctorProfile {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  experience: number;
  hospital: string;
  location: string;
  avatarUrl: string;
  availability: string;
  slotsThisWeek: number;
  about: string;
}

// Example data; replace with API call
const mockProfile: DoctorProfile = {
  id: '1',
  name: 'Dr. Sarah Johnson',
  specialty: 'Cardiologist',
  rating: 4.9,
  reviews: 124,
  experience: 15,
  hospital: 'Memorial Hospital',
  location: 'New York, NY',
  avatarUrl:
    'https://images.unsplash.com/photo-1580281657521-5f67c05d77a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60',
  availability: 'Available Tomorrow',
  slotsThisWeek: 5,
  about:
    'Dr. Sarah Johnson is a board-certified cardiologist with over 15 years of experience. She specializes in interventional cardiology and preventive care. Passionate about patient education and innovative treatments, she has published numerous papers in leading medical journals.',
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // In real app, fetch data by id
  const doctor = mockProfile;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto my-12 p-6 bg-white rounded-2xl shadow-lg"
    >
      <button
        onClick={() => navigate('/doctors')}
        className="flex items-center text-blue-600 hover:underline mb-4"
      >
        <ArrowLeft size={20} /> Back to Doctors
      </button>

      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <motion.img
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          src={doctor.avatarUrl}
          alt={doctor.name}
          className="w-40 h-40 rounded-full object-cover shadow-md"
        />

        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-bold text-gray-800">
            {doctor.name}
          </h1>
          <p className="text-lg text-blue-600">{doctor.specialty}</p>

          <div className="flex items-center gap-2">
            <Star size={18} className="text-yellow-500" />
            <span className="font-semibold">{doctor.rating.toFixed(1)}</span>
            <span className="text-gray-500">({doctor.reviews} reviews)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span>{doctor.experience} years experience</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>{doctor.slotsThisWeek} slots this week</span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={18} />
              <span>{doctor.hospital}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span>{doctor.location}</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="inline-block px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full"
          >
            {doctor.availability}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="text-gray-600 mt-4"
          >
            {doctor.about}
          </motion.p>

          <div className="mt-6 flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              Book Appointment
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Message Doctor
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
