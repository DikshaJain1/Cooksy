
import React from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface LoadingSpinnerProps {
  message: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary" role="status" aria-live="polite">
    <SpinnerIcon className="w-16 h-16 animate-spin text-primary dark:text-dark-primary" />
    <p className="mt-4 text-lg font-semibold">{message}</p>
  </div>
);

export default LoadingSpinner;