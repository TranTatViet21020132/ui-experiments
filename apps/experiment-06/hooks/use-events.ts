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
    mutationFn: async (event: Omit<CalendarEvent, 'id'>) => {  
      const res = await fetch('/api/events', {  
        method: 'POST',  
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify(event),  
      });  
      if (!res.ok) throw new Error('Failed to create event');  
      return res.json();  
    },  
    onSuccess: () => {  
      queryClient.invalidateQueries({ queryKey: ['events'] });  
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
