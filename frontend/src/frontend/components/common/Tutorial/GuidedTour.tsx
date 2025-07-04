import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS, EVENTS } from 'react-joyride';

interface GuidedTourProps {
  isActive: boolean;
  onComplete: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ isActive, onComplete }) => {
  const [run, setRun] = useState(false);

  const steps: Step[] = [
    {
      target: '.get-started-button',
      content: 'Click here to start booking your first appointment with our top doctors!',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.find-doctors-button',
      content: 'Browse through our extensive network of verified healthcare professionals.',
      placement: 'bottom',
    },
    {
      target: '.stats-section',
      content: 'See our impressive track record - thousands of satisfied patients and hundreds of expert doctors.',
      placement: 'top',
    },
    {
      target: '.how-it-works-section',
      content: 'Learn how easy it is to get the healthcare you need in just three simple steps.',
      placement: 'top',
    }
  ];

  useEffect(() => {
    if (isActive) {
      // Small delay to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        setRun(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      onComplete();
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // Handle step completion or target not found
    }
  };

  if (!isActive) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#4f46e5',
          backgroundColor: '#ffffff',
          textColor: '#374151',
          overlayColor: 'rgba(0, 0, 0, 0.4)',
          arrowColor: '#ffffff',
          beaconSize: 36,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '8px',
        },
        tooltipContent: {
          fontSize: '14px',
          lineHeight: '1.5',
        },
        buttonNext: {
          backgroundColor: '#4f46e5',
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: '600',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 'auto',
        },
        buttonSkip: {
          color: '#6b7280',
        },
      }}
    />
  );
};