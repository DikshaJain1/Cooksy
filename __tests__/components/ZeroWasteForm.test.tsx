import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
// FIX: Import jest-dom to extend Jest's expect with matchers like .toBeInTheDocument()
import '@testing-library/jest-dom';
import ZeroWasteForm from '../../components/ZeroWasteForm';

describe('ZeroWasteForm', () => {
  const mockOnGenerate = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnTakePhoto = jest.fn();
  const mockOnSetImages = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form and initial state correctly', () => {
    render(<ZeroWasteForm onGenerate={mockOnGenerate} onBack={mockOnBack} onTakePhoto={mockOnTakePhoto} images={[]} onSetImages={mockOnSetImages} />);
    
    expect(screen.getByText('Zero-Waste Optimizer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload File/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Take Photo/i })).toBeInTheDocument();
    const generateButton = screen.getByRole('button', { name: /Generate Recipe/i });
    expect(generateButton).toBeInTheDocument();
    expect(generateButton).toBeDisabled();
  });

  it('calls onTakePhoto when the "Take Photo" button is clicked', () => {
    render(<ZeroWasteForm onGenerate={mockOnGenerate} onBack={mockOnBack} onTakePhoto={mockOnTakePhoto} images={[]} onSetImages={mockOnSetImages} />);
    fireEvent.click(screen.getByRole('button', { name: /Take Photo/i }));
    expect(mockOnTakePhoto).toHaveBeenCalledTimes(1);
  });

  it('enables the "Generate Recipe" button when images are present', () => {
    render(<ZeroWasteForm onGenerate={mockOnGenerate} onBack={mockOnBack} onTakePhoto={mockOnTakePhoto} images={['image1.jpg']} onSetImages={mockOnSetImages} />);
    const generateButton = screen.getByRole('button', { name: /Generate Recipe/i });
    expect(generateButton).toBeEnabled();
  });

  it('calls onGenerate with the correct images when submitted', () => {
    const images = ['image1.jpg', 'image2.png'];
    render(<ZeroWasteForm onGenerate={mockOnGenerate} onBack={mockOnBack} onTakePhoto={mockOnTakePhoto} images={images} onSetImages={mockOnSetImages} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Generate Recipe/i }));
    expect(mockOnGenerate).toHaveBeenCalledWith(images);
  });

  it('displays an error if submission is attempted with no images', () => {
    render(<ZeroWasteForm onGenerate={mockOnGenerate} onBack={mockOnBack} onTakePhoto={mockOnTakePhoto} images={[]} onSetImages={mockOnSetImages} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Generate Recipe/i }));
    
    expect(screen.getByRole('alert')).toHaveTextContent('Please upload at least one image.');
    expect(mockOnGenerate).not.toHaveBeenCalled();
  });

  it('calls onSetImages to remove an image', () => {
    const images = ['image1.jpg'];
    render(<ZeroWasteForm onGenerate={mockOnGenerate} onBack={mockOnBack} onTakePhoto={mockOnTakePhoto} images={images} onSetImages={mockOnSetImages} />);
    
    const removeButton = screen.getByLabelText(/Remove image 1/i);
    fireEvent.click(removeButton);
    
    expect(mockOnSetImages).toHaveBeenCalledTimes(1);
    // The component itself doesn't perform the filtering, it calls the prop.
    // So we can't check the result, just that the callback was invoked.
  });
});