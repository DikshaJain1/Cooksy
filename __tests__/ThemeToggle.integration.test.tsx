import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// FIX: Import jest-dom to extend Jest's expect with matchers like .toBeInTheDocument()
import '@testing-library/jest-dom';
// FIX: Add 'jest' to the import from @jest/globals to resolve 'Cannot find name' errors.
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import App from '../App';

describe('ThemeToggle Integration Test', () => {

  beforeEach(() => {
    // Mock matchMedia for consistent testing environment
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false, // Default to light mode
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should display the header and theme toggle on all pages', async () => {
    render(<App />);
    
    // 1. Check on Home Screen
    expect(screen.getByText('COOKSY')).toBeInTheDocument();
    expect(screen.getByText('Your Smart Kitchen Assistant')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Switch to dark mode/i })).toBeInTheDocument();

    // 2. Navigate to Meal Plan Form
    fireEvent.click(screen.getByRole('button', { name: /Start Planning/i }));
    await waitFor(() => {
      expect(screen.getByText('Create Your Meal Plan')).toBeInTheDocument();
    });

    // Header should still be visible
    expect(screen.getByText('COOKSY')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Switch to dark mode/i })).toBeInTheDocument();
  });

  it('should toggle the theme and persist it in localStorage', () => {
    render(<App />);

    const toggleButton = screen.getByRole('button', { name: /Switch to dark mode/i });
    const rootElement = document.documentElement;

    // Initial state should be 'light'
    expect(rootElement).toHaveClass('light');
    expect(rootElement).not.toHaveClass('dark');
    expect(localStorage.getItem('cooksy-theme')).toBe('light');
    
    // Click to switch to dark mode
    fireEvent.click(toggleButton);

    // Check for dark mode
    expect(rootElement).toHaveClass('dark');
    expect(rootElement).not.toHaveClass('light');
    expect(toggleButton).toHaveAttribute('aria-label', 'Switch to light mode');
    expect(localStorage.getItem('cooksy-theme')).toBe('dark');
    
    // Click to switch back to light mode
    fireEvent.click(toggleButton);

    // Check for light mode again
    expect(rootElement).toHaveClass('light');
    expect(rootElement).not.toHaveClass('dark');
    expect(toggleButton).toHaveAttribute('aria-label', 'Switch to dark mode');
    expect(localStorage.getItem('cooksy-theme')).toBe('light');
  });

  it('should load the theme from localStorage on initial render', () => {
    // Set the theme in localStorage before the component mounts
    localStorage.setItem('cooksy-theme', 'dark');

    render(<App />);

    const rootElement = document.documentElement;
    expect(rootElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: /Switch to light mode/i })).toBeInTheDocument();
  });

});