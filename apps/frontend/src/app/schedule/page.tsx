"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, MapPin, Users, BookOpen, AlertCircle } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ScheduleEvent {
  id: string;
  title: string;
  type: "lecture" | "seminar" | "lab" | "exam" | "office_hours";
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  instructor?: string;
  room?: string;
  capacity?: number;
  enrolled?: number;
  description?: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_SCHEDULE: ScheduleEvent[] = [
  {
    id: "1",
    title: "Advanced Data Structures",
    type: "lecture",
    date: "2026-05-29",
    startTime: "09:00",
    endTime: "10:30",
    location: "Building A, Room 101",
    instructor: "Dr. Sarah Chen",
    room: "A-101",
    capacity: 120,
    enrolled: 95,
    description: "Lecture on advanced tree structures and algorithms",
  },
  {
    id: "2",
    title: "Research Methodology Seminar",
    type: "seminar",
    date: "2026-05-29",
    startTime: "11:00",
    endTime: "12:30",
    location: "Building B, Room 205",
    instructor: "Prof. James Wilson",
    room: "B-205",
    capacity: 30,
    enrolled: 28,
    description: "Discussion on research design and methodology",
  },
  {
    id: "3",
    title: "Organic Chemistry Lab",
    type: "lab",
    date: "2026-05-30",
    startTime: "14:00",
    endTime: "16:00",
    location: "Science Building, Lab 3",
    instructor: "Dr. Maria Garcia",
    room: "Lab-3",
    capacity: 25,
    enrolled: 24,
    description: "Practical lab work on organic synthesis",
  },
  {
    id: "4",
    title: "Midterm Exam - History",
    type: "exam",
    date: "2026-06-02",
    startTime: "10:00",
    endTime: "12:00",
    location: "Exam Hall, Section C",
    room: "C-Hall",
    capacity: 200,
    enrolled: 150,
    description: "Midterm examination covering chapters 1-8",
  },
  {
    id: "5",
    title: "Office Hours - Mathematics",
    type: "office_hours",
    date: "2026-05-31",
    startTime: "15:00",
    endTime: "17:00",
    location: "Building A, Room 305",
    instructor: "Dr. Ahmed Hassan",
    room: "A-305",
    description: "One-on-one consultation for course questions",
  },
];

// ── Type badge ────────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: ScheduleEvent["type"] }) {
  const map: Record<ScheduleEvent["type"], { label: string; bg: string; color: string }> = {
    lecture: { label: "LECTURE", bg: "#dbeafe", color: "#1e40af" },
    seminar: { label: "SEMINAR", bg: "#ede9fe", color: "#5b21b6" },
    lab: { label: "LAB", bg: "#d1fae5", color: "#065f46" },
    exam: { label: "EXAM", bg: "#fecaca", color: "#991b1b" },
    office_hours: { label: "OFFICE HOURS", bg: "#fef3c7", color: "#92400e" },
  };
  const s = map[type];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

// ── Schedule Card ─────────────────────────────────────────────────────────────
function ScheduleCard({ event }: { event: ScheduleEvent }) {
  const eventDate = new Date(event.date);
  const dayName = eventDate.toLocaleDateString("en-US", { weekday: "short" });
  const dateStr = eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "20px 24px",
        display: "grid",
        gridTemplateColumns: "80px 1fr",
        gap: 20,
      }}
    >
      {/* Date column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px",
          background: "#f9fafb",
          borderRadius: 8,
          borderLeft: `4px solid var(--avatar-theme-color)`,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
          {dayName}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", lineHeight: 1 }}>
          {eventDate.getDate()}
        </div>
        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
          {eventDate.toLocaleDateString("en-US", { month: "short" })}
        </div>
      </div>

      {/* Content column */}
      <div>
        {/* Header: type badge + title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <TypeBadge type={event.type} />
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#111827",
              margin: 0,
              flex: 1,
            }}
          >
            {event.title}
          </h3>
        </div>

        {/* Description */}
        {event.description && (
          <p
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 12,
              lineHeight: 1.5,
            }}
          >
            {event.description}
          </p>
        )}

        {/* Details grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 12,
          }}
        >
          {/* Time */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={14} style={{ color: "#9ca3af" }} />
            <span style={{ fontSize: 13, color: "#374151" }}>
              {event.startTime} – {event.endTime}
            </span>
          </div>

          {/* Location */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={14} style={{ color: "#9ca3af" }} />
            <span style={{ fontSize: 13, color: "#374151" }}>
              {event.location}
            </span>
          </div>

          {/* Instructor */}
          {event.instructor && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={14} style={{ color: "#9ca3af" }} />
              <span style={{ fontSize: 13, color: "#374151" }}>
                {event.instructor}
              </span>
            </div>
          )}

          {/* Capacity */}
          {event.capacity && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={14} style={{ color: "#9ca3af" }} />
              <span style={{ fontSize: 13, color: "#374151" }}>
                {event.enrolled}/{event.capacity} enrolled
              </span>
            </div>
          )}
        </div>

        {/* Action button */}
        <button
          style={{
            padding: "8px 16px",
            background: "var(--avatar-theme-color)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          onClick={() => toast.success("Event details opened")}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { user, ready } = useAuthGuard();
  const [filterType, setFilterType] = useState<ScheduleEvent["type"] | "all">("all");

  if (!ready) return null;

  const filteredEvents =
    filterType === "all"
      ? MOCK_SCHEDULE
      : MOCK_SCHEDULE.filter((e) => e.type === filterType);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "#f3f4f6" }}>
      {/* Mock Blurred Dashboard Layout in the Background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 0,
        }}
      >
        {/* Mock Sidebar */}
        <div
          style={{
            background: "#111827",
            borderRight: "1px solid #1f2937",
            padding: "24px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div style={{ height: "32px", width: "120px", background: "#374151", borderRadius: "6px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  height: "24px",
                  width: i % 2 === 0 ? "80%" : "60%",
                  background: "#1f2937",
                  borderRadius: "4px",
                }}
              />
            ))}
          </div>
        </div>

        {/* Mock Content */}
        <div
          style={{
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            background: "#f9fafb",
          }}
        >
          {/* Mock Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ height: "28px", width: "200px", background: "#e5e7eb", borderRadius: "6px" }} />
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ height: "36px", width: "80px", background: "#e5e7eb", borderRadius: "6px" }} />
              <div style={{ height: "36px", width: "36px", borderRadius: "50%", background: "#e5e7eb" }} />
            </div>
          </div>

          {/* Mock Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: "100px",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <div style={{ height: "12px", width: "40px", background: "#f3f4f6", marginBottom: "12px" }} />
                <div style={{ height: "24px", width: "80px", background: "#e5e7eb" }} />
              </div>
            ))}
          </div>

          {/* Mock Table/List */}
          <div
            style={{
              flex: 1,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ height: "16px", width: "150px", background: "#e5e7eb", marginBottom: "8px" }} />
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  borderBottom: "1px solid #f3f4f6",
                  paddingBottom: "12px",
                }}
              >
                <div style={{ height: "16px", width: "16px", background: "#f3f4f6", borderRadius: "4px" }} />
                <div
                  style={{
                    height: "12px",
                    width: i % 2 === 0 ? "200px" : "150px",
                    background: "#f3f4f6",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Backdrop blur overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
          background: "rgba(0, 0, 0, 0.4)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ── Navbar ── */}
      <header
        style={{
          padding: "14px 24px",
          borderBottom: "1px solid rgba(229, 231, 235, 0.8)",
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(15px)",
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "13px",
            color: "var(--avatar-theme-color, #000000)",
            fontWeight: 700,
            transition: "color 0.2s",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Back to Portal
        </Link>
        <span
          style={{
            fontSize: "13px",
            color: "var(--avatar-theme-color, #111827)",
            letterSpacing: "0.01em",
            transition: "color 0.2s",
            fontWeight: 700,
          }}
        >
          Academic Schedule
        </span>
      </header>

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "48px 24px",
          position: "relative",
          zIndex: 2,
          maxWidth: "1000px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Page heading */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#111827",
              margin: 0,
              marginBottom: 8,
              lineHeight: 1.2,
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
          >
            <Calendar size={28} style={{ display: "inline-block", marginRight: 12, color: "var(--avatar-theme-color)" }} />
            Academic Schedule
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            View your upcoming classes, seminars, exams, and office hours
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {["all", "lecture", "seminar", "lab", "exam", "office_hours"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: filterType === type ? "none" : "1px solid #e5e7eb",
                background: filterType === type ? "var(--avatar-theme-color)" : "#fff",
                color: filterType === type ? "#fff" : "#374151",
                transition: "all 0.2s",
                textTransform: "capitalize",
              }}
            >
              {type === "all" ? "All Events" : type.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Schedule list */}
        {filteredEvents.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredEvents.map((event) => (
              <ScheduleCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "64px 24px",
              background: "#fff",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            <AlertCircle size={32} style={{ color: "#d1d5db", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", margin: 0 }}>
              No events found
            </p>
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
              Try selecting a different filter or check back later.
            </p>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          background: "rgba(233, 235, 238, 0.75)",
          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(15px)",
          borderTop: "1px solid rgba(209, 213, 219, 0.8)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            padding: "20px 32px",
            display: "grid",
            gridTemplateColumns: "160px 1fr 200px",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Brand — left */}
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", lineHeight: 1.55, margin: 0 }}>
            Digital Knowledge
            <br />
            Platform
          </p>

          {/* Links — center */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
              <Link
                href="/privacy"
                style={{ fontSize: "13px", color: "#374151", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                style={{ fontSize: "13px", color: "#374151", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                Terms of Service
              </Link>
              <Link
                href="/access"
                style={{ fontSize: "13px", color: "#374151", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                Institutional Access
              </Link>
            </div>
            <Link
              href="/support"
              style={{ fontSize: "13px", color: "#374151", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Contact Support
            </Link>
          </div>

          {/* Copyright — right */}
          <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.6, textAlign: "right", margin: 0 }}>
            © 2026 Digital Knowledge Platform. All rights
            <br />
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
