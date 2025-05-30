import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  FileText,
  UserCheck,
  DollarSign,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import {
  SlideIn,
  FadeIn,
  StaggeredContainer,
  staggeredItemVariants,
} from '../../components/animations/Transitions';
import Chatbot from '../../components/common/chatbot/chatbot';

const DoctorHomePage: React.FC = () => {
  const stats = [
    { icon: <Calendar />, title: '8', subtitle: 'Upcoming Appointments' },
    { icon: <Users />, title: '120', subtitle: 'Total Patients' },
    { icon: <DollarSign />, title: '$5.2K', subtitle: 'Earnings This Month' },
  ];

  const appointments = [
    {
      patient: 'John Doe',
      time: '10:00 AM',
      date: 'May 20, 2025',
      type: 'In-Person',
    },
    {
      patient: 'Jane Smith',
      time: '11:30 AM',
      date: 'May 20, 2025',
      type: 'Video',
    },
    {
      patient: 'Mike Johnson',
      time: '2:00 PM',
      date: 'May 20, 2025',
      type: 'In-Person',
    },
  ];

  const recentPatients = ['Emily Clark', 'Samuel Lee', 'Olivia Brown'];

  return (
    <main>
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 bg-gradient-to-br from-secondary-50 to-primary-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SlideIn direction="left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Welcome Back, <span className="text-secondary-500">Dr. Smith</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-lg">
              Here’s a quick overview of your schedule and patients. Stay on top of your appointments and manage your practice effortlessly.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button as={Link} to="/appointments" variant="primary" size="lg">
                View All Appointments
              </Button>
              <Button as={Link} to="/patients" variant="outline" size="lg">
                View Patients
              </Button>
            </div>
          </SlideIn>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                className="bg-white rounded-xl shadow-subtle p-6 flex items-center space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
              >
                <div className="text-secondary-500">{stat.icon}</div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stat.title}</div>
                  <div className="text-sm text-gray-500">{stat.subtitle}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Appointments Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-gray-900">Upcoming Appointments</h2>
              <p className="mt-4 text-xl text-gray-600">
                Here are your next appointments. Keep track and be prepared.
              </p>
            </div>
          </FadeIn>

          <div className="space-y-4">
            {appointments.map((appt, i) => (
              <motion.div
                key={i}
                className="bg-secondary-50 border border-gray-100 rounded-xl p-6 flex justify-between items-center"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <div>
                  <div className="text-lg font-semibold text-gray-900">{appt.patient}</div>
                  <div className="text-sm text-gray-500">
                    {appt.date} at {appt.time} ({appt.type})
                  </div>
                </div>
                <Button as={Link} to={`/appointments/${i}`} variant="outline" size="sm">
                  Details
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Patients Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-gray-900">Recent Patients</h2>
              <p className="mt-4 text-xl text-gray-600">
                Patients you’ve recently consulted. Review their records quickly.
              </p>
            </div>
          </FadeIn>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-8"
            variants={StaggeredContainer}
            initial="hidden"
            animate="show"
          >
            {recentPatients.map((name, idx) => (
              <motion.div
                key={idx}
                className="bg-white border border-gray-100 rounded-xl p-8 shadow-subtle"
                variants={staggeredItemVariants}
              >
                <div className="inline-flex items-center justify-center p-3 bg-secondary-100 rounded-lg mb-5">
                  <UserCheck className="w-6 h-6 text-secondary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{name}</h3>
                <Button as={Link} to={`/patients/${idx}`} variant="link" size="sm">
                  View Record
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-secondary-500 to-primary-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="mb-8 lg:mb-0">
              <FadeIn>
                <h2 className="text-3xl font-bold text-white mb-4">Need Assistance?</h2>
                <p className="text-xl text-white opacity-90 max-w-xl">
                  If you have any questions or need support, our team is here to help you 24/7.
                </p>
              </FadeIn>
            </div>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <SlideIn direction="right">
                <Button as={Link} to="/support" variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
                  Contact Support
                </Button>
                <Button as={Link} to="/settings" variant="primary" size="lg">
                  Manage Profile
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

export default DoctorHomePage;