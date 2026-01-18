
import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MealPlanView from '../../components/MealPlanView';
import { MealPlanResponse } from '../../types';

// Mock the child component to avoid dealing with its internal useEffect and API calls
jest.mock('../../components/MealPlanView', () => ({
  ...(jest.requireActual('../../components/MealPlanView') as object),
  MealImage: jest.fn(({ mealName }) => <img alt={mealName} />),
}));

describe('MealPlanView', () => {
  const mockOnOptimize = jest.fn();
  const mockOnStartOver = jest.fn();
  const mockOnShowSubstitutions = jest.fn();
  const mockOnSchedule = jest.fn();
  const mockOnSwapMeals = jest.fn();

  const mockResponse: MealPlanResponse = {
    mainPlan: {
      planTitle: 'My Delicious Plan',
      mealPlan: {
        'Day 1': { Breakfast: 'Oats', Lunch: 'Salad', Dinner: 'Curry' },
        'Day 2': { Breakfast: 'Cereal', Lunch: 'Sandwich', Dinner: 'Soup' },
        'Day 3': { Breakfast: 'Toast', Lunch: 'Leftovers', Dinner: 'Rice' },
      },
      groceryList: { Produce: ['Onion'], Grains: ['Oats'], Spices: ['Turmeric'] },
      cookingSequence: {
        'Day 1': { Breakfast: ['Cook oats'], Lunch: ['Mix salad'], Dinner: ['Make curry'] },
        'Day 2': { Breakfast: [], Lunch: [], Dinner: [] },
        'Day 3': { Breakfast: [], Lunch: [], Dinner: [] },
      },
      substitutions: [{ meal: 'Dinner', original: 'Curry', substitute1: 'Pasta', substitute2: 'Soup' }],
      usingYourIngredients: ['Oats', 'Onion'],
      basedOnYourInputs: 'A great plan for you.',
    },
    budgetAlternatives: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main meal plan correctly', () => {
    render(<MealPlanView response={mockResponse} onOptimize={mockOnOptimize} onStartOver={mockOnStartOver} onShowSubstitutions={mockOnShowSubstitutions} onSchedule={mockOnSchedule} onSwapMeals={mockOnSwapMeals} />);
    
    expect(screen.getByText('My Delicious Plan')).toBeInTheDocument();
    expect(screen.getByText('Oats')).toBeInTheDocument();
    expect(screen.getByText('Curry')).toBeInTheDocument();
    expect(screen.getByText('Grocery List')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Substitutions/i })).toBeInTheDocument();
  });

  it('renders budget alternatives when mainPlan is null', () => {
    const budgetResponse: MealPlanResponse = {
      mainPlan: null,
      budgetAlternatives: [
          { ...mockResponse.mainPlan!, planTitle: 'Budget Plan A' },
      ],
    };
    render(<MealPlanView response={budgetResponse} onOptimize={mockOnOptimize} onStartOver={mockOnStartOver} onShowSubstitutions={mockOnShowSubstitutions} onSchedule={mockOnSchedule} onSwapMeals={mockOnSwapMeals} />);
    
    expect(screen.getByText('Budget Exceeded')).toBeInTheDocument();
    expect(screen.getByText('Budget Plan A')).toBeInTheDocument();
    expect(screen.queryByText('My Delicious Plan')).not.toBeInTheDocument();
  });

  it('calls onOptimize with the correct option when an optimization button is clicked', () => {
    render(<MealPlanView response={mockResponse} onOptimize={mockOnOptimize} onStartOver={mockOnStartOver} onShowSubstitutions={mockOnShowSubstitutions} onSchedule={mockOnSchedule} onSwapMeals={mockOnSwapMeals} />);
    
    const cheapestButton = screen.getByRole('button', { name: /Cheapest/i });
    fireEvent.click(cheapestButton);
    
    expect(mockOnOptimize).toHaveBeenCalledTimes(1);
    expect(mockOnOptimize).toHaveBeenCalledWith('Cheapest');
  });

  it('calls onShowSubstitutions when the substitutions button is clicked', () => {
    render(<MealPlanView response={mockResponse} onOptimize={mockOnOptimize} onStartOver={mockOnStartOver} onShowSubstitutions={mockOnShowSubstitutions} onSchedule={mockOnSchedule} onSwapMeals={mockOnSwapMeals} />);
    
    const subsButton = screen.getByRole('button', { name: /Substitutions/i });
    fireEvent.click(subsButton);
    
    expect(mockOnShowSubstitutions).toHaveBeenCalledTimes(1);
    expect(mockOnShowSubstitutions).toHaveBeenCalledWith(mockResponse.mainPlan?.substitutions[0], 'Day 1', 'Dinner');
  });
  
  // EFFICIENCY TEST: 5. Integration Test - Fallback meals always exist
  describe('Fallback Meal UI', () => {
      it('renders a substitution button if fallback meals exist in the data', () => {
        render(<MealPlanView response={mockResponse} onOptimize={mockOnOptimize} onStartOver={mockOnStartOver} onShowSubstitutions={mockOnShowSubstitutions} onSchedule={mockOnSchedule} onSwapMeals={mockOnSwapMeals} />);
        expect(mockResponse.mainPlan!.substitutions.length).toBeGreaterThan(0);
        const subsButtons = screen.getAllByRole('button', { name: /Substitutions/i });
        expect(subsButtons.length).toBeGreaterThan(0);
    });

    it('does not render a substitution button if no fallback meals exist', () => {
        const responseWithoutSubs: MealPlanResponse = {
            ...mockResponse,
            mainPlan: {
                ...mockResponse.mainPlan!,
                substitutions: [],
            }
        };
        render(<MealPlanView response={responseWithoutSubs} onOptimize={mockOnOptimize} onStartOver={mockOnStartOver} onShowSubstitutions={mockOnShowSubstitutions} onSchedule={mockOnSchedule} onSwapMeals={mockOnSwapMeals} />);
        expect(screen.queryByRole('button', { name: /Substitutions/i })).not.toBeInTheDocument();
    });
  });
});
