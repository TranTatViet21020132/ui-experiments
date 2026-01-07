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

function getLocalMidnight(date: Date = new Date()): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function CalendarProvider({ children }: CalendarProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [visibleColors, setVisibleColors] = useState<string[]>([]);
  const [subjects, setSubjectsState] = useState<Subject[]>([]);

  useEffect(() => {
    setCurrentDate(getLocalMidnight());
    setMounted(true);
  }, []);

  const setSubjects = (newSubjects: Subject[]) => {
    setSubjectsState(newSubjects);

    // Initialize all subjects as visible
    const subjectColors = newSubjects.map((s) => s.color);
    setVisibleColors((prevVisible) => {
      // If no colors were visible before, show all new subjects
      if (prevVisible.length === 0) {
        return subjectColors;
      }
      // Otherwise, add any new colors while preserving existing visibility state
      const combined = [...new Set([...prevVisible, ...subjectColors])];
      return combined;
    });
  };

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
    if (!color) return false;
    return visibleColors.includes(color);
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  if (!mounted || !currentDate) {
    return null;
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
