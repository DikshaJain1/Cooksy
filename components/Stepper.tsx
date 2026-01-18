
import React from 'react';

interface StepperProps {
  steps: string[];
  activeStep: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, activeStep }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center justify-center bg-card dark:bg-dark-card p-4 shadow-md">
        {steps.map((step, stepIdx) => (
          <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {stepIdx < activeStep ? (
              // Completed Step
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-primary dark:bg-dark-primary" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary dark:bg-dark-primary">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                  </svg>
                   <span className="absolute top-10 w-max text-xs text-center text-text-secondary dark:text-dark-text-secondary">{step}</span>
                </div>
              </>
            ) : stepIdx === activeStep ? (
              // Current Step
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary dark:border-dark-primary bg-card dark:bg-dark-card" aria-current="step">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary dark:bg-dark-primary" aria-hidden="true" />
                  <span className="absolute top-10 w-max text-xs text-center font-semibold text-primary dark:text-dark-primary">{step}</span>
                </div>
              </>
            ) : (
              // Upcoming Step
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 bg-card dark:bg-dark-card">
                   <span className="absolute top-10 w-max text-xs text-center text-text-secondary dark:text-dark-text-secondary">{step}</span>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Stepper;
