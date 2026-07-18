// Single source of truth for "is this event over, and what should the RSVP
// control show/allow" — previously this decision was computed independently
// in the click handler and in the render, and they drifted: the handler only
// blocked *booking* a past event, not *cancelling* one, so an already-RSVP'd
// user could still cancel a registration for an event that already happened
// (the backend now also rejects this — see DELETE /:id/rsvp — but the
// frontend must not offer an action it knows will be rejected).
export function isEventPast(scheduledAt: string | Date): boolean {
  return new Date(scheduledAt).getTime() < Date.now();
}

export type RsvpControlState = "ended-attended" | "ended-not-attended" | "cancel" | "waitlist" | "book";

export function getRsvpControlState(event: {
  scheduled_at: string | Date;
  has_rsvped: boolean;
  available_seats: number;
}): RsvpControlState {
  if (isEventPast(event.scheduled_at)) {
    return event.has_rsvped ? "ended-attended" : "ended-not-attended";
  }
  if (event.has_rsvped) return "cancel";
  if (event.available_seats <= 0) return "waitlist";
  return "book";
}
