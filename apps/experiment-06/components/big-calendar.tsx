"use client";

import { useMemo, useEffect, useRef } from "react";
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

export default function BigCalendar() {
  const { isColorVisible, setSubjects } = useCalendarContext();

  // Fetch events and subjects from database
  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError,
  } = useEvents();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  // Use ref to prevent infinite loop when initializing subjects
  const subjectsInitialized = useRef(false);

  useEffect(() => {
    // Only initialize subjects once when they're first loaded
    if (subjects.length > 0 && !subjectsInitialized.current) {
      setSubjects(subjects);
      subjectsInitialized.current = true;
    }
  }, [subjects, setSubjects]);

  // Filter events based on visible colors
  const visibleEvents = useMemo(() => {
    return events.filter((event) => isColorVisible(event.color));
  }, [events, isColorVisible]);

  const handleEventAdd = async (event: CalendarEvent | CalendarEvent[]) => {
    try {
      if (Array.isArray(event)) {
        // Bulk create for recurring events
        // All events in the array should already have the correct color from handleSave
        const results = await Promise.all(
          event.map((evt) => createEvent.mutateAsync(evt))
        );
        toast(`${results.length} recurring events created`, {
          position: "bottom-left",
        });
      } else {
        // Single event - color should already be set from handleSave
        await createEvent.mutateAsync(event);
        toast(`Event "${event.title}" added`, {
          description: format(new Date(event.start), "MMM d, yyyy"),
          position: "bottom-left",
        });
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      toast.error("Failed to create event");
    }
  };
  
  const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
    try {
      await updateEvent.mutateAsync(updatedEvent);
      toast(`Event "${updatedEvent.title}" updated`, {
        description: format(new Date(updatedEvent.start), "MMM d, yyyy"),
        position: "bottom-left",
      });
    } catch (error) {
      toast.error("Failed to update event");
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      const deletedEvent = events.find((e) => e.id === eventId);
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
  };

  if (eventsLoading || subjectsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading calendar...</div>
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
