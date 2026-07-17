"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, MapPin, Users, Video, Link as LinkIcon, FileText, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { useCreateEvent } from "@/hooks/useEvents";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuthStore } from "@/store/auth.store";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const schema = z.object({
  title:        z.string().min(5, "Title must be at least 5 characters"),
  speaker:      z.string().min(2, "Speaker name must be at least 2 characters"),
  scheduledAt:  z.string().min(1, "Date and time are required"),
  location:     z.string().min(2, "Location is required"),
  totalSeats:   z.coerce.number().min(1, "Must have at least 1 seat").default(30),
  materialsUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description:  z.string().min(30, "Description must be at least 30 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { mutateAsync: createEvent } = useCreateEvent();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      totalSeats: 30,
      materialsUrl: "",
    },
  });

  const DESCRIPTION_MIN = 30;
  const descriptionLen = (watch("description") ?? "").length;

  const onSubmit = async (values: FormValues) => {
    try {
      await createEvent({
        title: values.title,
        description: values.description,
        speaker: values.speaker,
        scheduledAt: values.scheduledAt,
        location: values.location,
        totalSeats: Number(values.totalSeats),
        materialsUrl: values.materialsUrl || undefined,
      });
      toast.success("Academic seminar scheduled successfully!");
      router.push("/events");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Failed to create seminar event.";
      toast.error(msg);
      console.error("Create event error:", err);
    }
  };

  // Guard — matches backend's requireRole("admin", "archivist") on POST /api/events
  const canCreate = user && ["admin", "archivist"].includes(user.role);

  if (user && !canCreate) {
    return (
      <AppLayout>
        <div style={{ padding: "40px 24px", textAlign: "center" }}>
          <Calendar size={40} style={{ margin: "0 auto 16px", color: "#6b7280" }} />
          <p style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: 0 }}>Access Restricted</p>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
            Only administrators or archivists can schedule events.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ padding: "28px 32px", maxWidth: "800px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
        
        {/* Breadcrumb Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button
            onClick={() => router.push("/events")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "#475569",
              padding: 0
            }}
          >
            <ArrowLeft size={14} /> Back to Events
          </button>
          <div style={{ display: "flex", gap: 6, fontSize: 12, color: "#6b7280" }}>
            <span style={{ cursor: "pointer" }} onClick={() => router.push("/")}>Home</span>
            <span>/</span>
            <span style={{ cursor: "pointer" }} onClick={() => router.push("/events")}>Events</span>
            <span>/</span>
            <span style={{ color: "#111827", fontWeight: 500 }}>Create</span>
          </div>
        </div>

        {/* Page heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#0f1117",
            letterSpacing: "-0.025em",
            lineHeight: 1.2,
            margin: "0 0 6px",
          }}>
            Schedule Event
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            Create and publish an upcoming academic seminar, talk, or workshop.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

          {/* ── Event Info ── */}
          <section style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            marginBottom: 24,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 20px",
              background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Event Details</h2>
            </div>
            
            <div style={{ padding: 20 }} className="space-y-4">
              <Input
                label="Seminar Title"
                required
                placeholder="e.g. Advancements in Machine Learning and AI Ethics"
                error={errors.title?.message}
                {...register("title")}
              />

              <Input
                label="Presented Speaker"
                required
                placeholder="e.g. Dr. Sarah Jenkins"
                error={errors.speaker?.message}
                {...register("speaker")}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Scheduled Date & Time"
                  type="datetime-local"
                  required
                  error={errors.scheduledAt?.message}
                  {...register("scheduledAt")}
                />
                <Input
                  label="Total Seats Available"
                  type="number"
                  required
                  placeholder="e.g. 30"
                  error={errors.totalSeats?.message}
                  {...register("totalSeats")}
                />
              </div>

              <Input
                label="Location / Venue"
                required
                placeholder="e.g. Auditorium B or Zoom Conference Link"
                error={errors.location?.message}
                {...register("location")}
              />

              <Input
                label="Materials URL"
                type="url"
                placeholder="https://link-to-slides-or-recording.com (optional)"
                error={errors.materialsUrl?.message}
                {...register("materialsUrl")}
              />
            </div>
          </section>

          {/* ── Description / Abstract ── */}
          <section style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            marginBottom: 24,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 20px",
              background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
            }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Event Abstract / Description</h2>
            </div>
            
            <div style={{ padding: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Detailed Description <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Give a brief summary of what will be discussed at the seminar..."
                  {...register("description")}
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 8,
                    border: `1.5px solid ${errors.description ? "#dc2626" : descriptionLen >= DESCRIPTION_MIN ? "#16a34a" : "#d1d5db"}`,
                    fontSize: 14, fontFamily: "inherit", lineHeight: 1.7,
                    resize: "vertical", outline: "none", boxSizing: "border-box",
                    color: "#111827", background: "#fff",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => { e.target.style.borderColor = descriptionLen >= DESCRIPTION_MIN ? "#16a34a" : "var(--avatar-theme-color, #2563eb)"; }}
                  onBlur={e  => { e.target.style.borderColor = errors.description ? "#dc2626" : descriptionLen >= DESCRIPTION_MIN ? "#16a34a" : "#d1d5db"; }}
                />

                {/* Counter row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: errors.description ? "#dc2626" : descriptionLen >= DESCRIPTION_MIN ? "#16a34a" : "#6b7280" }}>
                    {errors.description
                      ? errors.description.message
                      : descriptionLen >= DESCRIPTION_MIN
                        ? "✓ Looks good"
                        : `${DESCRIPTION_MIN - descriptionLen} more character${DESCRIPTION_MIN - descriptionLen === 1 ? "" : "s"} needed`}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                    color: descriptionLen === 0 ? "#9ca3af" : descriptionLen < DESCRIPTION_MIN ? "#dc2626" : "#16a34a",
                  }}>
                    {descriptionLen}
                    <span style={{ fontWeight: 400, color: "#9ca3af" }}> / {DESCRIPTION_MIN}</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: 3, background: "#f3f4f6", borderRadius: 2, marginTop: 5, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    width: `${Math.min((descriptionLen / DESCRIPTION_MIN) * 100, 100)}%`,
                    background: descriptionLen < DESCRIPTION_MIN ? "#f59e0b" : "#16a34a",
                    transition: "width 0.1s ease, background 0.3s ease",
                  }} />
                </div>
              </div>
            </div>
          </section>

          {/* ── Actions ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
            <button
              type="button"
              onClick={() => router.push("/events")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#6b7280",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#f9fafb";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                background: "var(--theme-gradient-135, linear-gradient(135deg, #1a1a2e 0%, #111116 100%))",
                border: "none",
                borderRadius: 8,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: "0 4px 12px rgba(26, 26, 46, 0.2)",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.filter = "brightness(1.15)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.filter = "none";
                  e.currentTarget.style.transform = "none";
                }
              }}
            >
              <Calendar size={15} />
              {isSubmitting ? "Scheduling..." : "Schedule Event"}
            </button>
          </div>

        </form>
      </div>
    </AppLayout>
  );
}
