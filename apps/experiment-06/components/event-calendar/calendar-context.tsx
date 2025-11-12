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

export function CalendarProvider({ children }: CalendarProviderProps) {
  // Initialize with a stable date to avoid hydration mismatch
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // This will be the same on server and initial client render
    const now = new Date();
    // Normalize to start of day in UTC to avoid timezone issues
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [visibleColors, setVisibleColors] = useState<string[]>([]);

  useEffect(() => {
    // Update to actual current date once on client
    const now = new Date();
    setCurrentDate(
      new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    );
  }, []);

  // Update visible colors when subjects change
  useEffect(() => {
    setVisibleColors(
      subjects
        .filter((subject) => subject.isActive)
        .map((subject) => subject.color)
    );
  }, [subjects]);

  // Toggle visibility of a color
  const toggleColorVisibility = (color: string) => {
    setVisibleColors((prev) => {
      if (prev.includes(color)) {
        return prev.filter((c) => c !== color);
      } else {
        return [...prev, color];
      }
    });
  };

  // Check if a color is visible - handles undefined colors properly
  const isColorVisible = (color: string | undefined) => {
    if (!color) return true;
    return visibleColors.includes(color);
  };

  // Helper function to compare dates by day/month/year only
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getUTCFullYear() === date2.getUTCFullYear() &&
      date1.getUTCMonth() === date2.getUTCMonth() &&
      date1.getUTCDate() === date2.getUTCDate()
    );
  };

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
