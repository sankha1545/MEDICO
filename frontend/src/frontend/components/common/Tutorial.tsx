// File: src/components/CombinedTutorial.tsx
import React, { useEffect, useState } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import Lottie from 'lottie-react';
import MedicoIntro from '../../assets/medico-intro.json';

/**
 * CombinedTutorial shows an onboarding animation + guided tour once per user login.
 * Flags are stored in sessionStorage so it resets per login session.
 */
export default function CombinedTutorial() {
  const [showIntro, setShowIntro] = useState(false);
  const [runTour, setRunTour] = useState(false);

  // Steps for Joyride targeting home page elements
  const steps: Step[] = [
    { target: '.book-appointment-button', content: 'Click here to book your first appointment!', disableBeacon: true },
    { target: '.doctor-profile-card', content: 'Check doctor info and reviews here.' },
    { target: '.payment-section', content: 'Manage your payments securely.' },
    { target: '.chatbot-icon', content: 'Need help? Chat with our bot anytime!' }
  ];

  useEffect(() => {
    // Only show on fresh session after login
    const seen = sessionStorage.getItem('medicoX_seen_tutorial');
    if (!seen) {
      setShowIntro(true);
    }
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setRunTour(true);
  };

  const handleTourCallback = (data: CallBackProps) => {
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(data.status!)) {
      sessionStorage.setItem('medicoX_seen_tutorial', 'true');
      setRunTour(false);
    }
  };

  return (
    <>
      {showIntro && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
          <div className="w-3/4 max-w-lg">
            <Lottie
              animationData={MedicoIntro}
              autoplay
              loop={false}
              onComplete={handleIntroComplete}
            />
          </div>
        </div>
      )}

      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showSkipButton
        scrollToFirstStep
        callback={handleTourCallback}
        styles={{ options: { zIndex: 10000 } }}
      />
    </>
  );
}