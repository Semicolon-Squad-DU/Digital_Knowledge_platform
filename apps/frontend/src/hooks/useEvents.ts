import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface AcademicEvent {
  event_id: string;
  title: string;
  description: string;
  speaker: string;
  scheduled_at: string;
  location: string;
  total_seats: number;
  available_seats: number;
  materials_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  has_rsvped: boolean;
}

export function useEventsList() {
  return useQuery<AcademicEvent[]>({
    queryKey: ["events", "list"],
    queryFn: async () => {
      const { data } = await api.get("/events");
      return data.data;
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      speaker: string;
      scheduledAt: string;
      location: string;
      totalSeats: number;
      materialsUrl?: string;
    }) => {
      const { data } = await api.post("/events", payload);
      return data.data as AcademicEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", "list"] });
    },
  });
}

export function useEventRSVP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data } = await api.post(`/events/${eventId}/rsvp`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", "list"] });
    },
  });
}

export function useCancelRSVP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data } = await api.delete(`/events/${eventId}/rsvp`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", "list"] });
    },
  });
}
