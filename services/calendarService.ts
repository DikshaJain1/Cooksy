
import { CalendarEvent } from '../types';

/**
 * Service to handle the generation of calendar file formats (.ics, Google links).
 */

/**
 * Formats a Date object into a string suitable for iCalendar (YYYYMMDDTHHMMSSZ).
 * @param {Date} date - The date to format.
 * @returns {string} The formatted UTC date string.
 */
const toIcsDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Generates the content for a downloadable .ics file from a list of events.
 * @param {CalendarEvent[]} events - An array of event objects.
 * @returns {string} The full string content for the .ics file.
 */
export const generateIcsFileContent = (events: CalendarEvent[]): string => {
    const icsEvents = events.map(event => {
        const startDate = new Date(event.start.dateTime);
        const endDate = new Date(event.end.dateTime);
        // Basic sanitation for ICS content
        const cleanSummary = (event.summary || '').replace(/[,;\\]/g, '\\$&');
        const cleanDescription = (event.description || '').replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
        
        const recurrenceRule = event.recurrence ? `RRULE:${event.recurrence[0]}` : '';

        return [
            'BEGIN:VEVENT',
            `UID:${Math.random().toString(36).substring(2)}@cooksy.app`,
            `DTSTAMP:${toIcsDate(new Date())}`,
            `DTSTART:${toIcsDate(startDate)}`,
            `DTEND:${toIcsDate(endDate)}`,
            recurrenceRule,
            `SUMMARY:${cleanSummary}`,
            `DESCRIPTION:${cleanDescription}`,
            'END:VEVENT'
        ].filter(Boolean).join('\r\n'); // Use filter(Boolean) to remove empty lines like an empty recurrence rule
    }).join('\r\n');

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//CooksyApp//Meal Plan Calendar//EN',
        icsEvents,
        'END:VCALENDAR'
    ].join('\r\n');
};

/**
 * Generates a Google Calendar "Create Event" link from an event object.
 * Note: Google Calendar link templates have poor support for recurrence (RRULE).
 * The link will create a single event, and the user can add recurrence manually.
 * @param {CalendarEvent} event - The event object.
 * @returns {string} A URL that opens Google Calendar with the event pre-filled.
 */
export const generateGoogleCalendarLink = (event: CalendarEvent): string => {
    const startDate = new Date(event.start.dateTime);
    const endDate = new Date(event.end.dateTime);
    
    // Google Calendar uses a slightly different format (YYYYMMDDTHHMMSSZ without hyphens/colons)
    const googleFormat = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.summary,
        dates: `${googleFormat(startDate)}/${googleFormat(endDate)}`,
        details: event.description,
        ctz: event.start.timeZone,
    });
    
    // Add recurrence rule to description for user convenience if it exists
    if (event.recurrence) {
        params.set('details', `${event.description}\n\nSuggested recurrence: ${event.recurrence[0]}`);
    }

    return `https://www.google.com/calendar/render?${params.toString()}`;
};
