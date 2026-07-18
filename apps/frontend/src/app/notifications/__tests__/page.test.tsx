import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NotificationCard, groupByDate } from "../NotificationCard";

const baseNotif = {
  notification_id: "n1",
  type: "hold_available",
  title: "Hold Available",
  message: '"Devdas" is now available',
  read: false,
  created_at: new Date().toISOString(),
};

// Regression guard: several notification types (due_date_reminder, hold_available,
// due-in-3-days/due-today reminders) used to hardcode "/dashboard" as action_url
// regardless of what the notification was actually about, so "View" never took
// the user anywhere useful. The fix moved the correct link generation to the
// backend, but the frontend's job — actually navigating to whatever action_url
// it's given — is exactly what these tests lock in.
describe("NotificationCard — click-to-navigate", () => {
  it("navigates to the notification's own action_url on click, not a hardcoded route", () => {
    const onNavigate = vi.fn();
    render(
      <NotificationCard
        notif={{ ...baseNotif, action_url: "/library/1847e57f-580e-4d7a-be41-bdbf34ce1e13" }}
        onMarkRead={vi.fn()}
        onNavigate={onNavigate}
        onDelete={vi.fn()}
        deleting={false}
      />
    );
    fireEvent.click(screen.getByText("Hold Available"));
    expect(onNavigate).toHaveBeenCalledWith("/library/1847e57f-580e-4d7a-be41-bdbf34ce1e13");
    expect(onNavigate).not.toHaveBeenCalledWith("/dashboard");
  });

  it("marks an unread notification as read on click", () => {
    const onMarkRead = vi.fn();
    render(
      <NotificationCard
        notif={{ ...baseNotif, read: false, action_url: "/library/abc" }}
        onMarkRead={onMarkRead}
        onNavigate={vi.fn()}
        onDelete={vi.fn()}
        deleting={false}
      />
    );
    fireEvent.click(screen.getByText("Hold Available"));
    expect(onMarkRead).toHaveBeenCalledWith("n1");
  });

  it("does not re-mark an already-read notification as read", () => {
    const onMarkRead = vi.fn();
    render(
      <NotificationCard
        notif={{ ...baseNotif, read: true, action_url: "/library/abc" }}
        onMarkRead={onMarkRead}
        onNavigate={vi.fn()}
        onDelete={vi.fn()}
        deleting={false}
      />
    );
    fireEvent.click(screen.getByText("Hold Available"));
    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it("does not attempt to navigate when the notification has no action_url", () => {
    const onNavigate = vi.fn();
    const { action_url: _omit, ...notifWithoutUrl } = { ...baseNotif, action_url: undefined };
    render(
      <NotificationCard
        notif={notifWithoutUrl}
        onMarkRead={vi.fn()}
        onNavigate={onNavigate}
        onDelete={vi.fn()}
        deleting={false}
      />
    );
    fireEvent.click(screen.getByText("Hold Available"));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("calls onDelete with the notification id, and does not also navigate", () => {
    const onDelete = vi.fn();
    const onNavigate = vi.fn();
    render(
      <NotificationCard
        notif={{ ...baseNotif, action_url: "/library/abc" }}
        onMarkRead={vi.fn()}
        onNavigate={onNavigate}
        onDelete={onDelete}
        deleting={false}
      />
    );
    fireEvent.click(screen.getByTitle("Delete"));
    expect(onDelete).toHaveBeenCalledWith("n1");
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("renders an unrecognized/future notification type without crashing, using the default icon", () => {
    expect(() =>
      render(
        <NotificationCard
          notif={{ ...baseNotif, type: "some_future_type_not_yet_added" }}
          onMarkRead={vi.fn()}
          onNavigate={vi.fn()}
          onDelete={vi.fn()}
          deleting={false}
        />
      )
    ).not.toThrow();
    expect(screen.getByText("Hold Available")).toBeInTheDocument();
  });
});

describe("groupByDate", () => {
  it("buckets a notification from today under 'Today'", () => {
    const groups = groupByDate([{ ...baseNotif, created_at: new Date().toISOString() }]);
    expect(groups.map(g => g.label)).toEqual(["Today"]);
  });

  it("buckets a notification from yesterday under 'Yesterday'", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const groups = groupByDate([{ ...baseNotif, created_at: yesterday.toISOString() }]);
    expect(groups.map(g => g.label)).toEqual(["Yesterday"]);
  });

  it("buckets an older notification under 'Earlier'", () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 8);
    const groups = groupByDate([{ ...baseNotif, created_at: lastWeek.toISOString() }]);
    expect(groups.map(g => g.label)).toEqual(["Earlier"]);
  });

  it("omits empty buckets and preserves Today/Yesterday/Earlier ordering", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 8);

    const groups = groupByDate([
      { ...baseNotif, notification_id: "old", created_at: lastWeek.toISOString() },
      { ...baseNotif, notification_id: "today", created_at: new Date().toISOString() },
      { ...baseNotif, notification_id: "yest", created_at: yesterday.toISOString() },
    ]);

    expect(groups.map(g => g.label)).toEqual(["Today", "Yesterday", "Earlier"]);
    expect(groups.find(g => g.label === "Today")?.items[0].notification_id).toBe("today");
  });

  it("returns no groups for an empty list", () => {
    expect(groupByDate([])).toEqual([]);
  });
});
