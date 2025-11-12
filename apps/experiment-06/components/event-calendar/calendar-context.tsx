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
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  });

  const [visibleColors, setVisibleColors] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Add this function that was missing
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
    if (!mounted) {
      return (
        date1.getUTCFullYear() === date2.getUTCFullYear() &&
        date1.getUTCMonth() === date2.getUTCMonth() &&
        date1.getUTCDate() === date2.getUTCDate()
      );
    }
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const value = {
    currentDate,
    setCurrentDate,
    visibleColors,
    toggleColorVisibility, // ✅ Now this function exists
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
