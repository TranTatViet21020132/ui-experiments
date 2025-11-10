"use client";

import { useMemo, useEffect, useRef, useCallback } from "react";
import { useCalendarContext } from "@/components/event-calendar/calendar-context";
import { EventCalendar, type CalendarEvent } from "@/components/event-calendar";
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from "@/hooks/use-events";
import { useSubjects } from "@/hooks/use-subjects";
import { toast } from "sonner";
import { format } from "date-fns";

export const etiquettes = [
  {
    id: "my-events",
    name: "My Events",
    color: "#10B981", // emerald
    isActive: true,
  },
  {
    id: "marketing-team",
    name: "Marketing Team",
    color: "#F97316", // orange
    isActive: true,
  },
  {
    id: "interviews",
    name: "Interviews",
    color: "#8B5CF6", // violet
    isActive: true,
  },
  {
    id: "events-planning",
    name: "Events Planning",
    color: "#3B82F6", // blue
    isActive: true,
  },
  {
    id: "holidays",
    name: "Holidays",
    color: "#F43F5E", // rose
    isActive: true,
  },
];

export default function BigCalendar() {
  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError,
  } = useEvents();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { isColorVisible, setSubjects } = useCalendarContext();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const subjectsInitialized = useRef(false);

  useEffect(() => {
    if (subjects.length > 0 && !subjectsInitialized.current) {
      setSubjects(subjects);
      subjectsInitialized.current = true;
    }
  }, [subjects, setSubjects]);

  // Memoize filtered events - only recalculate when events or visibility changes
  const visibleEvents = useMemo(() => {
    return events.filter((event) => isColorVisible(event.color));
  }, [events, isColorVisible]);

  // Memoize event handlers to prevent EventCalendar re-renders
  const handleEventAdd = useCallback(
    async (event: CalendarEvent | CalendarEvent[]) => {
      try {
        if (Array.isArray(event)) {
          // Bulk create for recurring events
          const results = await Promise.all(
            event.map((evt) => createEvent.mutateAsync(evt))
          );
          toast(`${results.length} events created`, {
            position: "bottom-left",
          });
        } else {
          // Single event
          await createEvent.mutateAsync(event);
          toast(`Event "${event.title}" added`, {
            description: format(new Date(event.start), "MMM d, yyyy"),
            position: "bottom-left",
          });
        }
      } catch (error) {
        toast.error("Failed to create event");
      }
    },
    [createEvent]
  );

  const handleEventUpdate = useCallback(
    async (updatedEvent: CalendarEvent) => {
      try {
        await updateEvent.mutateAsync(updatedEvent);
        toast(`Event "${updatedEvent.title}" updated`, {
          description: format(new Date(updatedEvent.start), "MMM d, yyyy"),
          position: "bottom-left",
        });
      } catch (error) {
        toast.error("Failed to update event");
      }
    },
    [updateEvent]
  );

  const handleEventDelete = useCallback(
    async (eventId: string) => {
      // Use a ref or closure to avoid stale events data
      const deletedEvent = events.find((e) => e.id === eventId);
      try {
        await deleteEvent.mutateAsync(eventId);
        if (deletedEvent) {
          toast(`Event "${deletedEvent.title}" deleted`, {
            description: format(new Date(deletedEvent.start), "MMM d, yyyy"),
            position: "bottom-left",
          });
        }
      } catch (error) {
        toast.error("Failed to delete event");
      }
    },
    [deleteEvent, events]
  );

  // Early returns for loading/error states
  const isLoading = eventsLoading || subjectsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">Failed to load events</div>
      </div>
    );
  }

  return (
    <EventCalendar
      events={visibleEvents}
      onEventAdd={handleEventAdd}
      onEventUpdate={handleEventUpdate}
      onEventDelete={handleEventDelete}
      initialView="week"
    />
  );
}
