import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
// FIX: Import jest-dom to extend Jest's expect with matchers like .toBeInTheDocument()
import '@testing-library/jest-dom';
import RecipeView from '../../components/RecipeView';
import { SingleRecipe } from '../../types';

describe('RecipeView', () => {
  const mockOnStartOver = jest.fn();

  const mockRecipe: SingleRecipe = {
    recipeName: 'Spicy Lentil Soup',
    description: 'A warm and hearty soup, perfect for a cold day.',
    ingredients: [
      { name: 'Lentils', notes: 'Pantry staple' },
      { name: 'Onion', notes: 'From your images' },
      { name: 'Carrot', notes: 'From your images' },
    ],
    instructions: [
      'Sauté the onion and carrot.',
      'Add lentils and broth.',
      'Simmer for 25 minutes.',
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all recipe details correctly', () => {
    render(<RecipeView recipe={mockRecipe} onStartOver={mockOnStartOver} />);

    expect(screen.getByText('Spicy Lentil Soup')).toBeInTheDocument();
    expect(screen.getByText('A warm and hearty soup, perfect for a cold day.')).toBeInTheDocument();

    // Check ingredients
    expect(screen.getByText('Lentils')).toBeInTheDocument();
    expect(screen.getByText('Pantry staple')).toBeInTheDocument();
    expect(screen.getByText('Onion')).toBeInTheDocument();
    expect(screen.getByText('From your images')).toBeInTheDocument();

    // Check instructions
    expect(screen.getByText(/Sauté the onion and carrot/i)).toBeInTheDocument();
    expect(screen.getByText(/Add lentils and broth/i)).toBeInTheDocument();
    expect(screen.getByText(/Simmer for 25 minutes/i)).toBeInTheDocument();
  });

  it('calls onStartOver when the "Start Over" button is clicked', () => {
    render(<RecipeView recipe={mockRecipe} onStartOver={mockOnStartOver} />);
    
    const startOverButton = screen.getByRole('button', { name: /Start Over/i });
    fireEvent.click(startOverButton);
    
    expect(mockOnStartOver).toHaveBeenCalledTimes(1);
  });
});