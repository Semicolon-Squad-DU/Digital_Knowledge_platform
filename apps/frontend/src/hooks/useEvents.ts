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
  // Raw materials_url (S3 key) is never sent to the client — FR-060: use
  // has_materials + materials_access_tier and fetch a presigned URL via
  // useEventMaterialsUrl() only once the access-tier check has passed.
  has_materials: boolean;
  materials_access_tier: "public" | "member" | "staff" | "restricted";
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

// FR-063: month-grid calendar view — fetches events scheduled within the
// given year/month only, distinct from useEventsList's full/past/upcoming feed.
export function useEventsCalendar(year: number, month: number) {
  return useQuery<AcademicEvent[]>({
    queryKey: ["events", "calendar", year, month],
    queryFn: async () => {
      const { data } = await api.get("/events/calendar", { params: { year, month } });
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
      materialsAccessTier?: "public" | "member" | "staff" | "restricted";
    }) => {
      const { data } = await api.post("/events", payload);
      return data.data as AcademicEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", "list"] });
    },
  });
}

// FR-060: resolves an event's materials to a short-lived presigned URL,
// enforcing materials_access_tier server-side — call this on click rather
// than rendering a direct link, since the raw file key is never exposed.
export async function fetchEventMaterialsUrl(eventId: string): Promise<string> {
  const { data } = await api.get(`/events/${eventId}/materials-url`);
  return data.data.url;
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

export function useEventParticipants(eventId: string | null) {
  return useQuery({
    queryKey: ["events", eventId, "rsvps"],
    queryFn: async () => {
      if (!eventId) return [];
      const { data } = await api.get(`/events/${eventId}/rsvps`);
      return data.data;
    },
    enabled: !!eventId,
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data } = await api.delete(`/events/${eventId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", "list"] });
    },
  });
}

