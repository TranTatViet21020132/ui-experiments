"use client";

import { useMemo, useEffect, useRef } from "react";
import { useCalendarContext } from "@/components/event-calendar/calendar-context";
import { EventCalendar, type CalendarEvent } from "@/components/event-calendar";
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useCreateMultipleEvents,
  useUpdateMultipleEvents,
  useDeleteMultipleEvents,
} from "@/hooks/use-events";
import { useSubjects } from "@/hooks/use-subjects";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BigCalendar() {
  const { isColorVisible, setSubjects } = useCalendarContext();

  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError,
  } = useEvents();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const createMultipleEvents = useCreateMultipleEvents();
  const updateMultipleEvents = useUpdateMultipleEvents();
  const deleteMultipleEvents = useDeleteMultipleEvents();

  const subjectsInitialized = useRef(false);

  useEffect(() => {
    if (subjects.length > 0 && !subjectsInitialized.current) {
      setSubjects(subjects);
      subjectsInitialized.current = true;
    }
  }, [subjects, setSubjects]);

  const visibleEvents = useMemo(() => {
    return events.filter((event) => isColorVisible(event.color));
  }, [events, isColorVisible]);

  const handleEventAdd = async (event: CalendarEvent | CalendarEvent[]) => {
    try {
      if (Array.isArray(event)) {
        await createMultipleEvents.mutateAsync(event);
        toast(`${event.length} recurring events created`, {
          position: "bottom-left",
        });
      } else {
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

  const handleEventUpdate = async (
    updatedEvent: CalendarEvent | CalendarEvent[]
  ) => {
    try {
      if (Array.isArray(updatedEvent)) {
        await updateMultipleEvents.mutateAsync(updatedEvent);
        toast(`${updatedEvent.length} events updated`, {
          position: "bottom-left",
        });
      } else {
        await updateEvent.mutateAsync(updatedEvent);
        toast(`Event "${updatedEvent.title}" updated`, {
          description: format(new Date(updatedEvent.start), "MMM d, yyyy"),
          position: "bottom-left",
        });
      }
    } catch (error) {
      console.error("Failed to update event:", error);
      toast.error("Failed to update event");
    }
  };

  const handleEventDelete = async (eventId: string | string[]) => {
    try {
      if (Array.isArray(eventId)) {
        const deletedEvents = events.filter((e) => eventId.includes(e.id));
        await deleteMultipleEvents.mutateAsync(eventId);

        if (deletedEvents.length > 0) {
          const firstEvent = deletedEvents[0];
          const lastEvent = deletedEvents[deletedEvents.length - 1];

          if (firstEvent && lastEvent) {
            toast(`${deletedEvents.length} events deleted`, {
              description: `From ${format(new Date(firstEvent.start), "MMM d")} to ${format(new Date(lastEvent.start), "MMM d")}`,
              position: "bottom-left",
            });
          }
        }
      } else {
        const deletedEvent = events.find((e) => e.id === eventId);
        await deleteEvent.mutateAsync(eventId);

        if (deletedEvent) {
          toast(`Event "${deletedEvent.title}" deleted`, {
            description: format(new Date(deletedEvent.start), "MMM d, yyyy"),
            position: "bottom-left",
          });
        }
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
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
