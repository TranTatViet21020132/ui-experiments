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
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [subjects, setSubjects] = useState<Subject[]>([]);

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

  // Check if a color is visible - FIXED to handle undefined colors properly
  const isColorVisible = (color: string | undefined) => {
    if (!color) return true; // Events without a color are always visible
    return visibleColors.includes(color);
  };

  const value = {
    currentDate,
    setCurrentDate,
    visibleColors,
    toggleColorVisibility,
    isColorVisible,
    subjects,
    setSubjects,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}
