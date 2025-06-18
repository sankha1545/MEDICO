import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Brain, Eye, Stethoscope, Baby, Bluetooth as Tooth, Activity, Shield, Clock, Award, Users, Star, ArrowRight, CheckCircle } from 'lucide-react';
import { BackgroundAnimation } from '../../components/animations/BackGroundAnimations';
import { Button } from '../../components/common/Button';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
  price: string;
  duration: string;
  rating: number;
  bookings: number;
  availability: 'available' | 'limited' | 'busy';
}

const services: Service[] = [
  {
    id: '1',
    title: 'General Consultation',
    description: 'Comprehensive health checkups and primary care consultations with experienced physicians.',
    icon: <Stethoscope className="w-8 h-8" />,
    color: 'from-blue-500 to-cyan-500',
    features: ['Health Screening', 'Preventive Care', 'Chronic Disease Management', 'Health Reports'],
    price: '$75',
    duration: '30 min',
    rating: 4.8,
    bookings: 1250,
    availability: 'available',
  },
  {
    id: '2',
    title: 'Cardiology',
    description: 'Advanced cardiac care including diagnostics, treatment, and rehabilitation services.',
    icon: <Heart className="w-8 h-8" />,
    color: 'from-red-500 to-pink-500',
    features: ['ECG & Echo', 'Cardiac Catheterization', 'Heart Surgery', 'Rehabilitation'],
    price: '$150',
    duration: '45 min',
    rating: 4.9,
    bookings: 890,
    availability: 'limited',
  },
  {
    id: '3',
    title: 'Neurology',
    description: 'Specialized care for neurological conditions and brain health disorders.',
    icon: <Brain className="w-8 h-8" />,
    color: 'from-purple-500 to-indigo-500',
    features: ['Brain Imaging', 'Stroke Care', 'Epilepsy Treatment', 'Memory Disorders'],
    price: '$200',
    duration: '60 min',
    rating: 4.9,
    bookings: 567,
    availability: 'busy',
  },
  {
    id: '4',
    title: 'Pediatric Care',
    description: 'Comprehensive healthcare services for infants, children, and adolescents.',
    icon: <Baby className="w-8 h-8" />,
    color: 'from-green-500 to-emerald-500',
    features: ['Vaccinations', 'Growth Monitoring', 'Pediatric Surgery', 'Development Assessment'],
    price: '$90',
    duration: '30 min',
    rating: 4.7,
    bookings: 2100,
    availability: 'available',
  },
  {
    id: '5',
    title: 'Ophthalmology',
    description: 'Complete eye care services including vision correction and eye surgery.',
    icon: <Eye className="w-8 h-8" />,
    color: 'from-yellow-500 to-orange-500',
    features: ['Vision Testing', 'Cataract Surgery', 'Retinal Care', 'LASIK Surgery'],
    price: '$120',
    duration: '40 min',
    rating: 4.8,
    bookings: 780,
    availability: 'available',
  },
  {
    id: '6',
    title: 'Dental Services',
    description: 'Comprehensive dental care from routine cleanings to advanced procedures.',
    icon: <Tooth className="w-8 h-8" />,
    color: 'from-teal-500 to-cyan-500',
    features: ['Dental Cleaning', 'Root Canal', 'Cosmetic Dentistry', 'Orthodontics'],
    price: '$85',
    duration: '45 min',
    rating: 4.6,
    bookings: 1450,
    availability: 'available',
  },
];

// Enhanced Motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2 
    } 
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
  },
};

const cardHover = {
  scale: 1.05,
  y: -15,
  boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
  transition: { duration: 0.3, ease: 'easeOut' }
};

const ServicesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredServices, setFilteredServices] = useState(services);

  const categories = [
    { id: 'all', name: 'All Services', count: services.length },
    { id: 'consultation', name: 'Consultation', count: 2 },
    { id: 'surgery', name: 'Surgery', count: 3 },
    { id: 'diagnostics', name: 'Diagnostics', count: 4 },
  ];

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-400 bg-green-500/20';
      case 'limited': return 'text-yellow-400 bg-yellow-500/20';
      case 'busy': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'available': return 'Available Today';
      case 'limited': return 'Limited Slots';
      case 'busy': return 'Next Week';
      default: return 'Check Availability';
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundAnimation />
      
      <main className="relative z-10 min-h-screen text-gray-100 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12"
          >
            {/* Enhanced Header */}
            <motion.div variants={itemVariants} className="text-center mb-16">
              <motion.h1 
                className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                Medical Services
              </motion.h1>
              <motion.p 
                className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Comprehensive healthcare solutions powered by cutting-edge technology 
                and delivered by world-class medical professionals
              </motion.p>
              
              {/* Stats */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {[
                  { label: 'Expert Doctors', value: '500+', icon: <Users size={24} /> },
                  { label: 'Services Available', value: '50+', icon: <Activity size={24} /> },
                  { label: 'Happy Patients', value: '10K+', icon: <Heart size={24} /> },
                  { label: 'Years Experience', value: '25+', icon: <Award size={24} /> },
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + idx * 0.1, type: 'spring', stiffness: 200 }}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                  >
                    <div className="text-blue-400 mb-2 flex justify-center">{stat.icon}</div>
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Category Filter */}
            <motion.div variants={itemVariants} className="flex justify-center mb-12">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
                <div className="flex space-x-2">
                  {categories.map((category) => (
                    <motion.button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-6 py-3 rounded-xl transition-all duration-300 ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {category.name}
                      <span className="ml-2 text-xs opacity-70">({category.count})</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Services Grid */}
            <motion.div 
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  variants={itemVariants}
                  whileHover={cardHover}
                  className="group relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden"
                >
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  {/* Card Content */}
                  <div className="relative z-10 p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-lg`}
                      >
                        {service.icon}
                      </motion.div>
                      
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(service.availability)}`}>
                          <Clock size={12} className="mr-1" />
                          {getAvailabilityText(service.availability)}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-white mb-3">{service.title}</h3>
                    <p className="text-gray-400 mb-6 leading-relaxed">{service.description}</p>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {service.features.map((feature, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center text-sm text-gray-300"
                        >
                          <CheckCircle size={14} className={`mr-3 text-green-400`} />
                          {feature}
                        </motion.div>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-6 text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Star size={14} className="text-yellow-400 mr-1" />
                          <span className="text-white font-medium">{service.rating}</span>
                        </div>
                        <div className="text-gray-400">
                          {service.bookings} bookings
                        </div>
                      </div>
                      <div className="text-gray-400">
                        {service.duration}
                      </div>
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-white">{service.price}</span>
                        <span className="text-gray-400 text-sm ml-1">per session</span>
                      </div>
                      
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="gradient"
                          size="sm"
                          className={`bg-gradient-to-r ${service.color} group`}
                        >
                          Book Now
                          <motion.div
                            className="ml-2 group-hover:translate-x-1 transition-transform"
                          >
                            <ArrowRight size={16} />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={false}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Section */}
            <motion.div 
              variants={itemVariants}
              className="text-center mt-20"
            >
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-3xl border border-blue-400/30 p-12">
                <motion.h2 
                  className="text-4xl md:text-5xl font-bold text-white mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  Ready to Experience the Future of Healthcare?
                </motion.h2>
                <motion.p
                  className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  Join thousands of patients who trust MedicoX for their healthcare needs. 
                  Book your appointment today and take the first step towards better health.
                </motion.p>
                <motion.div
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="gradient" 
                      size="lg" 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 group"
                    >
                      Glimpse
                      <motion.span
                        className="ml-2 group-hover:translate-x-1 transition-transform"
                      >
                        <ArrowRight size={20} />
                      </motion.span>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Learn More
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            {/* Floating Medical Icons */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              {[Heart, Brain, Eye, Stethoscope].map((Icon, index) => (
                <motion.div
                  key={index}
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 10, 0],
                    opacity: [0.1, 0.3, 0.1],
                  }}
                  transition={{
                    duration: 4 + index,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.5,
                  }}
                  className={`absolute text-blue-400/20 ${
                    index === 0 ? 'top-1/4 left-1/4' :
                    index === 1 ? 'top-1/3 right-1/4' :
                    index === 2 ? 'bottom-1/3 left-1/3' :
                    'bottom-1/4 right-1/3'
                  }`}
                >
                  <Icon size={60} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ServicesPage;