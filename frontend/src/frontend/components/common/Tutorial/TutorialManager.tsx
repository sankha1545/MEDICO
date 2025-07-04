import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { WelcomeTutorial } from './Welcometutorial';
import { GuidedTour } from './GuidedTour';

export const TutorialManager: React.FC = () => {
  const { user, markTutorialCompleted } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(false);

  useEffect(() => {
    // Show tutorial only for first-time users
    if (user?.isFirstLogin) {
      setShowWelcome(true);
    }
  }, [user]);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    // Start guided tour after welcome tutorial
    setTimeout(() => {
      setShowGuidedTour(true);
    }, 500);
  };

  const handleGuidedTourComplete = () => {
    setShowGuidedTour(false);
    // Mark tutorial as completed in the backend/context
    markTutorialCompleted();
  };

  return (
    <>
      <WelcomeTutorial
        isVisible={showWelcome}
        onComplete={handleWelcomeComplete}
      />
      <GuidedTour
        isActive={showGuidedTour}
        onComplete={handleGuidedTourComplete}
      />
    </>
  );
};