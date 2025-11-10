"use client";

import { useMemo } from "react";
import { useCalendarContext } from "@/components/event-calendar/calendar-context";
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from "@/hooks/use-events";
import { toast } from "sonner";
import { format } from "date-fns";  

import {
  EventCalendar,
  type CalendarEvent,
  type EventColor,
} from "@/components/event-calendar";

// Etiquettes data for calendar filtering
export const etiquettes = [
  {
    id: "my-events",
    name: "My Events",
    color: "emerald" as EventColor,
    isActive: true,
  },
  {
    id: "marketing-team",
    name: "Marketing Team",
    color: "orange" as EventColor,
    isActive: true,
  },
  {
    id: "interviews",
    name: "Interviews",
    color: "violet" as EventColor,
    isActive: true,
  },
  {
    id: "events-planning",
    name: "Events Planning",
    color: "blue" as EventColor,
    isActive: true,
  },
  {
    id: "holidays",
    name: "Holidays",
    color: "rose" as EventColor,
    isActive: true,
  },
];

export default function BigCalendar() {
  const { data: events = [], isLoading, error } = useEvents();
  const { isColorVisible } = useCalendarContext();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const visibleEvents = useMemo(() => {
    return events.filter((event) => isColorVisible(event.color));
  }, [events, isColorVisible]);

  const handleEventAdd = async (event: CalendarEvent | CalendarEvent[]) => {
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
      toast.error("Failed to create event(s)");
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
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading events...</div>
      </div>
    );
  }

  if (error) {
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
