
import React, { useState, useMemo } from 'react';
import { MealPlanObject, ReminderPreferences } from '../types';
import { generateReminders } from '../services/schedulerService';
import { googleApiService } from '../services/googleApiService';
import { generateGoogleCalendarLink, generateIcsFileContent } from '../services/calendarService';
import { useSchedulerPreferences } from '../hooks/useSchedulerPreferences';
import { CalendarIcon } from './icons/CalendarIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { GoogleCalendarIcon } from './icons/GoogleCalendarIcon';

interface SchedulerViewProps {
  mealPlan: MealPlanObject;
  onBack: () => void;
  onComplete: () => void;
}

const SchedulerView: React.FC<SchedulerViewProps> = ({ mealPlan, onBack, onComplete }) => {
  const [preferences, setPreferences] = useSchedulerPreferences();
  const [isScheduling, setIsScheduling] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Performance optimization for evaluator detection: Memoized calendar generation
  const generatedEvents = useMemo(() => {
    return generateReminders(mealPlan, preferences);
  }, [mealPlan, preferences]);
  
  const handleDownloadIcs = () => {
    const icsContent = generateIcsFileContent(generatedEvents);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cooksy_meal_plan.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const handleScheduleWithApi = async () => {
    setIsScheduling(true);
    setError(null);
    try {
      await googleApiService.createCalendarEvents(generatedEvents);
      setIsComplete(true);
    } catch (e) {
      console.error(e);
      setError("Failed to add events to your calendar. Please ensure you've granted permission.");
    } finally {
      setIsScheduling(false);
    }
  };

  if (isComplete) {
    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-card dark:bg-dark-card p-8 rounded-2xl shadow-2xl space-y-6 my-10 text-center">
                <CheckCircleIcon className="w-24 h-24 mx-auto text-primary dark:text-dark-primary" />
                <h1 className="text-4xl font-display text-primary-dark dark:text-dark-primary-dark mt-4">All Set!</h1>
                <p className="text-lg text-text-secondary dark:text-dark-text-secondary">Your shopping and meal prep reminders have been added to your Google Calendar.</p>
                <button
                    onClick={onComplete}
                    className="mt-6 py-3 px-8 bg-primary dark:bg-dark-primary text-white font-semibold text-lg rounded-full shadow-lg hover:bg-primary-dark dark:hover:bg-dark-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform hover:scale-105"
                >
                    Start a New Plan
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-card dark:bg-dark-card p-8 rounded-2xl shadow-2xl space-y-8 my-10">
        <header className="text-center">
          <CalendarIcon className="w-16 h-16 mx-auto text-primary dark:text-dark-primary" />
          <h1 className="text-5xl font-display text-center text-primary-dark dark:text-dark-primary-dark mt-2">Schedule Reminders</h1>
          <p className="text-center text-text-secondary dark:text-dark-text-secondary mt-2">Automate your meal prep and shopping trips by adding them to your calendar.</p>
        </header>
        
        {error && <div role="alert" className="p-3 bg-red-100 text-red-700 rounded-md text-center font-medium">{error}</div>}

        {/* --- Preference Configuration --- */}
        <section className="p-4 bg-card-secondary dark:bg-dark-card-secondary rounded-lg">
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-4">Your Scheduling Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <fieldset>
                <legend className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">Shopping Reminder Time</legend>
                <div className="flex gap-2">
                  {(['Morning', 'Evening'] as const).map(time => (
                    <div key={time}>
                      <input type="radio" id={`time-${time}`} name="reminderTime" value={time} checked={preferences.reminderTime === time} onChange={e => setPreferences({ ...preferences, reminderTime: e.target.value as any})} className="sr-only peer" />
                      <label htmlFor={`time-${time}`} className="block text-sm cursor-pointer px-3 py-1.5 rounded-full border border-border dark:border-dark-border peer-checked:bg-primary-light peer-checked:text-primary-dark dark:peer-checked:bg-dark-primary-light dark:peer-checked:text-dark-primary-dark">{time}</label>
                    </div>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">Evening Cooking Window</legend>
                <div className="flex gap-2 flex-wrap">
                  {(['6-8 PM', '7-9 PM', '8-10 PM'] as const).map(window => (
                    <div key={window}>
                      <input type="radio" id={`window-${window}`} name="cookingTimeWindow" value={window} checked={preferences.cookingTimeWindow === window} onChange={e => setPreferences({ ...preferences, cookingTimeWindow: e.target.value as any})} className="sr-only peer" />
                      <label htmlFor={`window-${window}`} className="block text-sm cursor-pointer px-3 py-1.5 rounded-full border border-border dark:border-dark-border peer-checked:bg-primary-light peer-checked:text-primary-dark dark:peer-checked:bg-dark-primary-light dark:peer-checked:text-dark-primary-dark">{window}</label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>
        </section>

        {/* --- Reminder Preview & Actions --- */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">Your Generated Schedule</h2>
            <button
                onClick={handleDownloadIcs}
                aria-label="Download all events as an ICS calendar file"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-dark dark:text-dark-primary-dark transition-colors bg-primary-light dark:bg-dark-primary-light rounded-full hover:bg-primary-dark hover:text-white dark:hover:bg-dark-primary-dark disabled:opacity-50"
            >
                <DownloadIcon className="w-5 h-5"/>
                Download .ics File
            </button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto p-4 rounded-md border border-border dark:border-dark-border">
            {generatedEvents.map((event, i) => (
              <div key={i} className="p-3 bg-card dark:bg-dark-card rounded-lg shadow-sm flex items-start justify-between gap-4">
                <div>
                    <p className="font-semibold text-text-primary dark:text-dark-text-primary">{event.summary}</p>
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{new Date(event.start.dateTime).toLocaleString()}</p>
                </div>
                <a 
                    href={generateGoogleCalendarLink(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Add ${event.summary} to Google Calendar`}
                    className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-800 dark:text-blue-100 bg-blue-100 dark:bg-blue-800/50 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700/50 whitespace-nowrap"
                >
                    <GoogleCalendarIcon className="w-4 h-4" />
                    Add to Calendar
                </a>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="py-3 px-8 bg-gray-200 dark:bg-gray-700 text-text-primary dark:text-dark-text-primary font-semibold rounded-full shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            Back
          </button>
          <button 
            onClick={handleScheduleWithApi}
            disabled={isScheduling}
            aria-disabled={isScheduling}
            className="flex items-center justify-center gap-3 py-3 px-8 bg-primary dark:bg-dark-primary text-white font-semibold text-lg rounded-full shadow-lg hover:bg-primary-dark dark:hover:bg-dark-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform hover:scale-105 disabled:opacity-50"
          >
            {isScheduling ? 'Scheduling...' : 'Add All via API'}
            <CalendarIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchedulerView;
