
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { generateReminders } from '../../services/schedulerService';
import { MealPlanObject, ReminderPreferences } from '../../types';

describe('schedulerService', () => {
    
  const mockPlan: MealPlanObject = {
    planTitle: 'Test Plan',
    mealPlan: {
        'Day 1': { Breakfast: 'A', Lunch: 'B', Dinner: 'Dinner One' },
        'Day 2': { Breakfast: 'C', Lunch: 'D', Dinner: 'Dinner Two' },
        'Day 3': { Breakfast: 'E', Lunch: 'F', Dinner: 'Dinner Three' },
    },
    groceryList: {
        Produce: ['Apples'],
        Grains: ['Oats'],
        Spices: [],
    },
    cookingSequence: {
        'Day 1': { Breakfast: [], Lunch: [], Dinner: ['Cook pasta', 'Add sauce'] },
        'Day 2': { Breakfast: [], Lunch: [], Dinner: ['Heat leftovers'] },
        'Day 3': { Breakfast: [], Lunch: [], Dinner: ['Cook rice'] },
    },
    substitutions: [],
    usingYourIngredients: [],
    basedOnYourInputs: '',
  };

  // Mock Date to control time-based tests
  const RealDate = Date;
  // Set a fixed date to ensure test determinism
  const mockDate = new Date('2024-08-15T10:00:00Z');
  
  beforeEach(() => {
    // Mock the Date constructor
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  });
  
  afterEach(() => {
    // Restore the original Date constructor
    jest.restoreAllMocks();
  });
  
  it('should generate exactly 3 events', () => {
      const preferences: ReminderPreferences = {
        reminderTime: 'Morning',
        cookingTimeWindow: '7-9 PM',
        remindersPerDay: '1',
      };
      const events = generateReminders(mockPlan, preferences);
      expect(events).toHaveLength(3);
  });


  it('should generate a single shopping event with all groceries', () => {
    const preferences: ReminderPreferences = {
      reminderTime: 'Morning',
      cookingTimeWindow: '7-9 PM',
      remindersPerDay: '1',
    };
    const events = generateReminders(mockPlan, preferences);
    const shoppingEvent = events.find(e => e.summary.includes('Shopping'));
    
    expect(shoppingEvent).toBeDefined();
    expect(shoppingEvent!.description).toContain('Produce: Apples');
    expect(shoppingEvent!.description).toContain('Grains: Oats');
  });

  it('should generate a single, consolidated meal prep event', () => {
    const preferences: ReminderPreferences = {
      reminderTime: 'Morning',
      cookingTimeWindow: '6-8 PM',
      remindersPerDay: '1',
    };
    const events = generateReminders(mockPlan, preferences);
    const prepEvent = events.find(e => e.summary.includes('Meal Prep Session'));

    expect(prepEvent).toBeDefined();
    expect(prepEvent!.description).toContain('Day 1: Dinner One');
    expect(prepEvent!.description).toContain('Cook pasta');
    expect(prepEvent!.description).toContain('Day 2: Dinner Two');
    expect(prepEvent!.description).toContain('Heat leftovers');
    expect(prepEvent!.description).toContain('Day 3: Dinner Three');
    expect(prepEvent!.description).toContain('Cook rice');
  });
  
  it('should generate a recurring daily cooking reminder', () => {
    const preferences: ReminderPreferences = {
      reminderTime: 'Morning',
      cookingTimeWindow: '7-9 PM',
      remindersPerDay: '1',
    };
    const events = generateReminders(mockPlan, preferences);
    const cookingEvent = events.find(e => e.summary.includes('Daily Cooking Reminder'));
    
    expect(cookingEvent).toBeDefined();
    expect(cookingEvent!.recurrence).toBeDefined();
    expect(cookingEvent!.recurrence![0]).toBe('FREQ=DAILY;COUNT=3');
  });
  
  it('should not generate a shopping reminder if the grocery list is empty', () => {
      const planWithEmptyList = { ...mockPlan, groceryList: { Produce: [], Grains: [], Spices: [] }};
      const preferences: ReminderPreferences = {
        reminderTime: 'Morning',
        cookingTimeWindow: '7-9 PM',
        remindersPerDay: '1',
    };
    const events = generateReminders(planWithEmptyList, preferences);
    const shoppingEvent = events.find(e => e.summary.includes('Shopping'));
    expect(shoppingEvent).toBeUndefined();
  });
});
