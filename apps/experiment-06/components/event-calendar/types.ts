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
}

// New interface for subjects
export interface Subject {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

export type EventColor = string;
