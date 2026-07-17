"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEventsCalendar } from "@/hooks/useEvents";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { AcademicEvent } from "@/hooks/useEvents";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Monday-first 6x7 grid covering the given month, padded with the trailing
// days of the previous month and the leading days of the next.
function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month - 1, 1);
  const firstWeekday = (first.getDay() + 6) % 7; // 0 = Monday
  const start = new Date(year, month - 1, 1 - firstWeekday);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function EventCalendar({ onSelectEvent }: { onSelectEvent: (event: AcademicEvent) => void }) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedDate, setSelectedDate] = useState<string>(dateKey(today));

  const { data: events = [], isLoading } = useEventsCalendar(year, month);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, AcademicEvent[]>();
    for (const event of events) {
      const key = dateKey(new Date(event.scheduled_at));
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    return map;
  }, [events]);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const goToPreviousMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); } else { setMonth(m => m - 1); }
  };
  const goToNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else { setMonth(m => m + 1); }
  };
  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    setSelectedDate(dateKey(today));
  };

  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const todayKey = dateKey(today);

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
          {MONTH_NAMES[month - 1]} {year}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={goToToday} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
            Today
          </button>
          <button onClick={goToPreviousMonth} aria-label="Previous month" style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={14} color="#475569" />
          </button>
          <button onClick={goToNextMonth} aria-label="Next month" style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronRight size={14} color="#475569" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 className="animate-spin" size={24} color="var(--avatar-theme-color, #2563eb)" />
        </div>
      ) : (
        <>
          {/* Weekday header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #f1f5f9" }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ padding: "8px 4px", textAlign: "center", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {isMobile ? d.slice(0, 1) : d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {grid.map(d => {
              const key = dateKey(d);
              const inMonth = d.getMonth() + 1 === month;
              const dayEvents = eventsByDate.get(key) ?? [];
              const isToday = key === todayKey;
              const isSelected = key === selectedDate;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  style={{
                    aspectRatio: "1", minHeight: isMobile ? 40 : 64,
                    border: "none", borderRight: "1px solid #f8fafc", borderBottom: "1px solid #f8fafc",
                    background: isSelected ? "color-mix(in srgb, var(--avatar-theme-color, #2563eb) 10%, #fff)" : "#fff",
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "flex-start", padding: "6px 2px", gap: 3,
                    opacity: inMonth ? 1 : 0.35,
                  }}
                >
                  <span style={{
                    fontSize: 12, fontWeight: isToday ? 800 : 600,
                    color: isToday ? "var(--avatar-theme-color, #2563eb)" : "#334155",
                    width: 20, height: 20, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isToday ? "color-mix(in srgb, var(--avatar-theme-color, #2563eb) 14%, transparent)" : "transparent",
                  }}>
                    {d.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span style={{ display: "flex", gap: 2 }}>
                      {dayEvents.slice(0, 3).map((_, i) => (
                        <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--avatar-theme-color, #2563eb)" }} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Selected day's events */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>
          {new Date(selectedDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        {selectedEvents.length === 0 ? (
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>No events on this day.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selectedEvents.map(event => (
              <button
                key={event.event_id}
                onClick={() => onSelectEvent(event)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                  background: "#f9fafb", cursor: "pointer", textAlign: "left",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#64748b" }}>
                    {new Date(event.scheduled_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {event.location}
                  </p>
                </div>
                {event.has_rsvped && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: 100, flexShrink: 0 }}>
                    Booked
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
