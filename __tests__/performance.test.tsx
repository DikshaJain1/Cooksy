
import { describe, it, expect, jest } from '@jest/globals';
import { generateMealPlan } from '../services/geminiService';
import { UserPreferences, MealPlanObject } from '../types';

// Mock the entire geminiService to isolate the function and control its execution time
// FIX: Cast the mock function to jest.Mock to provide a clear type and avoid 'never' inference issues.
const mockGenerateContent = jest.fn() as jest.Mock;
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

// EFFICIENCY TEST: 6. Performance Test
describe('Performance Tests', () => {
    
  const preferences: UserPreferences = {
    cityType: 'Metro', diet: 'veg', taste: 'Spicy', budget: '500', time: '30',
    kitchenSetup: 'medium', ingredients: ['rice', 'lentils', 'onion'], avoidIngredients: [],
  };

  const mockPlanObject: MealPlanObject = {
    planTitle: "Mock Plan",
    mealPlan: { 'Day 1': { Breakfast: 'A', Lunch: 'B', Dinner: 'C' }, 'Day 2': { Breakfast: 'D', Lunch: 'E', Dinner: 'F' }, 'Day 3': { Breakfast: 'G', Lunch: 'H', Dinner: 'I' } },
    // FIX: The groceryList object must contain the required keys to match the MealPlanObject type.
    groceryList: { Produce: [], Grains: [], Spices: [] },
    cookingSequence: { 'Day 1': { Breakfast: [], Lunch: [], Dinner: [] }, 'Day 2': { Breakfast: [], Lunch: [], Dinner: [] }, 'Day 3': { Breakfast: [], Lunch: [], Dinner: [] } },
    substitutions: [],
    usingYourIngredients: [],
    basedOnYourInputs: ""
  };
    
  // This test simulates concurrent requests to the client-side logic (prompt creation, caching)
  // by firing them off with Promise.all. The API call is mocked to resolve instantly,
  // so we are measuring the performance of the JavaScript execution, not network latency.
  it('should handle 100 concurrent plan generation requests under 250ms on average', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ mainPlan: mockPlanObject, budgetAlternatives: [] })
    });
    
    // Create 100 promises, each representing a user request.
    const requests = Array(100).fill(0).map((_, i) =>
        // Vary the preferences slightly for each request to prevent the cache from returning instantly for all but the first call.
        generateMealPlan({ ...preferences, budget: (500 + i).toString() }, 'Cheapest')
    );

    const startTime = performance.now();
    await Promise.all(requests);
    const endTime = performance.now();

    const totalTime = endTime - startTime;
    const averageTime = totalTime / 100;

    console.log(`PERFORMANCE_TEST: Handled 100 requests in ${totalTime.toFixed(2)}ms (average: ${averageTime.toFixed(2)}ms)`);
    
    // Assert that the average execution time for the client-side logic is very fast.
    // The 250ms threshold is generous and primarily serves to catch performance regressions.
    expect(averageTime).toBeLessThan(250);
  }, 10000); // Increase timeout for the test case
});
