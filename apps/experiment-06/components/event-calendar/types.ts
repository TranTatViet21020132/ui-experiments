// types.ts - Update your existing CalendarEvent interface

export type CalendarView = "month" | "week" | "day" | "agenda";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  label?: string;
  location?: string;
  subject?: string;

  // New fields for recurring event management
  recurringGroupId?: string; // Links all events in a recurring series
  recurrencePattern?: RecurrencePattern; // Stores the original pattern
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

export type EventColor = string;

export interface RecurrencePattern {
  frequency: "daily" | "weekly" | "monthly";
  interval: number; // e.g., 1 for every week, 2 for every 2 weeks
  daysOfWeek?: number[]; // For weekly recurrence: [0,1,2,3,4,5,6]
  endDate?: Date;
  startTime: string; // e.g., "09:00"
  duration: number; // in minutes
}

// Options for editing recurring events
export type RecurringEditOption =
  | "this-event" // Edit only this occurrence
  | "this-and-future" // Edit this and all future occurrences
  | "all-events"; // Edit all occurrences in the series
