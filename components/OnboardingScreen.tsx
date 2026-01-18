
import React from 'react';
import { Persona } from '../types';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { SchoolIcon } from './icons/SchoolIcon';
import { HomeIcon } from './icons/HomeIcon';

interface OnboardingScreenProps {
  onSelect: (persona: Persona) => void;
}

const PersonaCard: React.FC<{
  icon: React.ReactNode;
  title: Persona;
  description: string;
  onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center text-center p-8 bg-card dark:bg-dark-card rounded-2xl shadow-lg border border-border dark:border-dark-border transform hover:scale-105 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
    aria-label={`Select ${title} persona`}
  >
    {icon}
    <h3 className="text-3xl font-display text-primary-dark dark:text-dark-primary-dark mt-4">{title}</h3>
    <p className="mt-2 text-text-secondary dark:text-dark-text-secondary h-16">{description}</p>
  </button>
);

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-display text-primary-dark dark:text-dark-primary-dark">Welcome to Cooksy!</h1>
        <p className="mt-4 text-xl text-text-secondary dark:text-dark-text-secondary">To get started, tell us a bit about yourself.</p>
      </div>
      <div className="w-full max-w-4xl grid md:grid-cols-3 gap-8">
        <PersonaCard 
          icon={<BriefcaseIcon className="w-20 h-20 text-primary dark:text-dark-primary" />}
          title="Working Professional"
          description="Quick, healthy meals for a busy schedule."
          onClick={() => onSelect('Working Professional')}
        />
        <PersonaCard 
          icon={<SchoolIcon className="w-20 h-20 text-primary dark:text-dark-primary" />}
          title="Student"
          description="Budget-friendly and simple recipes."
          onClick={() => onSelect('Student')}
        />
        <PersonaCard 
          icon={<HomeIcon className="w-20 h-20 text-primary dark:text-dark-primary" />}
          title="Household"
          description="Family-sized meals and diverse options."
          onClick={() => onSelect('Household')}
        />
      </div>
    </div>
  );
};

export default OnboardingScreen;
