import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Calendar, Users, Heart, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  image?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome to MedicoX',
    description: 'Your comprehensive healthcare platform that connects you with top medical professionals worldwide.',
    icon: <Heart className="w-8 h-8" />,
    image: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 2,
    title: 'Book Appointments Easily',
    description: 'Find and book appointments with specialists in just a few clicks. Choose your preferred time and location.',
    icon: <Calendar className="w-8 h-8" />,
    image: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 3,
    title: 'Connect with Experts',
    description: 'Access a network of verified healthcare professionals with detailed profiles and patient reviews.',
    icon: <Users className="w-8 h-8" />,
    image: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 4,
    title: 'Secure & Private',
    description: 'Your health data is protected with enterprise-grade security. We prioritize your privacy above all.',
    icon: <Shield className="w-8 h-8" />,
    image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
];

interface WelcomeTutorialProps {
  isVisible: boolean;
  onComplete: () => void;
}

export const WelcomeTutorial: React.FC<WelcomeTutorialProps> = ({ isVisible, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user } = useAuth();

  const handleNext = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      if (currentStep < tutorialSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete();
      }
      setIsAnimating(false);
    }, 300);
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentTutorialStep = tutorialSteps[currentStep];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                {currentTutorialStep.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome, {user?.name || 'User'}!
                </h1>
                <p className="text-indigo-100">
                  Let's get you started with MedicoX
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-2">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                    index <= currentStep ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Text Content */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl">
                  <div className="text-indigo-600">
                    {currentTutorialStep.icon}
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {currentTutorialStep.title}
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {currentTutorialStep.description}
                  </p>
                </div>

                {/* Features List for first step */}
                {currentStep === 0 && (
                  <div className="space-y-3">
                    {[
                      'Book appointments with top doctors',
                      'Get digital prescriptions instantly',
                      'Manage your health records securely',
                      'Access 24/7 medical support'
                    ].map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Image */}
              <motion.div
                key={`image-${currentStep}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-25" />
                <div className="relative bg-white p-2 rounded-2xl">
                  <img
                    src={currentTutorialStep.image}
                    alt={currentTutorialStep.title}
                    className="w-full h-64 lg:h-80 object-cover rounded-xl"
                  />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Skip Tutorial
              </button>
              
              <motion.button
                onClick={handleNext}
                disabled={isAnimating}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};