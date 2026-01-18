import React, { useState, useEffect } from 'react';
import { UserPreferences, Persona } from '../types';
import { CameraIcon } from './icons/CameraIcon';
import { LeafIcon } from './icons/LeafIcon';
import { AllergyIcon } from './icons/AllergyIcon';
import { googleApiService } from '../services/googleApiService';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';

interface MealPlanFormProps {
  persona: Persona;
  onSubmit: (preferences: UserPreferences) => void;
  onScan: () => void;
  initialIngredients: string[];
  error: string | null;
  onBack: () => void;
}

type FormStatePrefs = {
  cityType: UserPreferences['cityType'] | '';
  diet: UserPreferences['diet'] | '';
  taste: UserPreferences['taste'] | '';
  budget: string;
  time: string;
  kitchenSetup: UserPreferences['kitchenSetup'] | '';
};

// --- Persona-based Defaults ---
const personaDefaults: Record<Persona, Partial<FormStatePrefs>> = {
    'Student': { budget: '300', time: '20', kitchenSetup: 'basic' },
    'Working Professional': { budget: '700', time: '30', kitchenSetup: 'medium' },
    'Household': { budget: '1000', time: '45', kitchenSetup: 'full' }
};

// FIX: Reformat array to fix potential hidden character issues causing TS errors.
const tasteOptions: UserPreferences['taste'][] = [
  'Sweet', 'Salty', 'Spicy', 'Indian', 'North Indian', 'South Indian', 'Punjabi', 
  'Maharashtrian', 'Gujarati', 'Rajasthani', 'Bengali', 'Kerala', 'Andhra', 
  'Tamil', 'Hyderabadi', 'Mughlai', 'Italian', 'Western', 'Chinese', 'Indo-Chinese', 
  'Japanese', 'Korean', 'Thai', 'Mexican', 'American', 'French', 'Spanish', 
  'Mediterranean', 'Middle Eastern', 'Lebanese', 'Turkish', 'Greek', 'Vietnamese', 
  'Asian Fusion', 'Continental', 'Street Food', 'Fast Food', 'Vegan', 'Vegetarian', 
  'Jain', 'Keto', 'High-Protein', 'Low-Carb', 'Random'
];

const MealPlanForm: React.FC<MealPlanFormProps> = ({ persona, onSubmit, onScan, initialIngredients, error: apiError, onBack }) => {
  const [prefs, setPrefs] = useState<FormStatePrefs>({
    cityType: '',
    diet: '',
    taste: '',
    budget: '',
    time: '',
    kitchenSetup: '',
  });
  const [ingredients, setIngredients] = useState('');
  const [avoidIngredients, setAvoidIngredients] = useState('');
  const [formError, setFormError] = useState('');
  const [isDriveLoading, setIsDriveLoading] = useState(false);

  useEffect(() => {
    // Apply persona-based defaults when the component mounts or persona changes
    if (persona) {
        setPrefs(p => ({ ...p, ...personaDefaults[persona] }));
    }
  }, [persona]);

  useEffect(() => {
    if (initialIngredients.length > 0) {
      setIngredients(initialIngredients.join(', '));
    }
  }, [initialIngredients]);

  const handleLoadFromDrive = async () => {
    setIsDriveLoading(true);
    setFormError('');
    try {
      const loadedIngredients = await googleApiService.loadPantryFromDrive();
      setIngredients(loadedIngredients.join(', '));
    } catch (e) {
      setFormError('Failed to load pantry from Google Drive.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleSaveToDrive = async () => {
    const ingredientList = ingredients.split(',').map(i => i.trim()).filter(Boolean);
    if (ingredientList.length === 0) {
        setFormError('Add some ingredients before saving.');
        return;
    }
    setIsDriveLoading(true);
    setFormError('');
    try {
      await googleApiService.savePantryToDrive(ingredientList);
      alert('Pantry saved to Google Drive!');
    } catch (e) {
      setFormError('Failed to save pantry to Google Drive.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ingredientList = ingredients.split(',').map(i => i.trim()).filter(Boolean);
    const avoidIngredientList = avoidIngredients.split(',').map(i => i.trim()).filter(Boolean);
    
    if (Object.values(prefs).some(v => v === '')) {
      setFormError('Please fill out all preference fields.');
      return;
    }
    if (ingredientList.length < 3) { // Ingredient Lock constraint
      setFormError('At least 3 ingredients are required.');
      return;
    }
    if (Number(prefs.budget) <= 0 || Number(prefs.time) <= 0) {
        setFormError('Budget and Time must be positive numbers.');
        return;
    }
    setFormError('');
    onSubmit({ ...prefs, ingredients: ingredientList, avoidIngredients: avoidIngredientList } as UserPreferences);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPrefs(prev => ({ ...prev, [name]: value }));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPrefs(prev => ({ ...prev, [name]: value }));
  };
  
  const currentError = formError || apiError;

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-card dark:bg-dark-card p-8 rounded-2xl shadow-2xl space-y-6 my-10" aria-labelledby="form-title">
        <div className="text-center">
            <LeafIcon className="w-16 h-16 mx-auto text-primary dark:text-dark-primary" />
            <h1 id="form-title" className="text-5xl font-display text-center text-primary-dark dark:text-dark-primary-dark mt-2">Your Preferences</h1>
            <p className="text-center text-text-secondary dark:text-dark-text-secondary mt-2">Tell us what you like, and we'll create the perfect plan.</p>
        </div>
        
        {currentError && <div id="error-message" role="alert" className="p-3 bg-red-100 text-red-700 rounded-md text-center font-medium">{currentError}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="cityType" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">City Type</label>
            <select id="cityType" name="cityType" value={prefs.cityType} onChange={handleSelectChange} required className="w-full p-2 border border-border dark:border-dark-border rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-dark-card-secondary dark:text-dark-text-primary">
              <option value="" disabled>Select City Type</option>
              <option value="Metro">Metro</option>
              <option value="Tier-2">Tier-2</option>
              <option value="Tier-3">Tier-3</option>
            </select>
          </div>
          <div>
            <label htmlFor="diet" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">Diet Type</label>
            <select id="diet" name="diet" value={prefs.diet} onChange={handleSelectChange} required className="w-full p-2 border border-border dark:border-dark-border rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-dark-card-secondary dark:text-dark-text-primary">
              <option value="" disabled>Select Diet</option>
              <option value="veg">Veg</option>
              <option value="non-veg">Non-Veg</option>
              <option value="eggitarian">Eggitarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>
           <div>
            <label htmlFor="budget" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">Budget per day (₹)</label>
            <input type="number" id="budget" name="budget" value={prefs.budget} onChange={handleInputChange} required placeholder="e.g., 500" className="w-full p-2 border border-border dark:border-dark-border rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-dark-card-secondary dark:text-dark-text-primary" />
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">Time per meal (minutes)</label>
            <input type="number" id="time" name="time" value={prefs.time} onChange={handleInputChange} required placeholder="e.g., 30" className="w-full p-2 border border-border dark:border-dark-border rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-dark-card-secondary dark:text-dark-text-primary" />
          </div>
        </div>
         <div>
            <label htmlFor="taste" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">Taste Preference</label>
            <select id="taste" name="taste" value={prefs.taste} onChange={handleSelectChange} required className="w-full p-2 border border-border dark:border-dark-border rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-dark-card-secondary dark:text-dark-text-primary">
              <option value="" disabled>Select Taste/Cuisine</option>
              {tasteOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        
        <fieldset>
            <legend className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">Kitchen Setup</legend>
            <div className="flex flex-wrap gap-4">
                {(['basic', 'medium', 'full'] as const).map(setup => (
                    <div key={setup} className="flex items-center">
                        <input
                            type="radio"
                            id={`kitchen-${setup}`}
                            name="kitchenSetup"
                            value={setup}
                            checked={prefs.kitchenSetup === setup}
                            onChange={(e) => setPrefs(p => ({...p, kitchenSetup: e.target.value as any}))}
                            required
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <label htmlFor={`kitchen-${setup}`} className="ml-2 block text-sm text-text-primary dark:text-dark-text-primary capitalize">{setup}</label>
                    </div>
                ))}
            </div>
        </fieldset>
        
        <div>
          <label htmlFor="ingredients" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">Ingredients available (min 3)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <textarea 
                id="ingredients" 
                value={ingredients} 
                onChange={(e) => setIngredients(e.target.value)} 
                rows={4} 
                placeholder="Type ingredients here, separated by commas... (e.g., rice, lentils, onion)" 
                required
                aria-describedby={currentError ? "error-message" : undefined}
                className="w-full p-2 border border-border dark:border-dark-border rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-dark-card-secondary dark:text-dark-text-primary"
              />
              <div className="space-y-3">
                 <button 
                  type="button" 
                  onClick={onScan}
                  className="flex w-full items-center justify-center gap-2 px-4 py-3 text-md font-semibold text-primary-dark dark:text-dark-primary-dark transition-colors bg-card dark:bg-dark-card border-2 border-primary dark:border-dark-primary rounded-full hover:bg-primary-light dark:hover:bg-dark-primary-light"
                >
                  <CameraIcon className="w-6 h-6" />
                  Scan Ingredients
                </button>
                <button 
                  type="button" 
                  onClick={handleLoadFromDrive}
                  disabled={isDriveLoading}
                  className="flex w-full items-center justify-center gap-2 px-4 py-3 text-md font-semibold text-text-secondary dark:text-dark-text-secondary transition-colors bg-card dark:bg-dark-card border-2 border-border dark:border-dark-border rounded-full hover:bg-gray-100 dark:hover:bg-dark-card-secondary disabled:opacity-50"
                >
                  <GoogleDriveIcon className="w-6 h-6" />
                  {isDriveLoading ? 'Loading...' : 'Load from Drive'}
                </button>
              </div>
          </div>
           <div className="text-right mt-2">
             <button
                type="button"
                onClick={handleSaveToDrive}
                disabled={isDriveLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-text-secondary dark:text-dark-text-secondary transition-colors bg-card-secondary dark:bg-dark-card-secondary border border-border dark:border-dark-border rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                <GoogleDriveIcon className="w-5 h-5" />
                Save to Drive
             </button>
            </div>
        </div>
        
        <div>
          <label htmlFor="avoidIngredients" className="flex items-center gap-2 text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">
            <AllergyIcon className="w-5 h-5 text-red-500" />
            Ingredients to Avoid (Allergies/Dislikes)
          </label>
          <textarea
            id="avoidIngredients"
            value={avoidIngredients}
            onChange={(e) => setAvoidIngredients(e.target.value)}
            rows={3}
            placeholder="Optional: e.g., peanuts, gluten, dairy"
            className="w-full p-2 border border-border dark:border-dark-border rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-dark-card-secondary dark:text-dark-text-primary"
          />
        </div>

        <div className="flex items-center justify-between">
            <button type="button" onClick={onBack} className="py-3 px-8 bg-gray-200 dark:bg-gray-700 text-text-primary dark:text-dark-text-primary font-semibold rounded-full shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Back
            </button>
            <button type="submit" className="py-3 px-8 bg-primary dark:bg-dark-primary text-white font-semibold text-lg rounded-full shadow-lg hover:bg-primary-dark dark:hover:bg-dark-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform hover:scale-105">
                Generate Meal Plan
            </button>
        </div>
      </form>
    </div>
  );
};

export default MealPlanForm;