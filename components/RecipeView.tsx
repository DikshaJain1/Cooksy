
import React from 'react';
import { SingleRecipe } from '../types';
import { ChefHatIcon } from './icons/ChefHatIcon';
import { LeafIcon } from './icons/LeafIcon';
import { InfoIcon } from './icons/InfoIcon';

interface RecipeViewProps {
  recipe: SingleRecipe;
  onStartOver: () => void;
}

const RecipeView: React.FC<RecipeViewProps> = ({ recipe, onStartOver }) => {
  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto bg-card dark:bg-dark-card p-8 rounded-2xl shadow-2xl space-y-8 my-10">
        <header className="text-center">
          <ChefHatIcon className="w-16 h-16 mx-auto text-primary dark:text-dark-primary" />
          <h1 className="text-5xl font-display text-center text-primary-dark dark:text-dark-primary-dark mt-2">{recipe.recipeName}</h1>
          <p className="text-center text-text-secondary dark:text-dark-text-secondary mt-4 italic">{recipe.description}</p>
        </header>

        <section>
          <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
            <LeafIcon className="w-6 h-6 text-primary dark:text-dark-primary" />
            Ingredients
          </h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((item, index) => (
              <li key={index} className="flex items-center gap-4 p-2 bg-card-secondary dark:bg-dark-card-secondary rounded-md">
                 <span className="font-semibold text-text-primary dark:text-dark-text-primary flex-grow">{item.name}</span>
                 <span className="text-sm text-gray-500 dark:text-gray-300 bg-card dark:bg-dark-card px-2 py-1 rounded-full border border-border dark:border-dark-border">{item.notes}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
            <InfoIcon className="w-6 h-6 text-primary dark:text-dark-primary" />
            Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-text-secondary dark:text-dark-text-secondary">
            {recipe.instructions.map((step, index) => (
              <li key={index} className="pl-2">{step}</li>
            ))}
          </ol>
        </section>

        <div className="text-center pt-6">
          <button onClick={onStartOver} className="py-3 px-8 bg-gray-600 dark:bg-gray-700 text-white font-semibold rounded-full shadow-md hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors">
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeView;