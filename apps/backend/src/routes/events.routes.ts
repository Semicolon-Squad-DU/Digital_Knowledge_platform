import { Router, Response } from "express";
import { AccessTier } from "@dkp/shared";
import { query, queryOne, withTransaction } from "../core/db/pool";
import { authenticate, optionalAuth, requireRole, AuthRequest } from "../core/middleware/auth.middleware";
import { AppError, asyncHandler } from "../core/middleware/error.middleware";
import { notifyAllUsersExcept, notifyUsers } from "../infrastructure/notification.service";
import { uploadSingle } from "../core/middleware/upload.middleware";
import { uploadToS3, generateS3Key, getPresignedUrl } from "../infrastructure/s3.service";
import { ALLOWED_TIERS_BY_ROLE } from "../core/access-control";

const router = Router();

// GET /api/events/calendar
router.get(
  "/calendar",
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { year, month } = req.query as { year?: string; month?: string };
    if (!year || !month) {
      throw new AppError(400, "year and month are required (e.g. ?year=2026&month=7)");
    }

    const userId = req.user?.user_id;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    // materials_url (the raw S3 key) is deliberately excluded — callers who
    // pass the access-tier check use GET /:id/materials-url for a presigned
    // link instead, so the key itself is never exposed to unauthorized roles.
    const eventsList = await query<any>(
      `SELECT e.event_id, e.title, e.description, e.speaker, e.scheduled_at, e.location,
              e.total_seats, e.available_seats, e.materials_access_tier,
              (e.materials_url IS NOT NULL) as has_materials,
              e.created_by, e.created_at, e.updated_at,
       CASE WHEN $1::UUID IS NOT NULL AND r.rsvp_id IS NOT NULL THEN TRUE ELSE FALSE END as has_rsvped,
       CASE WHEN $1::UUID IS NOT NULL AND r.rsvp_id IS NOT NULL AND r.waitlisted = TRUE THEN TRUE ELSE FALSE END as waitlisted
       FROM events e
       LEFT JOIN event_rsvps r ON e.event_id = r.event_id AND r.user_id = $1
       WHERE e.scheduled_at BETWEEN $2 AND $3
       ORDER BY e.scheduled_at ASC`,
      [userId || null, startDate, endDate]
    );

    res.json({
      success: true,
      data: eventsList,
    });
  })
);

// GET /api/events
router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id;
    const { time_filter } = req.query;

    let timeClause = "";
    if (time_filter === "past") {
      timeClause = "WHERE e.scheduled_at < NOW()";
    } else if (time_filter === "upcoming") {
      timeClause = "WHERE e.scheduled_at >= NOW()";
    }

    const eventsList = await query<any>(
      `SELECT e.event_id, e.title, e.description, e.speaker, e.scheduled_at, e.location,
              e.total_seats, e.available_seats, e.materials_access_tier,
              (e.materials_url IS NOT NULL) as has_materials,
              e.created_by, e.created_at, e.updated_at,
       CASE WHEN $1::UUID IS NOT NULL AND r.rsvp_id IS NOT NULL THEN TRUE ELSE FALSE END as has_rsvped,
       CASE WHEN $1::UUID IS NOT NULL AND r.rsvp_id IS NOT NULL AND r.waitlisted = TRUE THEN TRUE ELSE FALSE END as waitlisted
       FROM events e
       LEFT JOIN event_rsvps r ON e.event_id = r.event_id AND r.user_id = $1
       ${timeClause}
       ORDER BY e.scheduled_at ASC`,
      [userId || null]
    );

    res.json({
      success: true,
      data: eventsList,
    });
  })
);

// POST /api/events
router.post(
  "/",
  authenticate,
  requireRole("admin", "archivist"),
  uploadSingle,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, description, speaker, scheduledAt, location, totalSeats } = req.body;
    let { materialsUrl } = req.body;
    const materialsAccessTier = (req.body.materialsAccessTier || "member") as AccessTier;
    const userId = req.user!.user_id;

    if (!title || !description || !speaker || !scheduledAt || !location || totalSeats === undefined) {
      throw new AppError(400, "All event details are required");
    }

    if (!["public", "member", "staff", "restricted"].includes(materialsAccessTier)) {
      throw new AppError(400, "Invalid materials access tier");
    }

    if (Number.isNaN(new Date(scheduledAt).getTime()) || new Date(scheduledAt).getTime() <= Date.now()) {
      throw new AppError(400, "Scheduled date must be a valid date in the future");
    }

    if (req.file) {
      const key = generateS3Key("events", req.file.originalname, req.file.mimetype);
      await uploadToS3(key, req.file.buffer, req.file.mimetype);
      materialsUrl = key;
    }

    const newEvent = await queryOne<any>(
      `INSERT INTO events (title, description, speaker, scheduled_at, location, total_seats, available_seats, materials_url, materials_access_tier, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9)
       RETURNING *`,
      [title, description, speaker, scheduledAt, location, parseInt(totalSeats), materialsUrl || null, materialsAccessTier, userId]
    );

    // Fire-and-forget — notifyAllUsersExcept never rejects, it logs internally.
    void notifyAllUsersExcept(userId, {
      type: "new_event",
      title: "New Event Scheduled",
      message: `"${title}" has been scheduled for ${new Date(scheduledAt).toLocaleDateString()}.`,
      action_url: "/events",
    });

    res.status(201).json({
      success: true,
      data: newEvent,
    });
  })
);

// GET /api/events/:id/materials-url — FR-060: presigned URL for event
// materials (slides/recordings), gated by the item's materials_access_tier
// the same way archive items and showcase files are gated elsewhere.
router.get("/:id/materials-url", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const event = await queryOne<{ materials_url: string | null; materials_access_tier: AccessTier }>(
    "SELECT materials_url, materials_access_tier FROM events WHERE event_id = $1",
    [req.params.id]
  );
  if (!event || !event.materials_url) throw new AppError(404, "No materials found for this event");

  const role = req.user?.role ?? "guest";
  const allowedTiers = ALLOWED_TIERS_BY_ROLE[role] ?? ["public"];
  if (!allowedTiers.includes(event.materials_access_tier)) {
    throw new AppError(403, "You do not have access to this event's materials");
  }

  const url = await getPresignedUrl(event.materials_url);
  res.json({ success: true, data: { url } });
}));

// POST /api/events/:id/rsvp
router.post(
  "/:id/rsvp",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const eventId = req.params.id;
    const userId = req.user!.user_id;
    let isWaitlisted = false;

    await withTransaction(async (client) => {
      // 1. Lock and retrieve the event
      const eventRes = await client.query(
        `SELECT * FROM events WHERE event_id = $1 FOR UPDATE`,
        [eventId]
      );
      const event = eventRes.rows[0];

      if (!event) {
        throw new AppError(404, "Event not found");
      }

      if (new Date(event.scheduled_at).getTime() < Date.now()) {
        throw new AppError(400, "This event has already taken place. RSVP is closed.");
      }

      // 2. Check if already RSVPed
      const rsvpRes = await client.query(
        `SELECT * FROM event_rsvps WHERE event_id = $1 AND user_id = $2`,
        [eventId, userId]
      );
      if (rsvpRes.rows[0]) {
        throw new AppError(400, "You have already registered for this event");
      }

      // 3. Check seats availability
      if (event.available_seats <= 0) {
        isWaitlisted = true;
      }

      // 4. Record RSVP
      await client.query(
        `INSERT INTO event_rsvps (event_id, user_id, waitlisted) VALUES ($1, $2, $3)`,
        [eventId, userId, isWaitlisted]
      );

      if (!isWaitlisted) {
        await client.query(
          `UPDATE events SET available_seats = available_seats - 1 WHERE event_id = $1`,
          [eventId]
        );
      }
    });

    res.json({
      success: true,
      message: isWaitlisted
        ? "Registered on the waitlist successfully! You will be auto-promoted if a seat opens up."
        : "RSVP registered successfully! Your seat is booked.",
      data: { waitlisted: isWaitlisted }
    });
  })
);

// DELETE /api/events/:id/rsvp
router.delete(
  "/:id/rsvp",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const eventId = req.params.id;
    const userId = req.user!.user_id;

    await withTransaction(async (client) => {
      // 1. Check if RSVP exists
      const rsvpRes = await client.query(
        `SELECT * FROM event_rsvps WHERE event_id = $1 AND user_id = $2`,
        [eventId, userId]
      );
      const rsvp = rsvpRes.rows[0];
      if (!rsvp) {
        throw new AppError(404, "RSVP registration not found");
      }

      // 2. Delete RSVP
      await client.query(
        `DELETE FROM event_rsvps WHERE event_id = $1 AND user_id = $2`,
        [eventId, userId]
      );

      // 3. If the cancelled RSVP was NOT waitlisted, promote the first waitlist user
      if (!rsvp.waitlisted) {
        const waitlistRes = await client.query(
          `SELECT * FROM event_rsvps WHERE event_id = $1 AND waitlisted = TRUE ORDER BY created_at ASC LIMIT 1 FOR UPDATE`,
          [eventId]
        );
        const waitlistUser = waitlistRes.rows[0];

        if (waitlistUser) {
          // Promote waitlisted user
          await client.query(
            `UPDATE event_rsvps SET waitlisted = FALSE WHERE rsvp_id = $1`,
            [waitlistUser.rsvp_id]
          );

          // Notify waitlist user
          const eventInfo = await client.query("SELECT title FROM events WHERE event_id = $1", [eventId]);
          await client.query(
            `INSERT INTO notifications (user_id, type, title, message, action_url)
             VALUES ($1, 'system', 'RSVP Confirmed', $2, '/events')`,
            [waitlistUser.user_id, `Your waitlist registration for "${eventInfo.rows[0].title}" has been confirmed!`]
          );
        } else {
          // No waitlisted users, release seat
          await client.query(
            `UPDATE events SET available_seats = available_seats + 1 WHERE event_id = $1`,
            [eventId]
          );
        }
      }
    });

    res.json({
      success: true,
      message: "RSVP cancelled successfully.",
    });
  })
);

// GET /api/events/:id/rsvps — Get participant list
router.get(
  "/:id/rsvps",
  authenticate,
  requireRole("admin", "archivist"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const participants = await query(
      `SELECT r.rsvp_id, r.created_at as rsvp_at, u.user_id, u.name, u.email, u.department
       FROM event_rsvps r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.event_id = $1
       ORDER BY r.created_at ASC`,
      [id]
    );
    res.json({
      success: true,
      data: participants,
    });
  })
);

// DELETE /api/events/:id — Delete event
router.delete(
  "/:id",
  authenticate,
  requireRole("admin", "archivist"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const rsvpedUsers = await query<{ user_id: string }>(
      "SELECT user_id FROM event_rsvps WHERE event_id = $1",
      [id]
    );

    let eventTitle = "";
    await withTransaction(async (client) => {
      const eventRes = await client.query("SELECT title FROM events WHERE event_id = $1", [id]);
      if (eventRes.rowCount === 0) throw new AppError(404, "Event not found");
      eventTitle = eventRes.rows[0].title;

      await client.query("DELETE FROM event_rsvps WHERE event_id = $1", [id]);
      await client.query("DELETE FROM events WHERE event_id = $1", [id]);
    });

    // Everyone who RSVPed loses their seat when the event disappears — tell them
    // rather than letting them show up to nothing.
    if (rsvpedUsers.length > 0) {
      void notifyUsers(rsvpedUsers.map((u) => u.user_id), {
        type: "event_cancelled",
        title: "Event Cancelled",
        message: `"${eventTitle}" has been cancelled. Your RSVP is no longer valid.`,
        action_url: "/events",
      });
    }

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  })
);

export default router;
