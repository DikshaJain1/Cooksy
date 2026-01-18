
import { describe, it, expect } from '@jest/globals';
import { generateGoogleCalendarLink, generateIcsFileContent } from '../../services/calendarService';
import { CalendarEvent } from '../../types';

describe('calendarService', () => {
    
  const mockEvent: CalendarEvent = {
    summary: 'Test Event: Shopping',
    description: 'Buy milk & eggs.\nThis is a test.',
    start: { dateTime: '2024-01-01T10:00:00.000Z', timeZone: 'UTC' },
    end: { dateTime: '2024-01-01T11:00:00.000Z', timeZone: 'UTC' },
  };
  
  const mockRecurringEvent: CalendarEvent = {
      ...mockEvent,
      summary: 'Recurring Test Event',
      recurrence: ['FREQ=DAILY;COUNT=5']
  };

  describe('generateGoogleCalendarLink', () => {
    it('should generate a valid Google Calendar link', () => {
      const link = generateGoogleCalendarLink(mockEvent);
      expect(link).toContain('https://www.google.com/calendar/render');
      expect(link).toContain('action=TEMPLATE');
      expect(link).toContain(`text=${encodeURIComponent(mockEvent.summary)}`);
      expect(link).toContain('dates=20240101T100000Z%2F20240101T110000Z');
      expect(link).toContain(`details=${encodeURIComponent(mockEvent.description)}`);
    });
  });

  describe('generateIcsFileContent', () => {
    it('should generate valid ICS file content for a single event', () => {
      const ics = generateIcsFileContent([mockEvent]);
      expect(ics).toMatch(/^BEGIN:VCALENDAR/);
      expect(ics).toMatch(/END:VCALENDAR$/);
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('SUMMARY:Test Event: Shopping');
      // Check for escaped newline character
      expect(ics).toContain('DESCRIPTION:Buy milk & eggs.\\nThis is a test.');
      expect(ics).toContain('DTSTART:20240101T100000Z');
      expect(ics).toContain('DTEND:20240101T110000Z');
      expect(ics).not.toContain('RRULE');
    });

    it('should include an RRULE for recurring events', () => {
        const ics = generateIcsFileContent([mockRecurringEvent]);
        expect(ics).toContain('SUMMARY:Recurring Test Event');
        expect(ics).toContain('RRULE:FREQ=DAILY;COUNT=5');
    });

    it('should handle special characters in summary and description', () => {
        const eventWithSpecialChars: CalendarEvent = {
            ...mockEvent,
            summary: 'Event with ; comma',
            description: 'Description with \\ backslash',
        };
        const ics = generateIcsFileContent([eventWithSpecialChars]);
        expect(ics).toContain('SUMMARY:Event with \\; comma');
        expect(ics).toContain('DESCRIPTION:Description with \\\\ backslash');
    });
  });
});
