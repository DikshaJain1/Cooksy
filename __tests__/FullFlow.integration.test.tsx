import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import App from '../App';
import * as geminiService from '../services/geminiService';
import * as googleApiService from '../services/googleApiService';
import { MealPlanResponse, MealPlanObject } from '../types';

// Mock entire services
jest.mock('../services/geminiService');
jest.mock('../services/googleApiService');

// @google/genai-api-fix: Correctly type the mock functions to avoid `never` type inference issues with mockResolvedValueOnce.
// By explicitly providing the return types, TypeScript can correctly infer the argument types for mockResolvedValueOnce.
// FIX: The generic for jest.Mock must be a function signature, not a raw Promise type.
const mockGenerateMealPlan = geminiService.generateMealPlan as jest.Mock<() => Promise<MealPlanResponse>>;
const mockGenerateMealSwap = geminiService.generateMealSwap as jest.Mock<() => Promise<MealPlanObject>>;
const mockRebalancePlanAfterSwap = geminiService.rebalancePlanAfterSwap as jest.Mock<() => Promise<MealPlanObject>>;
const mockCreateCalendarEvents = googleApiService.googleApiService.createCalendarEvents as jest.Mock;

describe('Full User Flow Integration Test', () => {

  beforeEach(() => {
    mockGenerateMealPlan.mockReset();
    mockGenerateMealSwap.mockReset();
    mockRebalancePlanAfterSwap.mockReset();
    mockCreateCalendarEvents.mockReset();
    localStorage.clear();
  });

  const mockInitialPlan: MealPlanObject = {
      planTitle: 'Student Budget Plan',
      mealPlan: { 
          'Day 1': { Breakfast: 'Oats', Lunch: 'Sandwich', Dinner: 'Pasta' }, 
          'Day 2': { Breakfast: 'Cereal', Lunch: 'Leftover Pasta', Dinner: 'Rice and Beans' },
          'Day 3': { Breakfast: 'Toast', Lunch: 'Salad', Dinner: 'Khichdi' }
      },
      groceryList: { Produce: ['Onion'], Grains: ['Oats', 'Pasta', 'Rice'], Spices: [] },
      cookingSequence: { 
        'Day 1': { Breakfast: [], Lunch: [], Dinner: ['Boil pasta'] }, 
        'Day 2': { Breakfast: [], Lunch: [], Dinner: ['Cook rice'] },
        'Day 3': { Breakfast: [], Lunch: [], Dinner: ['Cook khichdi'] }
      },
      substitutions: [{ meal: 'Dinner', original: 'Pasta', substitute1: 'Risotto', substitute2: 'Noodles' }],
      usingYourIngredients: ['Pasta', 'Rice', 'Onion'],
      basedOnYourInputs: 'A plan for a student on a budget.'
  };
  
  // This mock represents the final, rebalanced state after the swap
  const mockRebalancedPlan: MealPlanObject = {
      ...mockInitialPlan,
      planTitle: 'Student Budget Plan', // Title doesn't change on rebalance
      mealPlan: { // The core meal swap
          'Day 1': { Breakfast: 'Oats', Lunch: 'Sandwich', Dinner: 'Rice and Beans' }, 
          'Day 2': { Breakfast: 'Cereal', Lunch: 'Leftover Pasta', Dinner: 'Pasta' },
          'Day 3': { Breakfast: 'Toast', Lunch: 'Salad', Dinner: 'Khichdi' }
      },
      // Derived properties are recomputed
      groceryList: { Produce: ['Onion'], Grains: ['Oats', 'Rice', 'Pasta'], Spices: [] },
      cookingSequence: { 
        'Day 1': { Breakfast: [], Lunch: [], Dinner: ['Cook rice'] }, 
        'Day 2': { Breakfast: [], Lunch: [], Dinner: ['Boil pasta'] },
        'Day 3': { Breakfast: [], Lunch: [], Dinner: ['Cook khichdi'] }
      },
  };


  it('should handle onboarding, 3-day plan gen, a drag-and-drop swap, and calendar rebuild', async () => {
    render(<App />);
    
    // --- Step 1 & 2: Onboarding, Preferences, and Initial Plan Generation ---
    fireEvent.click(screen.getByRole('button', { name: /Start Planning/i }));
    await waitFor(() => { expect(screen.getByText('Welcome to Cooksy!')).toBeInTheDocument(); });
    fireEvent.click(screen.getByRole('button', { name: /Select Student persona/i }));
    await waitFor(() => { expect(screen.getByText('Your Preferences')).toBeInTheDocument(); });
    fireEvent.change(screen.getByLabelText(/Ingredients available/i), { target: { value: 'pasta, rice, onion' } });
    fireEvent.change(screen.getByLabelText(/City Type/i), { target: { value: 'Metro' } });
    fireEvent.change(screen.getByLabelText(/Diet Type/i), { target: { value: 'veg' } });
    fireEvent.change(screen.getByLabelText(/Taste Preference/i), { target: { value: 'Italian' } });
    // FIX: Correctly type the mock function to avoid `never` type inference issues with mockResolvedValueOnce.
    mockGenerateMealPlan.mockResolvedValueOnce({ mainPlan: mockInitialPlan, budgetAlternatives: [] });
    fireEvent.click(screen.getByRole('button', { name: /Generate Meal Plan/i }));
    await waitFor(() => { expect(screen.getByText('Student Budget Plan')).toBeInTheDocument(); });
    
    // --- Step 3: Execute Drag-and-Drop Swap ---
    // User wants to swap Day 1 Dinner ("Pasta") with Day 2 Dinner ("Rice and Beans")
    const sourceMealCard = screen.getByLabelText(/Meal: Pasta, Type: Dinner, Day: Day 1. Draggable./i);
    const targetMealCard = screen.getByLabelText(/Meal: Rice and Beans, Type: Dinner, Day: Day 2. Draggable./i);

    // Mock the rebalance API call
    // FIX: Correctly type the mock function to avoid `never` type inference issues with mockResolvedValueOnce.
    mockRebalancePlanAfterSwap.mockResolvedValueOnce(mockRebalancedPlan);

    // Simulate the drag and drop events
    fireEvent.dragStart(sourceMealCard, { dataTransfer: { setData: () => {}, effectAllowed: 'move' }});
    fireEvent.dragEnter(targetMealCard);
    fireEvent.dragOver(targetMealCard);
    fireEvent.drop(targetMealCard);

    // --- Step 4: Assert Incremental Update and Rebalancing ---
    await waitFor(() => { expect(screen.getByText('Rebalancing your plan...')).toBeInTheDocument(); });

    await waitFor(() => {
      // Find the parent containers to check the new positions
      const day1DinnerContainer = screen.getByText('Rice and Beans').closest('div[id="Day 1-Dinner"]');
      const day2DinnerContainer = screen.getByText('Pasta').closest('div[id="Day 2-Dinner"]');

      // Assert that the meals are now in their new positions
      expect(day1DinnerContainer).toBeInTheDocument();
      expect(day2DinnerContainer).toBeInTheDocument();

      // CRITICAL: Assert that other meals were NOT changed
      expect(screen.getByText('Sandwich')).toBeInTheDocument();
      expect(screen.getByText('Leftover Pasta')).toBeInTheDocument();
    });

    // --- Step 5: Assert Calendar Events Rebuilt Correctly ---
    fireEvent.click(screen.getByRole('button', { name: /Next: Schedule Reminders/i }));
    await waitFor(() => { expect(screen.getByText('Your Generated Schedule')).toBeInTheDocument(); });
    
    // Assert that the calendar events have been automatically rebuilt for the swapped days
    expect(screen.getByText('🍳 Meal Prep Session')).toBeInTheDocument();
    // The service consolidates prep steps, so we check for the meals within the description
    const prepEventDescription = screen.getByText(/Time for your main meal prep session/i).textContent;
    expect(prepEventDescription).toContain('Day 1: Rice and Beans');
    expect(prepEventDescription).toContain('Day 2: Pasta');
    expect(prepEventDescription).toContain('Day 3: Khichdi');
  });
});
