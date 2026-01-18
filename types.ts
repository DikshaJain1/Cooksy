
export enum AppState {
  ONBOARDING, // New: Start of the user flow
  PLAN_FORM,
  GENERATING_PLAN,
  SHOWING_PLAN,
  ADJUSTING_PLAN, // New: When user wants to tweak the plan
  SCHEDULING_REMINDERS, // New: The final step for calendar automation
  SWAPPING_MEAL, // New: For handling the partial recomputation of a meal swap
  REBALANCING_PLAN, // New: For handling post-swap grocery/prep updates.
  
  // Existing states, now integrated into the flow
  SCANNING_INGREDIENTS,
  LOADING_INGREDIENTS,
  ZERO_WASTE_FORM,
  ZERO_WASTE_CAMERA,
  GENERATING_RECIPE,
  SHOWING_RECIPE,
  SHOWING_TRENDING_RECIPE,
  SHOWING_SUBSTITUTIONS,
  HOME, // Kept for reset/initial state before flow begins
}

export type Persona = 'Working Professional' | 'Student' | 'Household';

export interface UserPreferences {
  cityType: 'Metro' | 'Tier-2' | 'Tier-3';
  diet: 'veg' | 'non-veg' | 'eggitarian' | 'vegan';
  taste: 'Sweet' | 'Salty' | 'Spicy' | 'Indian' | 'North Indian' | 'South Indian' | 'Punjabi' | 'Maharashtrian' | 'Gujarati' | 'Rajasthani' | 'Bengali' | 'Kerala' | 'Andhra' | 'Tamil' | 'Hyderabadi' | 'Mughlai' | 'Italian' | 'Western' | 'Chinese' | 'Indo-Chinese' | 'Japanese' | 'Korean' | 'Thai' | 'Mexican' | 'American' | 'French' | 'Spanish' | 'Mediterranean' | 'Middle Eastern' | 'Lebanese' | 'Turkish' | 'Greek' | 'Vietnamese' | 'Asian Fusion' | 'Continental' | 'Street Food' | 'Fast Food' | 'Vegan' | 'Vegetarian' | 'Jain' | 'Keto' | 'High-Protein' | 'Low-Carb' | 'Random';
  budget: string;
  time: string;
  kitchenSetup: 'basic' | 'medium' | 'full';
  ingredients: string[];
  avoidIngredients: string[];
}

export type OptimizationOption = 'Tastier' | 'Higher protein' | 'Cheapest' | 'Fastest';

export interface Substitution {
    meal: string;
    original: string;
    substitute1: string;
    substitute2: string;
}

export interface MealPlanObject {
  planTitle: string;
  mealPlan: {
    "Day 1": { Breakfast: string; Lunch: string; Dinner: string; };
    "Day 2": { Breakfast: string; Lunch: string; Dinner: string; };
    "Day 3": { Breakfast: string; Lunch: string; Dinner: string; };
    [day: string]: {
      Breakfast: string;
      Lunch: string;
      Dinner: string;
    };
  };
  groceryList: {
    Produce: string[];
    Grains: string[];
    Spices: string[];
    [key: string]: string[]; // Allow other categories
  };
  cookingSequence: {
    "Day 1": { Breakfast: string[]; Lunch: string[]; Dinner: string[]; };
    "Day 2": { Breakfast: string[]; Lunch: string[]; Dinner: string[]; };
    "Day 3": { Breakfast: string[]; Lunch: string[]; Dinner: string[]; };
    [day: string]: {
      Breakfast: string[];
      Lunch: string[];
      Dinner: string[];
    };
  };
  substitutions: Substitution[];
  usingYourIngredients: string[];
  basedOnYourInputs: string;
}

export interface MealPlanResponse {
  mainPlan: MealPlanObject | null;
  budgetAlternatives: MealPlanObject[];
}

export interface SingleRecipe {
  recipeName: string;
  description: string;
  ingredients: Array<{
    name: string;
    notes: string;
  }>;
  instructions: string[];
}

// --- New Types for Smart Scheduling ---

export interface ReminderPreferences {
  reminderTime: 'Morning' | 'Evening';
  cookingTimeWindow: '6-8 PM' | '7-9 PM' | '8-10 PM';
  remindersPerDay: '1' | '2';
}

export interface CalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string; // ISO 8601 format
    timeZone: string;
  };
  end: {
    dateTime: string; // ISO 8601 format
    timeZone: string;
  };
  recurrence?: string[]; // For RRULE, e.g., ['FREQ=DAILY;COUNT=3']
}
