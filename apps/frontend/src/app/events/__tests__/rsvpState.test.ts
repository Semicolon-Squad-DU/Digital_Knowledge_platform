import { describe, it, expect } from "vitest";
import { isEventPast, getRsvpControlState } from "../rsvpState";

const HOUR = 60 * 60 * 1000;

describe("isEventPast", () => {
  it("returns false for a future date", () => {
    expect(isEventPast(new Date(Date.now() + HOUR).toISOString())).toBe(false);
  });

  it("returns true for a past date", () => {
    expect(isEventPast(new Date(Date.now() - HOUR).toISOString())).toBe(true);
  });
});

// Regression suite: the RSVP control used to only disable "Book My Seat" for a
// past event, but the "Cancel Registration" button stayed live for an already
// -past event the user had RSVP'd to (the exact bug this session's user
// screenshot showed — an ended seminar still offering "Cancel Registration").
// getRsvpControlState is the single function that both the click handler and
// the render now share, so a fix here can't silently drift out of sync again.
describe("getRsvpControlState", () => {
  const future = new Date(Date.now() + HOUR).toISOString();
  const past = new Date(Date.now() - HOUR).toISOString();

  it("shows 'book' for a future event the user hasn't RSVP'd to, with open seats", () => {
    expect(getRsvpControlState({ scheduled_at: future, has_rsvped: false, available_seats: 5 })).toBe("book");
  });

  it("shows 'waitlist' for a future, full event the user hasn't RSVP'd to", () => {
    expect(getRsvpControlState({ scheduled_at: future, has_rsvped: false, available_seats: 0 })).toBe("waitlist");
  });

  it("shows 'cancel' for a future event the user has already RSVP'd to", () => {
    expect(getRsvpControlState({ scheduled_at: future, has_rsvped: true, available_seats: 3 })).toBe("cancel");
  });

  it("never shows 'cancel' for a past event, even if the user RSVP'd — this was the bug", () => {
    const state = getRsvpControlState({ scheduled_at: past, has_rsvped: true, available_seats: 3 });
    expect(state).not.toBe("cancel");
    expect(state).toBe("ended-attended");
  });

  it("never shows 'book' or 'waitlist' for a past event the user didn't attend", () => {
    const state = getRsvpControlState({ scheduled_at: past, has_rsvped: false, available_seats: 5 });
    expect(state).not.toBe("book");
    expect(state).not.toBe("waitlist");
    expect(state).toBe("ended-not-attended");
  });

  it("a past event's seat count never affects its state — it's already over", () => {
    const withSeats = getRsvpControlState({ scheduled_at: past, has_rsvped: false, available_seats: 5 });
    const withoutSeats = getRsvpControlState({ scheduled_at: past, has_rsvped: false, available_seats: 0 });
    expect(withSeats).toBe(withoutSeats);
  });
});
