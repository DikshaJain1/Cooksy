
import React, { useState, useCallback, Suspense, useMemo } from 'react';
import { AppState, UserPreferences, MealPlanResponse, OptimizationOption, SingleRecipe, Substitution, Persona, MealPlanObject } from './types';
import { generateMealPlan, identifyIngredients, generateRecipeFromImages, generateMealSwap, rebalancePlanAfterSwap } from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';
import { useTheme } from './hooks/useTheme';
import ThemeToggle from './components/ThemeToggle';
import { LeafIcon } from './components/icons/LeafIcon';
import Stepper from './components/Stepper';

const HomeScreen = React.lazy(() => import('./components/HomeScreen'));
const OnboardingScreen = React.lazy(() => import('./components/OnboardingScreen'));
const MealPlanForm = React.lazy(() => import('./components/MealPlanForm'));
const MealPlanView = React.lazy(() => import('./components/MealPlanView'));
const CameraView = React.lazy(() => import('./components/CameraView'));
const ZeroWasteForm = React.lazy(() => import('./components/ZeroWasteForm'));
const RecipeView = React.lazy(() => import('./components/RecipeView'));
const SubstitutionsView = React.lazy(() => import('./components/SubstitutionsView'));
const SchedulerView = React.lazy(() => import('./components/SchedulerView'));


const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [mealPlanResponse, setMealPlanResponse] = useState<MealPlanResponse | null>(null);
  const [identifiedIngredients, setIdentifiedIngredients] = useState<string[] | null>(null);
  const [singleRecipe, setSingleRecipe] = useState<SingleRecipe | null>(null);
  const [selectedTrendingRecipe, setSelectedTrendingRecipe] = useState<SingleRecipe | null>(null);
  const [currentSubstitution, setCurrentSubstitution] = useState<{ sub: Substitution, day: string, mealType: string } | null>(null);
  const [zeroWasteImages, setZeroWasteImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const handlePersonaSelect = useCallback((selectedPersona: Persona) => {
    setPersona(selectedPersona);
    setAppState(AppState.PLAN_FORM);
  }, []);

  const handleCreatePlan = useCallback(async (preferences: UserPreferences, optimization: OptimizationOption | null = null) => {
    setAppState(AppState.GENERATING_PLAN);
    setUserPreferences(preferences);
    setError(null);
    try {
      const result = await generateMealPlan(preferences, optimization);
      setMealPlanResponse(result);
      setAppState(AppState.SHOWING_PLAN);
    } catch (err) {
      console.error(err);
      setError('Could not generate a meal plan. Please try again.');
      setAppState(AppState.PLAN_FORM);
    }
  }, []);

  const handleImageCapture = useCallback(async (imageData: string) => {
    setAppState(AppState.LOADING_INGREDIENTS);
    setError(null);
    try {
      const ingredients = await identifyIngredients(imageData);
      setIdentifiedIngredients(ingredients);
      setAppState(AppState.PLAN_FORM);
    } catch (err) {
      console.error(err);
      setError('Could not identify ingredients from the image. Please try again.');
      setAppState(AppState.PLAN_FORM);
    }
  }, []);

  const handleGenerateRecipe = useCallback(async (images: string[]) => {
    setAppState(AppState.GENERATING_RECIPE);
    setError(null);
    try {
      const recipe = await generateRecipeFromImages(images);
      setSingleRecipe(recipe);
      setAppState(AppState.SHOWING_RECIPE);
    } catch (err) {
      console.error(err);
      setError('Could not generate a recipe from the images. Please try again.');
      setAppState(AppState.ZERO_WASTE_FORM);
    }
  }, []);
  
  const handleSelectTrendingRecipe = useCallback((recipe: SingleRecipe) => {
    setSelectedTrendingRecipe(recipe);
    setAppState(AppState.SHOWING_TRENDING_RECIPE);
  }, []);

  const handleShowSubstitutions = useCallback((substitution: Substitution, day: string, mealType: string) => {
    setCurrentSubstitution({ sub: substitution, day, mealType });
    setAppState(AppState.SHOWING_SUBSTITUTIONS);
  }, []);

  const handleSwapMeal = useCallback(async (newMealName: string) => {
    if (!currentSubstitution || !mealPlanResponse?.mainPlan || !userPreferences) {
        setError("Could not perform swap: missing context.");
        setAppState(AppState.SHOWING_PLAN);
        return;
    }
    setAppState(AppState.SWAPPING_MEAL);
    setError(null);

    const { day, mealType } = currentSubstitution;
    
    try {
        const updatedPlan = await generateMealSwap(mealPlanResponse.mainPlan, day, mealType, newMealName, userPreferences);
        setMealPlanResponse({ ...mealPlanResponse, mainPlan: updatedPlan });
        setAppState(AppState.SHOWING_PLAN);
    } catch (err) {
        console.error(err);
        setError('Could not swap the meal. Please try again.');
        setAppState(AppState.SHOWING_PLAN);
    }

  }, [currentSubstitution, mealPlanResponse, userPreferences]);
  
  const handleSwapMeals = useCallback(async (source: { day: string, mealType: string }, target: { day: string, mealType: string }) => {
    if (!mealPlanResponse?.mainPlan || !userPreferences) return;

    // Create a deep copy to manipulate
    const tempPlan = JSON.parse(JSON.stringify(mealPlanResponse.mainPlan)) as MealPlanObject;

    // Perform the swap
    const sourceMeal = tempPlan.mealPlan[source.day][source.mealType];
    const targetMeal = tempPlan.mealPlan[target.day][target.mealType];
    tempPlan.mealPlan[target.day][target.mealType] = sourceMeal;
    tempPlan.mealPlan[source.day][source.mealType] = targetMeal;

    // Immediately update the UI for responsiveness, then rebalance in the background
    setMealPlanResponse(prev => ({ ...prev!, mainPlan: tempPlan }));
    setAppState(AppState.REBALANCING_PLAN);
    setError(null);

    try {
      const rebalancedPlan = await rebalancePlanAfterSwap(tempPlan, userPreferences);
      setMealPlanResponse(prev => ({ ...prev!, mainPlan: rebalancedPlan }));
    } catch (err) {
      console.error(err);
      setError('Could not rebalance the plan after swapping. Please review the plan.');
      // Revert to the pre-API call state if rebalancing fails
      setMealPlanResponse(prev => ({ ...prev!, mainPlan: tempPlan }));
    } finally {
      setAppState(AppState.SHOWING_PLAN);
    }
  }, [mealPlanResponse, userPreferences]);


  const handleStartZeroWasteScan = useCallback(() => {
    setAppState(AppState.ZERO_WASTE_CAMERA);
  }, []);

  const handleZeroWasteImageCapture = useCallback((imageData: string) => {
    if (zeroWasteImages.length < 3) {
      setZeroWasteImages(prev => [...prev, imageData]);
    }
    setAppState(AppState.ZERO_WASTE_FORM);
  }, [zeroWasteImages]);

  const handleOptimize = useCallback((optimization: OptimizationOption) => {
    if (userPreferences) {
      handleCreatePlan(userPreferences, optimization);
    }
  }, [userPreferences, handleCreatePlan]);
  
  const resetApp = () => {
    setAppState(AppState.HOME);
    setPersona(null);
    setUserPreferences(null);
    setMealPlanResponse(null);
    setIdentifiedIngredients(null);
    setSingleRecipe(null);
    setSelectedTrendingRecipe(null);
    setCurrentSubstitution(null);
    setZeroWasteImages([]);
    setError(null);
  }

  const activeStep = useMemo(() => {
    switch (appState) {
      case AppState.ONBOARDING:
        return 0;
      case AppState.PLAN_FORM:
      case AppState.SCANNING_INGREDIENTS:
      case AppState.LOADING_INGREDIENTS:
        return 1;
      case AppState.GENERATING_PLAN:
      case AppState.SWAPPING_MEAL:
      case AppState.REBALANCING_PLAN:
      case AppState.SHOWING_PLAN:
      case AppState.ADJUSTING_PLAN:
        return 2;
      case AppState.SCHEDULING_REMINDERS:
        return 3;
      default:
        return -1; // Don't show stepper for other states
    }
  }, [appState]);

  const renderContent = () => {
    switch (appState) {
      case AppState.HOME:
        return <HomeScreen 
                  onStart={() => setAppState(AppState.ONBOARDING)} 
                  onStartZeroWaste={() => {
                    setZeroWasteImages([]);
                    setAppState(AppState.ZERO_WASTE_FORM);
                  }}
                  onSelectRecipe={handleSelectTrendingRecipe}
                />;
      case AppState.ONBOARDING:
        return <OnboardingScreen onSelect={handlePersonaSelect} />;
      case AppState.PLAN_FORM:
        return <MealPlanForm 
                  persona={persona!}
                  onSubmit={handleCreatePlan} 
                  onScan={() => setAppState(AppState.SCANNING_INGREDIENTS)}
                  initialIngredients={identifiedIngredients || []} 
                  error={error}
                  onBack={() => setAppState(AppState.ONBOARDING)}
               />;
      case AppState.SCANNING_INGREDIENTS:
        return <CameraView onCapture={handleImageCapture} onBack={() => setAppState(AppState.PLAN_FORM)} />;
      case AppState.LOADING_INGREDIENTS:
         return <LoadingSpinner message="Identifying ingredients..." />;
      case AppState.GENERATING_PLAN:
        return <LoadingSpinner message="Generating your custom meal plan..." />;
      case AppState.SWAPPING_MEAL:
        return <LoadingSpinner message="Updating your meal..." />;
      case AppState.REBALANCING_PLAN:
        return <LoadingSpinner message="Rebalancing your plan..." />;
      case AppState.SHOWING_PLAN:
        return <MealPlanView 
                  response={mealPlanResponse!} 
                  onOptimize={handleOptimize} 
                  onStartOver={resetApp} 
                  onShowSubstitutions={handleShowSubstitutions}
                  onSchedule={() => setAppState(AppState.SCHEDULING_REMINDERS)}
                  onSwapMeals={handleSwapMeals}
                />;
      case AppState.SCHEDULING_REMINDERS:
        return <SchedulerView 
                  mealPlan={mealPlanResponse?.mainPlan || mealPlanResponse?.budgetAlternatives[0]!}
                  onBack={() => setAppState(AppState.SHOWING_PLAN)}
                  onComplete={resetApp}
               />;
      case AppState.SHOWING_SUBSTITUTIONS:
        return <SubstitutionsView substitution={currentSubstitution!.sub} onBack={() => setAppState(AppState.SHOWING_PLAN)} onSwap={handleSwapMeal} />;
      case AppState.ZERO_WASTE_FORM:
        return <ZeroWasteForm 
                  onGenerate={handleGenerateRecipe} 
                  onBack={resetApp} 
                  onTakePhoto={handleStartZeroWasteScan}
                  images={zeroWasteImages}
                  onSetImages={setZeroWasteImages}
                />;
      case AppState.ZERO_WASTE_CAMERA:
        return <CameraView onCapture={handleZeroWasteImageCapture} onBack={() => setAppState(AppState.ZERO_WASTE_FORM)} />;
      case AppState.GENERATING_RECIPE:
        return <LoadingSpinner message="Whipping up a zero-waste recipe..." />;
      case AppState.SHOWING_RECIPE:
        return <RecipeView recipe={singleRecipe!} onStartOver={resetApp} />;
      case AppState.SHOWING_TRENDING_RECIPE:
        return <RecipeView recipe={selectedTrendingRecipe!} onStartOver={resetApp} />;
      default:
        return <HomeScreen onStart={() => setAppState(AppState.ONBOARDING)} onStartZeroWaste={() => setAppState(AppState.ZERO_WASTE_FORM)} onSelectRecipe={handleSelectTrendingRecipe} />;
    }
  };

  const steps = ['Persona', 'Preferences', 'Meal Plan', 'Schedule'];

  return (
    <div className="min-h-screen font-sans antialiased text-text-primary dark:text-dark-text-primary bg-background dark:bg-dark-background transition-colors duration-300">
      <header className="bg-card dark:bg-dark-card shadow-md sticky top-0 z-50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-20">
                  <div className="flex items-center cursor-pointer" onClick={resetApp} aria-label="Go to Home">
                      <LeafIcon className="h-10 w-10 text-primary dark:text-dark-primary" />
                      <div className="ml-4">
                        <h1 className="text-xl font-bold font-display text-primary-dark dark:text-dark-primary-dark tracking-wide">COOKSY</h1>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Your Smart Kitchen Assistant</p>
                      </div>
                  </div>
                  <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
              </div>
          </div>
      </header>
      <main>
        {activeStep > -1 && <Stepper steps={steps} activeStep={activeStep} />}
        <Suspense fallback={<LoadingSpinner message="Loading..." />}>
          {renderContent()}
        </Suspense>
      </main>
    </div>
  );
};

export default App;
