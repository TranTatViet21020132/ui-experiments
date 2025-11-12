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
  // Initialize as null to avoid hydration mismatch
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Initialize date only on client side
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Initialize visibleColors based on active subjects
  const [visibleColors, setVisibleColors] = useState<string[]>([]);

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
    if (!color) return true; // Events without a color are always visible
    return visibleColors.includes(color);
  };

  // Helper function to compare dates by day/month/year only
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const value = {
    currentDate: currentDate || new Date(), // Fallback for SSR
    setCurrentDate: (date: Date) => setCurrentDate(date),
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
