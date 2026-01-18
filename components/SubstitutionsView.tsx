
import React from 'react';
import { Substitution } from '../types';
import { MealImage } from './MealPlanView';
import { SubstitutionsIcon } from './icons/SubstitutionsIcon';

interface SubstitutionsViewProps {
  substitution: Substitution;
  onBack: () => void;
  onSwap: (newMeal: string) => void;
}

const SubstitutionsView: React.FC<SubstitutionsViewProps> = ({ substitution, onBack, onSwap }) => {
  const { original, substitute1, substitute2 } = substitution;

  const handleSwap = (newMeal: string) => {
    if (confirm(`Are you sure you want to swap ${original} for ${newMeal}? This will update your plan.`)) {
      onSwap(newMeal);
    }
  };

  const AlternativeCard: React.FC<{ title: string; mealName: string; }> = ({ title, mealName }) => (
    <div className="bg-card-secondary dark:bg-dark-card-secondary p-4 rounded-lg flex flex-col items-center gap-4 shadow-sm text-center">
      <h3 className="text-sm font-bold uppercase tracking-wider text-primary dark:text-dark-primary">{title}</h3>
      <MealImage mealName={mealName} />
      <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary flex-grow">{mealName}</h2>
      <button 
        onClick={() => handleSwap(mealName)}
        className="w-full mt-auto py-2 px-4 bg-primary dark:bg-dark-primary text-white font-semibold rounded-full shadow-md hover:bg-primary-dark dark:hover:bg-dark-primary-dark transition-colors"
      >
        Swap for this
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card dark:bg-dark-card p-8 rounded-2xl shadow-2xl space-y-8 my-10">
        <header className="text-center">
          <SubstitutionsIcon className="w-16 h-16 mx-auto text-primary dark:text-dark-primary" />
          <h1 className="text-4xl font-display text-center text-primary-dark dark:text-dark-primary-dark mt-2">Flexible Meal Options</h1>
          <p className="text-center text-text-secondary dark:text-dark-text-secondary mt-2">
            Instead of <strong>{original}</strong>, you could try one of these:
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AlternativeCard title="Prep-Light Alternative" mealName={substitute1} />
          <AlternativeCard title="Easy Fallback" mealName={substitute2} />
        </div>

        <div className="text-center pt-6">
          <button onClick={onBack} className="py-3 px-8 bg-gray-200 dark:bg-gray-700 text-text-primary dark:text-dark-text-primary font-semibold rounded-full shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            &larr; Back to Meal Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubstitutionsView;
