import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Search,
  Clock,
  CheckCircle,
  Users,
  Award,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import {
  SlideIn,
  FadeIn,
  StaggeredContainer,
  staggeredItemVariants,
} from '../../components/animations/Transitions';
import Chatbot from '../../components/common/chatbot/chatbot';

const HomePage: React.FC = () => {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 bg-gradient-to-br from-primary-50 to-secondary-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <SlideIn direction="left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Your Health, <span className="text-primary-500">Our Priority</span>
                </h1>
                <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-lg">
                  Book appointments with top doctors, get digital prescriptions, order medicine, and
                  manage your health record all in one place.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Button as={Link} to="/signup" variant="primary" size="lg">
                    Get Started
                  </Button>
                  <Button as={Link} to="/doctors" variant="outline" size="lg">
                    Find Doctors
                  </Button>
                </div>
                <div className="mt-12 grid grid-cols-3 gap-4">
                  {[
                    { icon: <Users />, title: '10K+', subtitle: 'Patients' },
                    { icon: <Award />, title: '500+', subtitle: 'Doctors' },
                    { icon: <CheckCircle />, title: '98%', subtitle: 'Satisfaction' },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      className="flex flex-col items-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <div className="text-primary-500 mb-2">{stat.icon}</div>
                      <div className="text-2xl font-bold text-gray-900">{stat.title}</div>
                      <div className="text-sm text-gray-500">{stat.subtitle}</div>
                    </motion.div>
                  ))}
                </div>
              </SlideIn>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary-400 to-secondary-400 opacity-30 blur-2xl" />
              <div className="relative bg-white p-6 rounded-2xl shadow-soft overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Doctor with patient"
                  className="w-full h-auto rounded-lg"
                />

                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="absolute left-0 bottom-20 transform -translate-y-1/2"
                >
                  <div className="bg-white rounded-r-lg shadow-soft p-4 flex items-center space-x-3 max-w-xs">
                    <div className="bg-success-100 p-2 rounded-full text-success-600">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Appointment Confirmed</p>
                      <p className="text-sm text-gray-500">Dr. Sarah Johnson, 10:30 AM</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute right-0 top-20 transform -translate-y-1/2"
                >
                  <div className="bg-white rounded-l-lg shadow-soft p-4 max-w-xs">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="bg-primary-100 p-2 rounded-full text-primary-600">
                        <Calendar size={20} />
                      </div>
                      <p className="font-medium text-gray-900">Available Time Slots</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['9:00', '10:30', '11:45'].map((time, i) => (
                        <div key={i} className="bg-gray-100 rounded px-2 py-1 text-xs text-center text-gray-700">
                          {time}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary-200 rounded-full opacity-20 blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
              <p className="mt-4 text-xl text-gray-600">
                We've simplified the process of finding and booking appointments with healthcare professionals.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              { icon: <Search className="w-8 h-8 text-primary-500" />, title: 'Find Doctors', description: 'Search for specialists based on specialty, location, availability, and patient reviews.', delay: 0 },
              { icon: <Calendar className="w-8 h-8 text-primary-500" />, title: 'Book Appointments', description: 'Select a convenient time slot and book your appointment in just a few clicks.', delay: 0.2 },
              { icon: <Clock className="w-8 h-8 text-primary-500" />, title: 'Get Care', description: 'Visit the doctor at the scheduled time or connect via video consultation.', delay: 0.4 },
            ].map((feature, index) => (
              <SlideIn key={index} direction="up" delay={feature.delay}>
                <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-subtle h-full transition-all duration-300 hover:shadow-soft hover:border-primary-200 hover:-translate-y-1">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-50 rounded-lg mb-5">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="py-20 bg-gray-50">
        {/* ...specialties content as before... */}
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        {/* ...testimonials content as before... */}
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="mb-8 lg:mb-0">
              <FadeIn>
                <h2 className="text-3xl font-bold text-white mb-4">Ready to prioritize your health?</h2>
                <p className="text-xl text-white opacity-90 max-w-xl">
                  Join thousands of patients who have simplified their healthcare journey with MedBook.
                </p>
              </FadeIn>
            </div>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <SlideIn direction="right">
                <Button as={Link} to="/signup" variant="primary" size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                  Sign Up Now
                </Button>
                <Button as={Link} to="/how-it-works" variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
                  Learn More
                </Button>
              </SlideIn>
            </div>
          </div>
        </div>
        <Chatbot />
      </section>
    </main>
  );
};

export default HomePage;
