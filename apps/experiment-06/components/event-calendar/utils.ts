/* eslint-disable @typescript-eslint/no-explicit-any */
// components/event-calendar/recurring-utils.ts
import { CalendarEvent, EventColor } from "@/components/event-calendar/types";
import { isBefore, isAfter, differenceInMinutes, isSameDay } from "date-fns";


/**
 * Get CSS classes for event colors
 */
export function getEventColorClasses(color?: EventColor | string): string {
  const eventColor = color || "sky";

  switch (eventColor) {
    case "sky":
      return "bg-blue-200/50 hover:bg-blue-200/40 text-blue-900/90 dark:bg-blue-400/25 dark:hover:bg-blue-400/20 dark:text-blue-200 shadow-blue-700/8";
    case "violet":
      return "bg-violet-200/50 hover:bg-violet-200/40 text-violet-900/90 dark:bg-violet-400/25 dark:hover:bg-violet-400/20 dark:text-violet-200 shadow-violet-700/8";
    case "rose":
      return "bg-rose-200/50 hover:bg-rose-200/40 text-rose-900/90 dark:bg-rose-400/25 dark:hover:bg-rose-400/20 dark:text-rose-200 shadow-rose-700/8";
    case "emerald":
      return "bg-emerald-200/50 hover:bg-emerald-200/40 text-emerald-900/90 dark:bg-emerald-400/25 dark:hover:bg-emerald-400/20 dark:text-emerald-200 shadow-emerald-700/8";
    case "orange":
      return "bg-orange-200/50 hover:bg-orange-200/40 text-orange-900/90 dark:bg-orange-400/25 dark:hover:bg-orange-400/20 dark:text-orange-200 shadow-orange-700/8";
    default:
      return "bg-blue-200/50 hover:bg-blue-200/40 text-blue-900/90 dark:bg-blue-400/25 dark:hover:bg-blue-400/20 dark:text-blue-200 shadow-blue-700/8";
  }
}

/**
 * Get CSS classes for border radius based on event position in multi-day events
 */
export function getBorderRadiusClasses(
  isFirstDay: boolean,
  isLastDay: boolean,
): string {
  if (isFirstDay && isLastDay) {
    return "rounded"; // Both ends rounded
  } else if (isFirstDay) {
    return "rounded-l rounded-r-none not-in-data-[slot=popover-content]:w-[calc(100%+5px)]"; // Only left end rounded
  } else if (isLastDay) {
    return "rounded-r rounded-l-none not-in-data-[slot=popover-content]:w-[calc(100%+4px)] not-in-data-[slot=popover-content]:-translate-x-[4px]"; // Only right end rounded
  } else {
    return "rounded-none not-in-data-[slot=popover-content]:w-[calc(100%+9px)] not-in-data-[slot=popover-content]:-translate-x-[4px]"; // No rounded corners
  }
}

/**
 * Check if an event is a multi-day event
 */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  return event.allDay || eventStart.getDate() !== eventEnd.getDate();
}

/**
 * Filter events for a specific day
 */
export function getEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      return isSameDay(day, eventStart);
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Sort events with multi-day events first, then by start time
 */
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aIsMultiDay = isMultiDayEvent(a);
    const bIsMultiDay = isMultiDayEvent(b);

    if (aIsMultiDay && !bIsMultiDay) return -1;
    if (!aIsMultiDay && bIsMultiDay) return 1;

    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
}

/**
 * Get multi-day events that span across a specific day (but don't start on that day)
 */
export function getSpanningEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((event) => {
    if (!isMultiDayEvent(event)) return false;

    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Only include if it's not the start day but is either the end day or a middle day
    return (
      !isSameDay(day, eventStart) &&
      (isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd))
    );
  });
}

/**
 * Get all events visible on a specific day (starting, ending, or spanning)
 */
export function getAllEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return (
      isSameDay(day, eventStart) ||
      isSameDay(day, eventEnd) ||
      (day > eventStart && day < eventEnd)
    );
  });
}

/**
 * Get all events for a day (for agenda view)
 */
export function getAgendaEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd) ||
        (day > eventStart && day < eventEnd)
      );
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Add hours to a date
 */
export function addHoursToDate(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Generates a unique ID for a recurring event group
 */
export function generateRecurringGroupId(): string {
  return `recurring-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Checks if an event is part of a recurring series
 */
export function isRecurringEvent(event: CalendarEvent): boolean {
  return !!event.recurringGroupId;
}

/**
 * Finds all events in the same recurring group
 */
export function getRecurringGroupEvents(
  events: CalendarEvent[],
  recurringGroupId: string
): CalendarEvent[] {
  return events
    .filter(event => event.recurringGroupId === recurringGroupId)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Finds events that match the pattern (same time period, title, and day of week)
 * Used when recurringGroupId is missing but events appear to be recurring
 */
export function findMatchingRecurringEvents(
  events: CalendarEvent[],
  targetEvent: CalendarEvent,
  withinDays: number = 90
): CalendarEvent[] {
  const targetDuration = differenceInMinutes(
    new Date(targetEvent.end),
    new Date(targetEvent.start)
  );
  const targetStartTime = new Date(targetEvent.start).toTimeString().substring(0, 5);
  const targetDayOfWeek = new Date(targetEvent.start).getDay();
  
  const searchStartDate = new Date(targetEvent.start);
  searchStartDate.setDate(searchStartDate.getDate() - withinDays);
  
  const searchEndDate = new Date(targetEvent.start);
  searchEndDate.setDate(searchEndDate.getDate() + withinDays);

  return events.filter(event => {
    if (event.id === targetEvent.id) return false;
    
    const eventStart = new Date(event.start);
    const eventDuration = differenceInMinutes(new Date(event.end), eventStart);
    const eventStartTime = eventStart.toTimeString().substring(0, 5);
    const eventDayOfWeek = eventStart.getDay();
    
    if (isBefore(eventStart, searchStartDate) || isAfter(eventStart, searchEndDate)) {
      return false;
    }
    
    return (
      eventDuration === targetDuration &&
      eventStartTime === targetStartTime &&
      eventDayOfWeek === targetDayOfWeek &&
      event.title === targetEvent.title &&
      event.subject === targetEvent.subject
    );
  });
}

/**
 * Gets events to update based on the edit scope
 */
export function getEventsToUpdate(
  allEvents: CalendarEvent[],
  targetEvent: CalendarEvent,
  scope: 'this-event' | 'all-future' | 'all-events'
): CalendarEvent[] {
  if (scope === 'this-event') {
    return [targetEvent];
  }

  const recurringGroupId = targetEvent.recurringGroupId;
  let groupEvents: CalendarEvent[];
  
  if (!recurringGroupId) {
    // Try to find matching events by pattern
    const matchingEvents = findMatchingRecurringEvents(allEvents, targetEvent);
    groupEvents = [targetEvent, ...matchingEvents];
  } else {
    // Use recurring group
    groupEvents = getRecurringGroupEvents(allEvents, recurringGroupId);
  }

  if (scope === 'all-events') {
    return groupEvents;
  }

  // For 'all-future'
  const targetDate = new Date(targetEvent.start);
  return groupEvents.filter(event => 
    !isBefore(new Date(event.start), targetDate)
  );
}

/**
 * Applies changes to multiple events while preserving their individual dates
 */
export function applyChangesToEvents(
  eventsToUpdate: CalendarEvent[],
  changes: Partial<CalendarEvent>
): CalendarEvent[] {
  return eventsToUpdate.map(event => {
    const updatedEvent = { ...event };
    
    // Apply all changes except start/end times
    Object.keys(changes).forEach(key => {
      if (key !== 'start' && key !== 'end' && key !== 'id') {
        (updatedEvent as any)[key] = (changes as any)[key];
      }
    });
    
    // If time is being changed, update duration but keep original dates
    if (changes.start && changes.end) {
      const originalStart = new Date(event.start);
      const newStartTime = new Date(changes.start);
      const newEndTime = new Date(changes.end);
      
      // Preserve the date, update the time
      const updatedStart = new Date(originalStart);
      updatedStart.setHours(newStartTime.getHours(), newStartTime.getMinutes(), 0, 0);
      
      const duration = differenceInMinutes(newEndTime, newStartTime);
      const updatedEnd = new Date(updatedStart.getTime() + duration * 60000);
      
      updatedEvent.start = updatedStart;
      updatedEvent.end = updatedEnd;
    }
    
    return updatedEvent;
  });
}
