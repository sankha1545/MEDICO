import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Settings, Users, Shield, CreditCard, Bell } from 'lucide-react';
import anime from 'animejs';
import Background3D from '../animations/3D/Background3D';
import AnimatedCard from '../animations/3D/AnimatedCard';
import AnimatedButton from '../common/AnimatedButton';

interface SettingsDocumentationProps {
  onBack: () => void;
}

const SettingsDocumentation: React.FC<SettingsDocumentationProps> = ({ onBack }) => {
  const sectionsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: entry.target,
              opacity: [0, 1],
              translateY: [30, 0],
              duration: 600,
              easing: 'easeOutCubic',
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el: HTMLDivElement) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  const sections = [
    {
      id: 'profile',
      title: 'Profile Management',
      icon: Users,
      content: [
        'Update your personal information including name, email, and contact details',
        'Upload and manage your profile picture',
        'Set your professional bio and specializations',
        'Configure your availability status and working hours'
      ]
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: Shield,
      content: [
        'Change your account password regularly for security',
        'Enable two-factor authentication for enhanced protection',
        'Manage active sessions and logout from other devices',
        'Control data sharing preferences and privacy settings',
        'Review and clear account activity logs'
      ]
    },
    {
      id: 'notifications',
      title: 'Notification Preferences',
      icon: Bell,
      content: [
        'Configure email notifications for appointments and messages',
        'Set up SMS alerts with your carrier information',
        'Customize reminder timings (24h before, 1h before)',
        'Enable or disable push notifications',
        'Manage sound and popup alert preferences'
      ]
    },
    {
      id: 'payments',
      title: 'Payment & Billing',
      icon: CreditCard,
      content: [
        'Set consultation fees for different appointment types',
        'Configure payment methods and bank account details',
        'Create discount packages and promotional offers',
        'View payment history and transaction records',
        'Manage insurance information and billing details'
      ]
    },
    {
      id: 'schedule',
      title: 'Schedule Management',
      icon: Settings,
      content: [
        'Set your weekly availability and working days',
        'Configure break times and appointment durations',
        'Add date exceptions for holidays or unavailable days',
        'Set buffer times between appointments',
        'Enable auto-confirmation for bookings'
      ]
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Background3D />
      
      <div className="relative z-10 min-h-screen">
        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-80 bg-black/20 backdrop-blur-lg border-r border-white/10 p-6 sticky top-0 h-screen overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <AnimatedButton
                variant="secondary"
                size="sm"
                onClick={onBack}
                className="flex items-center space-x-2 mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Settings</span>
              </AnimatedButton>

              <h1 className="text-2xl font-bold text-white flex items-center mb-8">
                <BookOpen className="mr-3 w-6 h-6 text-cyan-400" />
                Settings Help
              </h1>

              <nav className="space-y-2">
                {sections.map((section, index) => (
                  <motion.a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <section.icon className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
                    <span className="font-medium">{section.title}</span>
                  </motion.a>
                ))}
              </nav>

              <div className="mt-8 p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-400/30">
                <h3 className="text-white font-semibold mb-2">💡 Quick Tip</h3>
                <p className="text-white/80 text-sm">
                  Use the search function in your browser (Ctrl+F) to quickly find specific settings or features.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h1 className="text-5xl font-extrabold text-white mb-4">
                  Settings Documentation
                </h1>
                <p className="text-xl text-white/80 max-w-2xl mx-auto">
                  Complete guide to configuring and managing your MedicoX account settings
                </p>
              </motion.div>

              {sections.map((section, index) => (
                <div
                  key={section.id}
                  id={section.id}
                  ref={addToRefs}
                  className="opacity-0"
                >
                  <AnimatedCard delay={index + 1}>
                    <div className="flex items-center mb-6">
                      <div className="p-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl mr-4">
                        <section.icon className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-white">{section.title}</h2>
                    </div>

                    <div className="space-y-4">
                      {section.content.map((item, itemIndex) => (
                        <motion.div
                          key={itemIndex}
                          className="flex items-start space-x-3 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: itemIndex * 0.1 }}
                        >
                          <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
                          <p className="text-white/90 leading-relaxed">{item}</p>
                        </motion.div>
                      ))}
                    </div>

                    {section.id === 'security' && (
                      <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-xl">
                        <h4 className="text-yellow-300 font-semibold mb-2">⚠️ Security Best Practices</h4>
                        <ul className="text-yellow-100/90 text-sm space-y-1">
                          <li>• Use a strong, unique password with at least 12 characters</li>
                          <li>• Enable two-factor authentication for maximum security</li>
                          <li>• Regularly review your account activity</li>
                          <li>• Never share your login credentials with others</li>
                        </ul>
                      </div>
                    )}

                    {section.id === 'notifications' && (
                      <div className="mt-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl">
                        <h4 className="text-blue-300 font-semibold mb-2">📱 SMS Setup Guide</h4>
                        <div className="text-blue-100/90 text-sm space-y-2">
                          <p><strong>Step 1:</strong> Enter your phone number (digits only)</p>
                          <p><strong>Step 2:</strong> Select your carrier from the dropdown</p>
                          <p><strong>Step 3:</strong> Test the SMS functionality</p>
                          <p className="text-blue-200/70 italic">Note: SMS alerts use email-to-SMS gateways</p>
                        </div>
                      </div>
                    )}

                    {section.id === 'payments' && (
                      <div className="mt-6 p-4 bg-green-500/20 border border-green-400/30 rounded-xl">
                        <h4 className="text-green-300 font-semibold mb-2">💳 Payment Integration</h4>
                        <div className="text-green-100/90 text-sm space-y-2">
                          <p>Supported payment methods:</p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>UPI (Unified Payments Interface)</li>
                            <li>Bank transfers</li>
                            <li>Credit/Debit cards</li>
                            <li>Digital wallets</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </AnimatedCard>
                </div>
              ))}

              {/* FAQ Section */}
              <div ref={addToRefs} className="opacity-0">
                <AnimatedCard delay={sections.length + 1}>
                  <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                    <div className="p-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl mr-4">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    Frequently Asked Questions
                  </h2>

                  <div className="space-y-6">
                    {[
                      {
                        q: "How do I reset my password?",
                        a: "Go to Security Settings, enter your current password, then your new password, and click 'Update Password'."
                      },
                      {
                        q: "Can I change my appointment fees?",
                        a: "Yes, navigate to Payment & Fees section and update the consultation fees for different appointment types."
                      },
                      {
                        q: "How do I set up emergency closure?",
                        a: "In the Availability & Schedule section, toggle the 'Emergency Closure' switch to temporarily close your practice."
                      },
                      {
                        q: "What happens when I delete my account?",
                        a: "Account deletion is permanent and will remove all your data, appointments, and patient records. This action cannot be undone."
                      }
                    ].map((faq, index) => (
                      <motion.div
                        key={index}
                        className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <h4 className="text-white font-semibold mb-2">Q: {faq.q}</h4>
                        <p className="text-white/80">A: {faq.a}</p>
                      </motion.div>
                    ))}
                  </div>
                </AnimatedCard>
              </div>

              {/* Contact Support */}
              <div ref={addToRefs} className="opacity-0">
                <AnimatedCard delay={sections.length + 2} className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-4">Need More Help?</h2>
                  <p className="text-white/80 mb-6">
                    Can't find what you're looking for? Our support team is here to help.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <AnimatedButton>Contact Support</AnimatedButton>
                    <AnimatedButton variant="secondary">Live Chat</AnimatedButton>
                  </div>
                </AnimatedCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDocumentation;