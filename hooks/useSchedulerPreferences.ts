
import { useState, useEffect } from 'react';
import { ReminderPreferences } from '../types';

const STORAGE_KEY = 'cooksy-scheduler-prefs';

const defaultPreferences: ReminderPreferences = {
  reminderTime: 'Morning',
  cookingTimeWindow: '7-9 PM',
  remindersPerDay: '1',
};

/**
 * A custom hook to manage and persist user's scheduling preferences
 * in localStorage.
 * @returns A stateful value and a function to update it.
 */
export const useSchedulerPreferences = (): [ReminderPreferences, (prefs: ReminderPreferences) => void] => {
  const [preferences, setPreferences] = useState<ReminderPreferences>(() => {
    try {
      const storedPrefs = window.localStorage.getItem(STORAGE_KEY);
      return storedPrefs ? JSON.parse(storedPrefs) : defaultPreferences;
    } catch (error) {
      console.error('Error reading scheduler preferences from localStorage', error);
      return defaultPreferences;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving scheduler preferences to localStorage', error);
    }
  }, [preferences]);

  return [preferences, setPreferences];
};
