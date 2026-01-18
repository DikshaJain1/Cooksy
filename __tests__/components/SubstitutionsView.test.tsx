
import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubstitutionsView from '../../components/SubstitutionsView';
import { Substitution } from '../../types';

// Mock the MealImage child component
jest.mock('../../components/MealPlanView', () => ({
  MealImage: jest.fn(({ mealName }) => <img alt={mealName} />),
}));


describe('SubstitutionsView', () => {
  const mockOnBack = jest.fn();
  const mockOnSwap = jest.fn();
  
  const mockSubstitution: Substitution = {
    meal: 'Dinner',
    original: 'Chicken Curry',
    substitute1: 'Tofu Curry',
    substitute2: 'Chickpea Curry',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  it('renders all substitution details with adaptive labels', () => {
    render(<SubstitutionsView substitution={mockSubstitution} onBack={mockOnBack} onSwap={mockOnSwap} />);

    // Check header and original item
    expect(screen.getByText('Flexible Meal Options')).toBeInTheDocument();
    expect(screen.getByText(/Instead of/)).toHaveTextContent('Chicken Curry');

    // Check that new adaptive labels are present
    expect(screen.getByText('Prep-Light Alternative')).toBeInTheDocument();
    expect(screen.getByText('Easy Fallback')).toBeInTheDocument();

    // Check both substitutes are rendered
    expect(screen.getByText('Tofu Curry')).toBeInTheDocument();
    expect(screen.getByText('Chickpea Curry')).toBeInTheDocument();
  });

  it('calls onBack when the "Back to Meal Plan" button is clicked', () => {
    render(<SubstitutionsView substitution={mockSubstitution} onBack={mockOnBack} onSwap={mockOnSwap} />);
    
    const backButton = screen.getByRole('button', { name: /Back to Meal Plan/i });
    fireEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls onSwap with the correct meal when a swap button is clicked', () => {
    render(<SubstitutionsView substitution={mockSubstitution} onBack={mockOnBack} onSwap={mockOnSwap} />);
    
    // There are two buttons with this name, so we use getAllByRole
    const firstSwapButton = screen.getAllByRole('button', { name: /Swap for this/i })[0];
    fireEvent.click(firstSwapButton);

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(mockOnSwap).toHaveBeenCalledTimes(1);
    expect(mockOnSwap).toHaveBeenCalledWith('Tofu Curry');
  });
});
