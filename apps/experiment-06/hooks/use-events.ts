/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/use-events.ts - Updated version
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CalendarEvent } from "@/components/event-calendar";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      return data.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      })) as CalendarEvent[];
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: Omit<CalendarEvent, "id">) => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!res.ok) throw new Error("Failed to create event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

// New: Create multiple events at once (for recurring events)
export function useCreateMultipleEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (events: Omit<CalendarEvent, "id">[]) => {
      const promises = events.map((event) =>
        fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        }).then((res) => {
          if (!res.ok) throw new Error("Failed to create event");
          return res.json();
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: CalendarEvent) => {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!res.ok) throw new Error("Failed to update event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

// New: Update multiple events at once
export function useUpdateMultipleEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (events: CalendarEvent[]) => {
      const res = await fetch("/api/events/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
      if (!res.ok) throw new Error("Failed to update events");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

// New: Delete multiple events at once
export function useDeleteMultipleEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/events/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to delete events");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
