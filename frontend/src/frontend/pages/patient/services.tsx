import React from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Heart, Brain, Eye, Stethoscope, Baby, Bluetooth as Tooth } from 'lucide-react';
import { Background3D } from '../../components/animations/3D/FloatingElements';
import { ParticleBackground } from '../../components/animations/ParticleField';
import { AnimatedCard } from '../../components/ui/AnimatedCard';
import { NeonButton } from '../../components/ui/NeonButton';
import { GlowingText } from '../../components/animations/GlowingText';

const ServicesPage: React.FC = () => {
  const services = [
    {
      title: 'General Consultation',
      description: 'Comprehensive health checkups and primary care consultations with experienced physicians.',
      icon: <Stethoscope className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
      features: ['Health Screening', 'Preventive Care', 'Chronic Disease Management']
    },
    {
      title: 'Cardiology',
      description: 'Advanced cardiac care including diagnostics, treatment, and rehabilitation services.',
      icon: <Heart className="w-8 h-8" />,
      color: 'from-red-500 to-pink-500',
      features: ['ECG & Echo', 'Cardiac Catheterization', 'Heart Surgery']
    },
    {
      title: 'Neurology',
      description: 'Specialized care for neurological conditions and brain health disorders.',
      icon: <Brain className="w-8 h-8" />,
      color: 'from-purple-500 to-indigo-500',
      features: ['Brain Imaging', 'Stroke Care', 'Epilepsy Treatment']
    },
    {
      title: 'Pediatric Care',
      description: 'Comprehensive healthcare services for infants, children, and adolescents.',
      icon: <Baby className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-500',
      features: ['Vaccinations', 'Growth Monitoring', 'Pediatric Surgery']
    },
    {
      title: 'Ophthalmology',
      description: 'Complete eye care services including vision correction and eye surgery.',
      icon: <Eye className="w-8 h-8" />,
      color: 'from-yellow-500 to-orange-500',
      features: ['Vision Testing', 'Cataract Surgery', 'Retinal Care']
    },
    {
      title: 'Dental Services',
      description: 'Comprehensive dental care from routine cleanings to advanced procedures.',
      icon: <Tooth className="w-8 h-8" />,
      color: 'from-teal-500 to-cyan-500',
      features: ['Dental Cleaning', 'Root Canal', 'Cosmetic Dentistry']
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 opacity-20">
        <Background3D />
      </div>

      {/* Particle Background */}
      <div className="absolute inset-0 opacity-10">
        <ParticleBackground />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-transparent to-black/90" />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-6">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <GlowingText>
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-6">
                  Medical Services
                </h1>
              </GlowingText>
              <GlowingText delay={0.2} glowColor="#4ecdc4">
                <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto">
                  Comprehensive healthcare solutions powered by cutting-edge technology 
                  and delivered by world-class medical professionals
                </p>
              </GlowingText>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <NeonButton size="lg" className="group">
                Explore Services
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="ml-2"
                >
                  →
                </motion.div>
              </NeonButton>
            </motion.div>
          </div>

          {/* Floating Medical Icons */}
          <div className="absolute inset-0 pointer-events-none">
            {[Heart, Brain, Eye, Stethoscope].map((Icon, index) => (
              <motion.div
                key={index}
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 10, 0],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 4 + index,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.5,
                }}
                className={`absolute text-cyan-400 ${
                  index === 0 ? 'top-1/4 left-1/4' :
                  index === 1 ? 'top-1/3 right-1/4' :
                  index === 2 ? 'bottom-1/3 left-1/3' :
                  'bottom-1/4 right-1/3'
                }`}
              >
                <Icon size={40} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <GlowingText>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Our Specialties
                </h2>
              </GlowingText>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                From routine checkups to complex procedures, we provide comprehensive 
                medical care across all specialties
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <AnimatedCard key={index} delay={index * 0.1} className="h-full">
                  <div className="relative group h-full">
                    {/* Glow Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${service.color} rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
                    
                    {/* Card Content */}
                    <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 h-full flex flex-col">
                      {/* Icon */}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-16 h-16 rounded-full bg-gradient-to-r ${service.color} flex items-center justify-center mb-6 text-white shadow-lg`}
                      >
                        {service.icon}
                      </motion.div>

                      {/* Content */}
                      <h3 className="text-2xl font-bold mb-4 text-white">{service.title}</h3>
                      <p className="text-gray-400 mb-6 flex-grow">{service.description}</p>

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
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${service.color} mr-3`} />
                            {feature}
                          </motion.div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <NeonButton size="sm" className="w-full justify-center group">
                        Book Appointment
                        <motion.span
                          className="ml-2 group-hover:translate-x-1 transition-transform"
                        >
                          →
                        </motion.span>
                      </NeonButton>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <AnimatedCard>
              <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 backdrop-blur-sm border border-cyan-500/30 rounded-3xl p-12">
                <GlowingText>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    Ready to Experience the Future of Healthcare?
                  </h2>
                </GlowingText>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="text-xl text-gray-300 mb-8"
                >
                  Join thousands of patients who trust MedicoX for their healthcare needs. 
                  Book your appointment today and take the first step towards better health.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <NeonButton size="lg" className="group">
                    Schedule Consultation
                    <motion.span
                      className="ml-2 group-hover:translate-x-1 transition-transform"
                    >
                      →
                    </motion.span>
                  </NeonButton>
                  <NeonButton variant="secondary" size="lg">
                    Learn More
                  </NeonButton>
                </motion.div>
              </div>
            </AnimatedCard>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ServicesPage;