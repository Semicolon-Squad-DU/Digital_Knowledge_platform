"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuthStore } from "@/store/auth.store";
import {
  useEventsList,
  useCreateEvent,
  useEventRSVP,
  useCancelRSVP,
  AcademicEvent,
} from "@/hooks/useEvents";
import {
  Calendar,
  MapPin,
  Users,
  Video,
  FileText,
  PlusCircle,
  XCircle,
  CheckCircle,
  Download,
  Loader2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import toast from "react-hot-toast";

export default function EventsPage() {
  const { user } = useAuthStore();
  const { data: events = [], isLoading: eventsLoading } = useEventsList();

  const { mutateAsync: createEvent } = useCreateEvent();
  const { mutateAsync: rsvpEvent } = useEventRSVP();
  const { mutateAsync: cancelRSVP } = useCancelRSVP();

  const [createModal, setCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    speaker: "",
    scheduledAt: "",
    location: "",
    totalSeats: 30,
    materialsUrl: "",
  });

  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  const canCreate = user && ["admin", "archivist", "librarian"].includes(user.role);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.speaker || !formData.scheduledAt || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createEvent({
        ...formData,
        totalSeats: Number(formData.totalSeats),
      });
      setCreateModal(false);
      setFormData({
        title: "",
        description: "",
        speaker: "",
        scheduledAt: "",
        location: "",
        totalSeats: 30,
        materialsUrl: "",
      });
      toast.success("Academic seminar created successfully!");
    } catch {
      toast.error("Failed to create seminar event");
    }
  };

  const handleRSVPToggle = async (event: AcademicEvent) => {
    if (!user) {
      toast.error("Please sign in to RSVP for events");
      return;
    }

    setRsvpLoading(event.event_id);
    try {
      if (event.has_rsvped) {
        await cancelRSVP(event.event_id);
        toast.success("Your seat RSVP has been cancelled.");
      } else {
        await rsvpEvent(event.event_id);
        toast.success("RSVP registered! Seat booked.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process RSVP request");
    } finally {
      setRsvpLoading(null);
    }
  };

  return (
    <AppLayout>
      <div style={{
        fontFamily: "'Inter', sans-serif",
        background: "#f8fafc",
        minHeight: "calc(100vh - 56px)",
        padding: "40px 24px"
      }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

          {/* ── HEADER ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <div>
              <h1
                id="events-page-title"
                style={{
                  fontSize: "40px",
                  fontWeight: 800,
                  background: "var(--theme-gradient-160)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  margin: "0 0 6px",
                  letterSpacing: "-0.02em"
                }}
              >
                Academic Seminars & Events
              </h1>
              <p style={{ fontSize: "14px", color: "var(--color-fg-muted, #64748b)", margin: 0 }}>
                Browse listings of university academic seminars, RSVP to book a seat, and access materials.
              </p>
            </div>
            
            {canCreate && (
              <button
                id="create-event-btn"
                onClick={() => setCreateModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#ffffff",
                  background: "var(--theme-gradient-160)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  transition: "all 0.2s"
                }}
              >
                <PlusCircle size={16} />
                Create Seminar Event
              </button>
            )}
          </div>

          {/* ── EVENT LISTINGS ── */}
          {eventsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
              <Loader2 className="animate-spin" size={32} color="var(--avatar-theme-color, #2563eb)" />
            </div>
          ) : events.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 24px",
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
            }}>
              <Calendar size={48} color="#94a3b8" style={{ marginBottom: "16px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>
                No seminars scheduled
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Check back later for upcoming university academic discussions and event listings!
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
              {events.map((event) => {
                const dateStr = new Date(event.scheduled_at).toLocaleString("en-GB", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                const isSoldOut = event.available_seats <= 0;

                return (
                  <div
                    key={event.event_id}
                    id={`event-card-${event.event_id}`}
                    style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      padding: "24px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "20px",
                      transition: "transform 0.2s, box-shadow 0.2s"
                    }}
                  >
                    <div>
                      {/* Top Row: Date & RSVP status badge */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--avatar-theme-color, #2563eb)", background: "rgba(37, 99, 235, 0.06)", padding: "4px 10px", borderRadius: "100px" }}>
                          {dateStr}
                        </span>

                        {event.has_rsvped && (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#16a34a",
                            background: "#dcfce7",
                            padding: "4px 10px",
                            borderRadius: "100px"
                          }}>
                            <CheckCircle size={12} />
                            Seat Booked
                          </span>
                        )}
                      </div>

                      {/* Title & Speaker */}
                      <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                        {event.title}
                      </h3>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#475569", margin: "0 0 12px" }}>
                        Presented by: <span style={{ color: "#0f172a" }}>{event.speaker}</span>
                      </p>

                      {/* Description */}
                      <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>
                        {event.description}
                      </p>

                      {/* Metadata row */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", fontSize: "13px", color: "#475569" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <MapPin size={15} color="#94a3b8" />
                          <strong>Location:</strong> {event.location}
                        </span>
                        
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Users size={15} color="#94a3b8" />
                          <strong>Seats Available:</strong> {event.available_seats} / {event.total_seats} 
                          {isSoldOut && <span style={{ color: "#ef4444", fontWeight: 700, marginLeft: 4 }}>(Sold Out)</span>}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Actions Row */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: "16px",
                      marginTop: "4px"
                    }}>
                      {/* Materials download */}
                      <div>
                        {event.materials_url ? (
                          <a
                            href={event.materials_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "var(--avatar-theme-color, #2563eb)",
                              textDecoration: "underline",
                              cursor: "pointer"
                            }}
                          >
                            <Download size={14} />
                            Download Event Materials
                          </a>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                            Materials pending event scheduled
                          </span>
                        )}
                      </div>

                      {/* RSVP Buttons */}
                      <div>
                        <button
                          id={`rsvp-toggle-btn-${event.event_id}`}
                          onClick={() => handleRSVPToggle(event)}
                          disabled={rsvpLoading === event.event_id || (isSoldOut && !event.has_rsvped)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 18px",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            cursor: (isSoldOut && !event.has_rsvped) ? "not-allowed" : "pointer",
                            transition: "all 0.2s",
                            border: event.has_rsvped ? "1px solid #d1d5db" : "none",
                            background: event.has_rsvped
                              ? "#ffffff"
                              : "var(--theme-gradient-160)",
                            color: event.has_rsvped ? "#475569" : "#ffffff",
                            opacity: (isSoldOut && !event.has_rsvped) ? 0.5 : 1,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
                          }}
                        >
                          {rsvpLoading === event.event_id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : event.has_rsvped ? (
                            <>
                              <XCircle size={13} />
                              Cancel Registration
                            </>
                          ) : (
                            <>
                              <Calendar size={13} />
                              Book My Seat
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* ── CREATE SEMINAR MODAL ── */}
      {createModal && (
        <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Schedule Academic Seminar">
          <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "'Inter', sans-serif", padding: "10px 0" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#334155" }}>Seminar Title *</label>
              <input
                id="event-form-title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Advancements in Machine Learning and AI Ethics"
                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#334155" }}>Presented Speaker *</label>
              <input
                id="event-form-speaker"
                type="text"
                required
                value={formData.speaker}
                onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                placeholder="e.g. Dr. Sarah Jenkins"
                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#334155" }}>Scheduled Date & Time *</label>
              <input
                id="event-form-date"
                type="datetime-local"
                required
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#334155" }}>Location/Venue *</label>
              <input
                id="event-form-location"
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Audiorium B or Zoom Conference"
                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#334155" }}>Total Seats *</label>
                <input
                  id="event-form-seats"
                  type="number"
                  required
                  min={1}
                  value={formData.totalSeats}
                  onChange={(e) => setFormData({ ...formData, totalSeats: Number(e.target.value) })}
                  style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#334155" }}>Materials URL (optional)</label>
                <input
                  id="event-form-materials"
                  type="text"
                  value={formData.materialsUrl}
                  onChange={(e) => setFormData({ ...formData, materialsUrl: e.target.value })}
                  placeholder="Link to slides or recording"
                  style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#334155" }}>Event Abstract/Description *</label>
              <textarea
                id="event-form-description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Give a brief summary of what will be discussed at the seminar..."
                rows={4}
                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", fontFamily: "inherit", outline: "none", resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setCreateModal(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                id="submit-event-btn"
                type="submit"
                style={{
                  padding: "8px 18px",
                  borderRadius: "6px",
                  border: "none",
                  background: "var(--theme-gradient-160)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Schedule Event
              </button>
            </div>

          </form>
        </Modal>
      )}

    </AppLayout>
  );
}
