import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EventsPage from "../page";

vi.mock("@/components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: () => false,
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const authState = { user: null as { role: string } | null };
vi.mock("@/store/auth.store", () => ({
  useAuthStore: () => authState,
}));

const rsvpEventMock = vi.fn();
const cancelRSVPMock = vi.fn();
let eventsListData: any[] = [];
let eventsLoading = false;

vi.mock("@/hooks/useEvents", () => ({
  useEventsList: () => ({ data: eventsListData, isLoading: eventsLoading }),
  useCreateEvent: () => ({ mutateAsync: vi.fn() }),
  useEventRSVP: () => ({ mutateAsync: rsvpEventMock }),
  useCancelRSVP: () => ({ mutateAsync: cancelRSVPMock }),
  useEventParticipants: () => ({ data: [], isLoading: false }),
  useDeleteEvent: () => ({ mutateAsync: vi.fn() }),
  fetchEventMaterialsUrl: vi.fn(),
}));

function futureEvent(overrides: Partial<Record<string, unknown>> = {}) {
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    event_id: "e1",
    title: "AI Ethics Seminar",
    description: "A talk on AI ethics.",
    speaker: "Dr. Smith",
    scheduled_at: future,
    location: "Auditorium B",
    total_seats: 30,
    available_seats: 10,
    has_materials: false,
    materials_access_tier: "member",
    has_rsvped: false,
    ...overrides,
  };
}

describe("EventsPage", () => {
  beforeEach(() => {
    authState.user = null;
    eventsListData = [];
    eventsLoading = false;
    rsvpEventMock.mockReset();
    cancelRSVPMock.mockReset();
  });

  it("shows the empty state when there are no events", () => {
    render(<EventsPage />);
    expect(screen.getByText("No seminars scheduled")).toBeInTheDocument();
  });

  it("shows a 'Book My Seat' button for a signed-in user viewing a future event with open seats", () => {
    authState.user = { role: "member" };
    eventsListData = [futureEvent()];
    render(<EventsPage />);
    expect(screen.getByRole("button", { name: /book my seat/i })).toBeInTheDocument();
  });

  it("shows a 'Join Waitlist' button when a future event is sold out", () => {
    authState.user = { role: "member" };
    eventsListData = [futureEvent({ available_seats: 0 })];
    render(<EventsPage />);
    expect(screen.getByRole("button", { name: /join waitlist/i })).toBeInTheDocument();
  });

  it("shows 'Cancel Registration' when the user has already RSVP'd to a future event", () => {
    authState.user = { role: "member" };
    eventsListData = [futureEvent({ has_rsvped: true })];
    render(<EventsPage />);
    expect(screen.getByRole("button", { name: /cancel registration/i })).toBeInTheDocument();
  });

  it("shows a plain 'event ended' message, with no button, for a past event the user did not attend", () => {
    authState.user = { role: "member" };
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    eventsListData = [futureEvent({ scheduled_at: past, has_rsvped: false })];
    render(<EventsPage />);
    expect(screen.getByText("This event has ended")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /book my seat/i })).not.toBeInTheDocument();
  });

  it("prompts a guest to sign in instead of booking a seat", () => {
    authState.user = null;
    eventsListData = [futureEvent()];
    render(<EventsPage />);
    fireEvent.click(screen.getByRole("button", { name: /book my seat/i }));
    // No user means handleRSVPToggle short-circuits before calling the mutation.
    expect(rsvpEventMock).not.toHaveBeenCalled();
  });

  it("calls the RSVP mutation when a signed-in member books a seat", async () => {
    authState.user = { role: "member" };
    rsvpEventMock.mockResolvedValueOnce({ message: "Booked!" });
    eventsListData = [futureEvent()];
    render(<EventsPage />);
    fireEvent.click(screen.getByRole("button", { name: /book my seat/i }));
    await waitFor(() => expect(rsvpEventMock).toHaveBeenCalledWith("e1"));
  });

  it("calls the cancel mutation when a signed-in member cancels an existing RSVP", async () => {
    authState.user = { role: "member" };
    cancelRSVPMock.mockResolvedValueOnce(undefined);
    eventsListData = [futureEvent({ has_rsvped: true })];
    render(<EventsPage />);
    fireEvent.click(screen.getByRole("button", { name: /cancel registration/i }));
    await waitFor(() => expect(cancelRSVPMock).toHaveBeenCalledWith("e1"));
  });

  it("shows admin management controls (RSVPs/Delete) instead of a booking button for an admin", () => {
    authState.user = { role: "admin" };
    eventsListData = [futureEvent()];
    render(<EventsPage />);
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rsvps/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /book my seat/i })).not.toBeInTheDocument();
  });
});
