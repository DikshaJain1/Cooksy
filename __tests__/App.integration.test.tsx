import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import App from '../App';
import * as geminiService from '../services/geminiService';
import { MealPlanResponse } from '../types';

// Mock the entire geminiService
jest.mock('../services/geminiService');

// @google/genai-api-fix: Correctly type the mock function to avoid `never` type inference issues with mockResolvedValueOnce.
// By explicitly providing the return type Promise<MealPlanResponse>, TypeScript can correctly infer the argument type for mockResolvedValueOnce.
// FIX: The generic for jest.Mock must be a function signature, not a raw Promise type.
const mockGenerateMealPlan = geminiService.generateMealPlan as jest.Mock<() => Promise<MealPlanResponse>>;

describe('App Integration Test', () => {

  beforeEach(() => {
    mockGenerateMealPlan.mockReset();
  });

  it('should navigate the full meal plan generation flow', async () => {
    // 1. Render the App - It should start on the HomeScreen
    render(<App />);
    expect(screen.getByText('Cooksy')).toBeInTheDocument();
    expect(screen.getByText('Your smart kitchen assistant.')).toBeInTheDocument();

    // 2. User clicks "Start Planning" to go to the OnboardingScreen, then selects a persona to get to MealPlanForm
    fireEvent.click(screen.getByRole('button', { name: /Start Planning/i }));
    await waitFor(() => {
        expect(screen.getByText('Welcome to Cooksy!')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Select Working Professional persona/i }));


    // 3. Wait for the MealPlanForm to be visible (due to lazy loading)
    await waitFor(() => {
      // FIX: The title on the form is "Your Preferences", not "Create Your Meal Plan".
      expect(screen.getByText('Your Preferences')).toBeInTheDocument();
    });

    // 4. User fills out the form
    fireEvent.change(screen.getByLabelText(/City Type/i), { target: { value: 'Metro' } });
    fireEvent.change(screen.getByLabelText(/Diet Type/i), { target: { value: 'veg' } });
    fireEvent.change(screen.getByLabelText(/Taste Preference/i), { target: { value: 'Spicy' } });
    fireEvent.change(screen.getByLabelText(/Budget per day/i), { target: { value: '600' } });
    fireEvent.change(screen.getByLabelText(/Time per meal/i), { target: { value: '25' } });
    fireEvent.click(screen.getByLabelText('Full'));
    fireEvent.change(screen.getByLabelText(/Ingredients available/i), { target: { value: 'chickpeas, spinach, feta cheese, cucumber, bell pepper' } });
    
    // 5. Mock the API response
    const mockApiResponse: MealPlanResponse = {
      mainPlan: {
        planTitle: 'Spicy Veggie Delight Plan',
        // FIX: The MealPlanObject type requires Day 1, 2, and 3.
        mealPlan: {
          'Day 1': { Breakfast: 'Oatmeal', Lunch: 'Chickpea Salad', Dinner: 'Spinach Curry' },
          'Day 2': { Breakfast: 'Cereal', Lunch: 'Sandwich', Dinner: 'Soup' },
          'Day 3': { Breakfast: 'Toast', Lunch: 'Leftovers', Dinner: 'Rice' },
        },
        groceryList: { Produce: ['Onion'], Grains: [], Spices: ['Chili Powder'] },
        // FIX: The MealPlanObject type requires Day 1, 2, and 3.
        cookingSequence: {
          'Day 1': { Breakfast: ['Boil water'], Lunch: ['Mix ingredients'], Dinner: ['Cook curry'] },
          'Day 2': { Breakfast: [], Lunch: [], Dinner: [] },
          'Day 3': { Breakfast: [], Lunch: [], Dinner: [] },
        },
        substitutions: [],
        usingYourIngredients: ['chickpeas', 'spinach'],
        basedOnYourInputs: 'Based on your spicy preference and available ingredients.'
      },
      budgetAlternatives: [],
    };
    // FIX: Correctly type the mock function to avoid `never` type inference issues with mockResolvedValueOnce.
    mockGenerateMealPlan.mockResolvedValueOnce(mockApiResponse);

    // 6. User submits the form
    const generateButton = screen.getByRole('button', { name: /Generate Meal Plan/i });
    fireEvent.click(generateButton);

    // 7. App should show a loading spinner
    await waitFor(() => {
      expect(screen.getByText('Generating your custom meal plan...')).toBeInTheDocument();
    });

    // 8. Wait for the MealPlanView to render with the API response
    await waitFor(() => {
      expect(screen.getByText('Spicy Veggie Delight Plan')).toBeInTheDocument();
    });

    // Verify content from the mock response is on the screen
    expect(screen.getByText('Chickpea Salad')).toBeInTheDocument();
    expect(screen.getByText('Spinach Curry')).toBeInTheDocument();
    expect(screen.getByText('Based on your spicy preference and available ingredients.')).toBeInTheDocument();
    
    // Check if the service was called correctly
    expect(mockGenerateMealPlan).toHaveBeenCalledTimes(1);
    expect(mockGenerateMealPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        diet: 'veg',
        ingredients: ['chickpeas', 'spinach', 'feta cheese', 'cucumber', 'bell pepper'],
        kitchenSetup: 'full'
      }),
      null
    );
  });
});
