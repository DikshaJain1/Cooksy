import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { useSchedulerPreferences } from '../../hooks/useSchedulerPreferences';
import { ReminderPreferences } from '../../types';

describe('useSchedulerPreferences', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  it('should return default preferences when localStorage is empty', () => {
    const { result } = renderHook(() => useSchedulerPreferences());
    const [preferences] = result.current;

    expect(preferences.reminderTime).toBe('Morning');
    expect(preferences.cookingTimeWindow).toBe('7-9 PM');
  });

  it('should load preferences from localStorage if they exist', () => {
    const storedPrefs = {
      reminderTime: 'Evening',
      cookingTimeWindow: '8-10 PM',
      remindersPerDay: '1',
    };
    localStorage.setItem('cooksy-scheduler-prefs', JSON.stringify(storedPrefs));

    const { result } = renderHook(() => useSchedulerPreferences());
    const [preferences] = result.current;

    expect(preferences).toEqual(storedPrefs);
  });

  it('should update state and localStorage when setPreferences is called', () => {
    const { result } = renderHook(() => useSchedulerPreferences());
    
    // FIX: Explicitly type `newPrefs` as `ReminderPreferences` to match the required type.
    const newPrefs: ReminderPreferences = {
      reminderTime: 'Evening',
      cookingTimeWindow: '6-8 PM',
      remindersPerDay: '2',
    };

    act(() => {
      const [, setPreferences] = result.current;
      setPreferences(newPrefs);
    });

    const [updatedPreferences] = result.current;
    expect(updatedPreferences).toEqual(newPrefs);

    const storedValue = localStorage.getItem('cooksy-scheduler-prefs');
    expect(JSON.parse(storedValue!)).toEqual(newPrefs);
  });
});