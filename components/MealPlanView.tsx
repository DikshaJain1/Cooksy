
import React, { useState, useEffect } from 'react';
import { MealPlanResponse, OptimizationOption, MealPlanObject, Substitution } from '../types';
import { PlanIcon } from './icons/PlanIcon';
import { GroceryCartIcon } from './icons/GroceryCartIcon';
import { ChefHatIcon } from './icons/ChefHatIcon';
import { SubstitutionsIcon } from './icons/SubstitutionsIcon';
import { LeafIcon } from './icons/LeafIcon';
import { InfoIcon } from './icons/InfoIcon';
import { generateImageForRecipe } from '../services/geminiService';
import { googleApiService } from '../services/googleApiService';
import { GoogleSheetsIcon } from './icons/GoogleSheetsIcon';
import { CalendarIcon } from './icons/CalendarIcon';

const fallbackImage = "https://images.pexels.com/photos/326281/pexels-photo-326281.jpeg?auto=compress&cs=tinysrgb&w=600";

export const MealImage: React.FC<{ mealName: string }> = React.memo(({ mealName }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    const fetchImage = async () => {
      setIsLoading(true);
      const imageData = await generateImageForRecipe(mealName);
      if (!isCancelled) {
        if (imageData) {
          setImageUrl(`data:image/png;base64,${imageData}`);
        } else {
          setImageUrl(fallbackImage);
        }
        setIsLoading(false);
      }
    };

    fetchImage();

    return () => {
      isCancelled = true;
    };
  }, [mealName]);

  if (isLoading) {
    return (
      <div className="w-24 h-24 bg-gray-200 dark:bg-dark-card-secondary rounded-md flex-shrink-0 flex items-center justify-center animate-pulse" aria-label={`Loading image for ${mealName}`}>
        <ChefHatIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  return (
    <img src={imageUrl || fallbackImage} alt={mealName} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
  );
});


interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  id: string;
}
const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, id }) => (
    <div className="flex items-center gap-3 border-b-2 border-primary-light dark:border-dark-primary-light pb-2 mb-4">
      {icon}
      <h3 id={id} className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{title}</h3>
    </div>
);


interface MealPlanViewProps {
  response: MealPlanResponse;
  onOptimize: (optimization: OptimizationOption) => void;
  onStartOver: () => void;
  onShowSubstitutions: (substitution: Substitution, day: string, mealType: string) => void;
  onSchedule: () => void;
  onSwapMeals: (source: { day: string, mealType: string }, target: { day: string, mealType: string }) => void;
}

const MealPlanCard: React.FC<{ plan: MealPlanObject, onShowSubstitutions: (substitution: Substitution, day: string, mealType: string) => void, onSwapMeals: MealPlanViewProps['onSwapMeals'] }> = ({ plan, onShowSubstitutions, onSwapMeals }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, day: string, mealType: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ day, mealType }));
    e.currentTarget.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
    setDragOverTarget(null);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    setDragOverTarget(targetId);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetDay: string, targetMealType: string) => {
    e.preventDefault();
    const sourceData = e.dataTransfer.getData('application/json');
    if (sourceData) {
      const source = JSON.parse(sourceData);
      if (source.day !== targetDay || source.mealType !== targetMealType) {
        onSwapMeals(source, { day: targetDay, mealType: targetMealType });
      }
    }
    setDragOverTarget(null);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const url = await googleApiService.exportGroceryListToSheets(plan.groceryList);
      alert(`Grocery list exported! View it here: ${url}`);
      window.open(url, '_blank');
    } catch (e) {
      alert('Failed to export grocery list.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <article className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-lg space-y-8 border border-border dark:border-dark-border">
      <h2 className="text-5xl font-display text-center text-primary-dark dark:text-dark-primary-dark">{plan.planTitle}</h2>
      
      <section role="region" aria-labelledby="meal-plan-section">
        <SectionHeader id="meal-plan-section" icon={<PlanIcon className="w-7 h-7 text-primary dark:text-dark-primary"/>} title="Meal Plan" />
        {Object.entries(plan.mealPlan).map(([day, meals]) => (
          <div key={day} className="mb-6">
            <h4 className="font-bold text-xl text-text-secondary dark:text-dark-text-secondary mb-3">{day}</h4>
            <div className="space-y-4">
              {Object.entries(meals).map(([mealType, mealDish]) => {
                if (typeof mealDish !== 'string') return null;
                const substitution = plan.substitutions.find(s => s.original === mealDish);
                const targetId = `${day}-${mealType}`;
                const isDragOver = dragOverTarget === targetId;
                return (
                  <div 
                    key={targetId}
                    id={targetId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, day, mealType)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, targetId)}
                    onDrop={(e) => handleDrop(e, day, mealType)}
                    className={`bg-card-secondary dark:bg-dark-card-secondary p-4 rounded-lg flex items-start gap-4 shadow-sm cursor-grab transition-all duration-200 ${isDragOver ? 'ring-2 ring-primary dark:ring-dark-primary scale-105' : 'ring-0'}`}
                    aria-label={`Meal: ${mealDish}, Type: ${mealType}, Day: ${day}. Draggable.`}
                  >
                    <MealImage mealName={mealDish} />
                    <div className="flex-grow">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-text-primary dark:text-dark-text-primary">
                          <strong className="block text-lg font-semibold">{mealType}</strong> {mealDish}
                        </p>
                        {substitution && (
                          <button 
                            onClick={() => onShowSubstitutions(substitution, day, mealType)}
                            className="text-sm text-primary-dark dark:text-dark-primary-dark font-semibold px-3 py-1 rounded-full bg-primary-light dark:bg-dark-primary-light hover:bg-primary-dark hover:text-white dark:hover:bg-dark-primary-dark dark:hover:text-dark-text-primary transition-colors whitespace-nowrap"
                          >
                            Substitutions
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section role="region" aria-labelledby="grocery-list-section">
         <div className="flex justify-between items-center">
            <SectionHeader id="grocery-list-section" icon={<GroceryCartIcon className="w-7 h-7 text-primary dark:text-dark-primary"/>} title="Grocery List" />
            <button
                onClick={handleExport}
                disabled={isExporting}
                aria-disabled={isExporting}
                className="flex items-center gap-2 -mt-6 mb-4 px-4 py-2 text-sm font-semibold text-green-800 dark:text-green-100 bg-green-100 dark:bg-green-800/50 rounded-full hover:bg-green-200 dark:hover:bg-green-700/50 disabled:opacity-50"
            >
                <GoogleSheetsIcon className="w-5 h-5"/>
                {isExporting ? 'Exporting...' : 'Export to Sheets'}
            </button>
         </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
          {Object.entries(plan.groceryList).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-bold text-text-secondary dark:text-dark-text-secondary capitalize">{category}</h4>
              <ul className="list-disc list-inside ml-4 text-text-secondary dark:text-dark-text-secondary mt-2 space-y-1">
                {(items as string[]).map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section role="region" aria-labelledby="cooking-sequence-section">
        <SectionHeader id="cooking-sequence-section" icon={<ChefHatIcon className="w-7 h-7 text-primary dark:text-dark-primary"/>} title="Meal Prep Schedule" />
        {Object.entries(plan.cookingSequence).map(([day, meals]) => (
          <div key={day} className="mb-4">
            <h4 className="font-bold text-lg text-text-secondary dark:text-dark-text-secondary">{day}</h4>
            <div className="ml-4 mt-2 space-y-3">
              {Object.entries(meals).map(([mealType, steps]) => (
                <div key={mealType}>
                  <h5 className="font-semibold text-text-primary dark:text-dark-text-primary">{mealType}</h5>
                  <ol className="list-decimal list-inside ml-4 text-text-secondary dark:text-dark-text-secondary">
                    {(steps as string[]).map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
      
      <section role="region" aria-labelledby="your-inputs-section">
        <SectionHeader id="your-inputs-section" icon={<InfoIcon className="w-7 h-7 text-primary dark:text-dark-primary"/>} title="Personalisation Proof" />
        <p className="text-text-secondary dark:text-dark-text-secondary italic bg-card-secondary dark:bg-dark-card-secondary p-3 rounded-md">{plan.basedOnYourInputs}</p>
      </section>
    </article>
  );
};


const MealPlanView: React.FC<MealPlanViewProps> = ({ response, onOptimize, onStartOver, onShowSubstitutions, onSchedule, onSwapMeals }) => {
  const { mainPlan, budgetAlternatives } = response;
  const optimisations: OptimizationOption[] = ['Tastier', 'Higher protein', 'Cheapest', 'Fastest'];

  const effectivePlan = mainPlan || (budgetAlternatives && budgetAlternatives[0]);

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {mainPlan ? (
          <MealPlanCard plan={mainPlan} onShowSubstitutions={onShowSubstitutions} onSwapMeals={onSwapMeals} />
        ) : (
          <div role="alert" className="text-center bg-yellow-100 dark:bg-yellow-900/50 p-6 rounded-xl border-2 border-yellow-300 dark:border-yellow-700">
            <h2 className="text-3xl font-display text-yellow-800 dark:text-yellow-200">Budget Exceeded</h2>
            <p className="mt-2 text-yellow-700 dark:text-yellow-300">The ideal plan was outside your budget. Here is a budget-safe alternative for you.</p>
          </div>
        )}

        {budgetAlternatives && budgetAlternatives.length > 0 && !mainPlan && (
          <div className="space-y-8">
            {budgetAlternatives.map((plan, i) => <MealPlanCard key={i} plan={plan} onShowSubstitutions={onShowSubstitutions} onSwapMeals={onSwapMeals} />)}
          </div>
        )}

        {/* --- Plan Adjustment Layer --- */}
        <section role="region" aria-labelledby="optimization-section" className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-lg border border-border dark:border-dark-border">
          <h3 id="optimization-section" className="text-3xl font-display text-text-primary dark:text-dark-text-primary mb-4 text-center">Adjust & Optimize</h3>
          <p className="text-center text-text-secondary dark:text-dark-text-secondary mb-6">Not quite right? Regenerate the plan with a new focus.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {optimisations.map(opt => (
              <button key={opt} onClick={() => onOptimize(opt)} className="w-full py-3 px-2 bg-primary-light text-primary-dark dark:bg-dark-primary-light dark:text-dark-primary-dark font-semibold rounded-full hover:bg-primary-dark hover:text-white dark:hover:bg-dark-primary-dark dark:hover:text-dark-text-primary transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark">
                {opt}
              </button>
            ))}
          </div>
        </section>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center pb-8">
            <button onClick={onStartOver} className="py-3 px-8 bg-gray-600 dark:bg-gray-700 text-white font-semibold rounded-full shadow-md hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors">
                Start Over
            </button>
             {effectivePlan && (
                <button 
                  onClick={onSchedule} 
                  className="flex items-center justify-center gap-3 py-3 px-8 bg-primary dark:bg-dark-primary text-white font-semibold text-lg rounded-full shadow-lg hover:bg-primary-dark dark:hover:bg-dark-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform hover:scale-105"
                >
                    Next: Schedule Reminders
                    <CalendarIcon className="w-6 h-6" />
                </button>
             )}
        </div>
      </div>
    </div>
  );
};

export default MealPlanView;
