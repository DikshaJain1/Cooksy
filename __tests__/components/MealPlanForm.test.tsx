import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MealPlanForm from '../../components/MealPlanForm';

describe('MealPlanForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnScan = jest.fn();
  // FIX: Add mock for onBack prop
  const mockOnBack = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnScan.mockClear();
    // FIX: Clear onBack mock
    mockOnBack.mockClear();
  });

  it('renders all form fields correctly', () => {
    // FIX: Add missing persona and onBack props
    render(<MealPlanForm persona="Student" onSubmit={mockOnSubmit} onScan={mockOnScan} initialIngredients={[]} error={null} onBack={mockOnBack} />);
    
    expect(screen.getByLabelText(/City Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Diet Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Taste Preference/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Budget per day/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Time per meal/i)).toBeInTheDocument();
    expect(screen.getByText(/Ingredients available/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Meal Plan/i })).toBeInTheDocument();
  });

  it('displays an error message if submitted with empty fields', () => {
    // FIX: Add missing persona and onBack props
    render(<MealPlanForm persona="Student" onSubmit={mockOnSubmit} onScan={mockOnScan} initialIngredients={[]} error={null} onBack={mockOnBack} />);
    
    const submitButton = screen.getByRole('button', { name: /Generate Meal Plan/i });
    fireEvent.click(submitButton);

    expect(screen.getByRole('alert')).toHaveTextContent('Please fill out all preference fields.');
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays an error message if fewer than 3 ingredients are provided', () => {
    // FIX: Add missing persona and onBack props
    render(<MealPlanForm persona="Student" onSubmit={mockOnSubmit} onScan={mockOnScan} initialIngredients={[]} error={null} onBack={mockOnBack} />);
    
    // Fill preferences but not enough ingredients
    fireEvent.change(screen.getByLabelText(/City Type/i), { target: { value: 'Metro' } });
    fireEvent.change(screen.getByLabelText(/Diet Type/i), { target: { value: 'veg' } });
    fireEvent.change(screen.getByLabelText(/Taste Preference/i), { target: { value: 'Spicy' } });
    fireEvent.change(screen.getByLabelText(/Budget per day/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/Time per meal/i), { target: { value: '30' } });
    fireEvent.click(screen.getByLabelText('Basic'));
    // FIX: Corrected ingredient count to match validation rule (less than 3)
    fireEvent.change(screen.getByPlaceholderText(/Type ingredients here/i), { target: { value: 'rice, onion' } });

    fireEvent.click(screen.getByRole('button', { name: /Generate Meal Plan/i }));

    // FIX: Corrected error message to match new validation rule (at least 3)
    expect(screen.getByRole('alert')).toHaveTextContent('At least 3 ingredients are required.');
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with correct data when form is valid', () => {
    // FIX: Add missing persona and onBack props
    render(<MealPlanForm persona="Student" onSubmit={mockOnSubmit} onScan={mockOnScan} initialIngredients={[]} error={null} onBack={mockOnBack} />);

    // Fill all fields correctly
    fireEvent.change(screen.getByLabelText(/City Type/i), { target: { value: 'Metro' } });
    fireEvent.change(screen.getByLabelText(/Diet Type/i), { target: { value: 'veg' } });
    fireEvent.change(screen.getByLabelText(/Taste Preference/i), { target: { value: 'Spicy' } });
    fireEvent.change(screen.getByLabelText(/Budget per day/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/Time per meal/i), { target: { value: '30' } });
    fireEvent.click(screen.getByLabelText('Medium'));
    fireEvent.change(screen.getByPlaceholderText(/Type ingredients here/i), { target: { value: 'rice, onion, tomato, garlic, chili, beans' } });
    fireEvent.change(screen.getByPlaceholderText(/Optional: e.g., peanuts, gluten, dairy/i), { target: { value: 'peanuts' } });

    fireEvent.click(screen.getByRole('button', { name: /Generate Meal Plan/i }));

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      cityType: 'Metro',
      diet: 'veg',
      taste: 'Spicy',
      budget: '500',
      time: '30',
      kitchenSetup: 'medium',
      ingredients: ['rice', 'onion', 'tomato', 'garlic', 'chili', 'beans'],
      avoidIngredients: ['peanuts'],
    }));
  });
});

// Note: To run these tests, a testing environment like Jest with React Testing Library needs to be set up.
// `npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom`
// Configure Jest to use ts-jest and a DOM environment (jsdom).