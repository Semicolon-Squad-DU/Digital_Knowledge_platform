import { Router, Response } from "express";
import { query, queryOne, withTransaction } from "../db/pool";
import { authenticate, optionalAuth, requireRole, AuthRequest } from "../middleware/auth.middleware";
import { AppError, asyncHandler } from "../middleware/error.middleware";

const router = Router();

// GET /api/events
router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id;

    // Fetch all events, sorted by scheduled date ASC
    const eventsList = await query<any>(
      `SELECT e.*, 
       CASE WHEN $1::UUID IS NOT NULL AND r.rsvp_id IS NOT NULL THEN TRUE ELSE FALSE END as has_rsvped
       FROM events e
       LEFT JOIN event_rsvps r ON e.event_id = r.event_id AND r.user_id = $1
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
  requireRole("admin", "archivist", "librarian"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, description, speaker, scheduledAt, location, totalSeats, materialsUrl } = req.body;
    const userId = req.user!.user_id;

    if (!title || !description || !speaker || !scheduledAt || !location || totalSeats === undefined) {
      throw new AppError(400, "All event details are required");
    }

    const newEvent = await queryOne<any>(
      `INSERT INTO events (title, description, speaker, scheduled_at, location, total_seats, available_seats, materials_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8)
       RETURNING *`,
      [title, description, speaker, scheduledAt, location, parseInt(totalSeats), materialsUrl || null, userId]
    );

    res.status(201).json({
      success: true,
      data: newEvent,
    });
  })
);

// POST /api/events/:id/rsvp
router.post(
  "/:id/rsvp",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const eventId = req.params.id;
    const userId = req.user!.user_id;

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
        throw new AppError(400, "Sorry, no seats are available for this seminar");
      }

      // 4. Record RSVP and decrement seat availability
      await client.query(
        `INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2)`,
        [eventId, userId]
      );

      await client.query(
        `UPDATE events SET available_seats = available_seats - 1 WHERE event_id = $1`,
        [eventId]
      );
    });

    res.json({
      success: true,
      message: "RSVP registered successfully! Your seat is booked.",
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
      if (!rsvpRes.rows[0]) {
        throw new AppError(404, "RSVP registration not found");
      }

      // 2. Delete RSVP and increment seat availability
      await client.query(
        `DELETE FROM event_rsvps WHERE event_id = $1 AND user_id = $2`,
        [eventId, userId]
      );

      await client.query(
        `UPDATE events SET available_seats = available_seats + 1 WHERE event_id = $1`,
        [eventId]
      );
    });

    res.json({
      success: true,
      message: "RSVP cancelled. Your seat is released.",
    });
  })
);

export default router;
