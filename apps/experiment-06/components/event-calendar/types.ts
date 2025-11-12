export type CalendarView = "month" | "week" | "day" | "agenda";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string; // Changed from EventColor to string for hex colors
  label?: string;
  location?: string;
  subject?: string;
}

// New Subject interface
export interface Subject {
  id: string;
  name: string;
  color: string; // hex color like "#3B82F6"
  isActive: boolean;
}

export type EventColor = string;
