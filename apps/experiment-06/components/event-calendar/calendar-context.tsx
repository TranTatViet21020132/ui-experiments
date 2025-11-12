"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { Subject } from "@/components/event-calendar/types";

interface CalendarContextType {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  visibleColors: string[];
  toggleColorVisibility: (color: string) => void;
  isColorVisible: (color: string | undefined) => boolean;
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => void;
  isSameDay: (date1: Date, date2: Date) => boolean;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error(
      "useCalendarContext must be used within a CalendarProvider"
    );
  }
  return context;
}

interface CalendarProviderProps {
  children: ReactNode;
}

// Helper function to normalize date to local midnight
function getLocalMidnight(date: Date = new Date()): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function CalendarProvider({ children }: CalendarProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Initialize with null to avoid hydration mismatch
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [visibleColors, setVisibleColors] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    // Set the actual current date only on client side
    setCurrentDate(getLocalMidnight());
    setMounted(true);
  }, []);

  const toggleColorVisibility = (color: string) => {
    setVisibleColors((prev) => {
      if (prev.includes(color)) {
        return prev.filter((c) => c !== color);
      } else {
        return [...prev, color];
      }
    });
  };

  const isColorVisible = (color: string | undefined) => {
    if (!color) return true;
    return visibleColors.includes(color);
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Don't render until mounted and currentDate is set
  if (!mounted || !currentDate) {
    return null; // Or a loading skeleton
  }

  const value = {
    currentDate,
    setCurrentDate,
    visibleColors,
    toggleColorVisibility,
    isColorVisible,
    subjects,
    setSubjects,
    isSameDay,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}
