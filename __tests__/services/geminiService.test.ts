import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { generateMealPlan, generateImageForRecipe, generateRecipeFromImages, generateMealSwap } from '../../services/geminiService';
import { GoogleGenAI } from '@google/genai';
import { UserPreferences, MealPlanObject } from '../../types';

// @google/genai-api-fix: Create a stable mock function reference to be used by all instances of GoogleGenAI.
// This ensures that we can control and inspect the same mock instance that the service-under-test uses.
// FIX: Cast the mock function to jest.Mock to provide a clear type and avoid 'never' inference issues.
const mockGenerateContent = jest.fn() as jest.Mock;

// Mock the entire @google/genai library
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
  Type: {
    STRING: 'STRING',
    ARRAY: 'ARRAY',
    OBJECT: 'OBJECT',
  }
}));

describe('geminiService', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  const preferences: UserPreferences = {
      cityType: 'Metro',
      diet: 'veg',
      taste: 'Spicy',
      budget: '500',
      time: '30',
      kitchenSetup: 'medium',
      ingredients: ['rice', 'lentils', 'onion', 'tomato', 'spice'],
      avoidIngredients: ['peanuts'],
  };

  const mockPlanObject: MealPlanObject = {
      planTitle: "Test Plan",
      mealPlan: { 'Day 1': { Breakfast: 'A', Lunch: 'B', Dinner: 'C' }, 'Day 2': { Breakfast: 'D', Lunch: 'E', Dinner: 'F' }, 'Day 3': { Breakfast: 'G', Lunch: 'H', Dinner: 'I' } },
      // FIX: The groceryList object must contain the required keys to match the MealPlanObject type.
      groceryList: { Produce: [], Grains: [], Spices: [] },
      cookingSequence: { 'Day 1': { Breakfast: [], Lunch: [], Dinner: [] }, 'Day 2': { Breakfast: [], Lunch: [], Dinner: [] }, 'Day 3': { Breakfast: [], Lunch: [], Dinner: [] } },
      substitutions: [],
      usingYourIngredients: [],
      basedOnYourInputs: ""
  };

  describe('generateMealPlan', () => {
    it('should construct a valid prompt for a 3-day plan', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({ mainPlan: mockPlanObject, budgetAlternatives: [] }),
      });
      
      await generateMealPlan(preferences, 'Cheapest');

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      const calledWith = mockGenerateContent.mock.calls[0][0];
      const prompt = (calledWith as any).contents;

      expect(prompt).toContain('Role: Adaptive AI meal planning assistant.');
      expect(prompt).toContain('- Diet: veg');
      expect(prompt).toContain('- Available Ingredients: rice, lentils, onion, tomato, spice');
    });
    
    it('should use the fast-path prompt for time-constrained users', async () => {
        const fastPrefs = { ...preferences, time: '15' };
        mockGenerateContent.mockResolvedValueOnce({
            text: JSON.stringify({ mainPlan: mockPlanObject, budgetAlternatives: [] }),
        });
        
        await generateMealPlan(fastPrefs, null);

        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        const calledWith = mockGenerateContent.mock.calls[0][0];
        const prompt = (calledWith as any).contents;

        expect(prompt).toContain('Role: High-Speed AI Meal Planner.');
        expect(prompt).toContain('All 9 meals (Breakfast, Lunch, Dinner for 3 days) MUST be very simple and require less than 20 minutes of preparation.');
        expect(prompt).not.toContain('Optimization Preference');
    });
  });
  
  // EFFICIENCY TEST: 5. Integration Test - Cache Hit
  describe('caching layer', () => {
      it('should return a cached response on the second identical call', async () => {
          mockGenerateContent.mockResolvedValue({
              text: JSON.stringify({ mainPlan: mockPlanObject, budgetAlternatives: [] })
          });

          // First call - should hit the API
          const result1 = await generateMealPlan(preferences, 'Cheapest');
          expect(mockGenerateContent).toHaveBeenCalledTimes(1);
          expect(result1.mainPlan?.planTitle).toBe('Test Plan');

          // Second call - should hit the cache
          const result2 = await generateMealPlan(preferences, 'Cheapest');
          expect(mockGenerateContent).toHaveBeenCalledTimes(1); // Should NOT be called again
          expect(result2.mainPlan?.planTitle).toBe('Test Plan');
      });
  });

  describe('generateMealSwap', () => {
    const originalPlan: MealPlanObject = {
      planTitle: 'Original Plan',
      mealPlan: { 'Day 1': { Breakfast: 'Oats', Lunch: 'Salad', Dinner: 'Paneer Butter Masala' }, 'Day 2': { Breakfast: 'Cereal', Lunch: 'Sandwich', Dinner: 'Dal' }, 'Day 3': { Breakfast: 'Toast', Lunch: 'Soup', Dinner: 'Rice' } },
      groceryList: { Produce: ['Onion'], Grains: [], Spices: [] },
      cookingSequence: { 'Day 1': { Breakfast: [], Lunch: [], Dinner: ['Cook paneer'] }, 'Day 2': { Breakfast: [], Lunch: [], Dinner: [] }, 'Day 3': { Breakfast: [], Lunch: [], Dinner: [] } },
      substitutions: [], usingYourIngredients: [], basedOnYourInputs: ''
    };

    it('should construct a valid prompt for swapping a single meal', async () => {
        mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(originalPlan) });
        await generateMealSwap(originalPlan, 'Day 1', 'Dinner', 'Matar Paneer', preferences);

        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        const calledWith = mockGenerateContent.mock.calls[0][0];
        const prompt = (calledWith as any).contents;
        
        expect(prompt).toContain('Role: AI Meal Plan Surgeon');
        expect(prompt).toContain('Swap Request: The user wants to swap "Paneer Butter Masala" from Dinner on Day 1 with a new meal: "Matar Paneer"');
        expect(prompt).toContain('Preserve All Other Meals');
        expect(prompt).toContain('Recompute Grocery List');
    });
  });
  
  describe('generateImageForRecipe', () => {
    it('should return image data from the API on cache miss', async () => {
      const mockRecipeName = "Spicy Curry";
      const mockImageData = "base64-encoded-image-data";
      mockGenerateContent.mockResolvedValueOnce({
          candidates: [{ content: { parts: [{ inlineData: { data: mockImageData } }] } }],
      });
      
      const result = await generateImageForRecipe(mockRecipeName);
      
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockImageData);
    });
  });

  describe('generateRecipeFromImages', () => {
    it('should throw an error if the API call fails', async () => {
        mockGenerateContent.mockRejectedValueOnce(new Error('API Error'));
        await expect(generateRecipeFromImages(['imageData'])).rejects.toThrow('Failed to generate a valid recipe.');
    });
  });
});
