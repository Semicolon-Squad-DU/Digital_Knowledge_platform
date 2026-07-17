import { Router, Response } from "express";
import { query, queryOne } from "../../core/db/pool";
import { authenticate, requireRole, AuthRequest } from "../../core/middleware/auth.middleware";
import { AppError, asyncHandler } from "../../core/middleware/error.middleware";
import { parsePagination } from "../../core/utils/pagination";
import { sendEmail } from "../../infrastructure/email.service";

const router = Router();

// GET /api/notifications
router.get("/", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = "1", limit = "20", unread_only } = req.query as Record<string, string>;
  const { page: pageNum, limit: limitNum, offset } = parsePagination(page, limit);

  const conditions = ["user_id = $1"];
  const params: unknown[] = [req.user!.user_id];

  if (unread_only === "true") {
    conditions.push("read = FALSE");
  }

  const where = conditions.join(" AND ");

  const [{ count }] = await query<{ count: string }>(
    `SELECT COUNT(*) FROM notifications WHERE ${where}`,
    params
  );

  const notifications = await query(
    `SELECT * FROM notifications WHERE ${where}
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [req.user!.user_id, limitNum, offset]
  );

  const [{ unread_count }] = await query<{ unread_count: string }>(
    "SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND read = FALSE",
    [req.user!.user_id]
  );

  res.json({
    success: true,
    data: {
      notifications, total: parseInt(count),
      unread_count: parseInt(unread_count),
      page: pageNum, limit: limitNum,
    },
  });
}));

// PATCH /api/notifications/read-all
router.patch("/read-all", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  await query(
    "UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE",
    [req.user!.user_id]
  );
  res.json({ success: true });
}));

// PATCH /api/notifications/:id/read
router.patch("/:id/read", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  await query(
    "UPDATE notifications SET read = TRUE WHERE notification_id = $1 AND user_id = $2",
    [req.params.id, req.user!.user_id]
  );
  res.json({ success: true });
}));

// DELETE /api/notifications — delete all of the current user's notifications
router.delete("/", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await query(
    "DELETE FROM notifications WHERE user_id = $1 RETURNING notification_id",
    [req.user!.user_id]
  );
  res.json({ success: true, data: { deleted: result.length } });
}));

// DELETE /api/notifications/:id — delete a single notification
router.delete("/:id", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const deleted = await queryOne(
    "DELETE FROM notifications WHERE notification_id = $1 AND user_id = $2 RETURNING notification_id",
    [req.params.id, req.user!.user_id]
  );
  if (!deleted) throw new AppError(404, "Notification not found");
  res.json({ success: true });
}));

// GET /api/notifications/announcements — history, for the admin "edit & resend" list
router.get(
  "/announcements",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const announcements = await query(
      `SELECT a.announcement_id, a.title, a.body, a.target_role, a.created_at, u.name as created_by_name
       FROM announcements a
       LEFT JOIN users u ON a.created_by = u.user_id
       ORDER BY a.created_at DESC
       LIMIT 50`
    );
    res.json({ success: true, data: announcements });
  })
);

// POST /api/notifications/announcements
router.post(
  "/announcements",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, body, target_role } = req.body as {
      title: string; body: string; target_role?: string;
    };

    if (!title || !body) throw new AppError(400, "title and body required");

    const announcement = await queryOne(
      "INSERT INTO announcements (created_by, title, body, target_role) VALUES ($1,$2,$3,$4) RETURNING *",
      [req.user!.user_id, title, body, target_role || null]
    );

    const userQuery = target_role
      ? "SELECT user_id, email, name FROM users WHERE role = $1 AND deleted_at IS NULL"
      : "SELECT user_id, email, name FROM users WHERE deleted_at IS NULL";
    const userParams = target_role ? [target_role] : [];

    const users = await query<{ user_id: string; email: string; name: string }>(userQuery, userParams);

    if (users.length > 0) {
      // 1. Deliver In-app Notifications
      const values = users
        .map((_, i) => `($${i * 4 + 1}, 'announcement', $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`)
        .join(", ");
      const params = users.flatMap((u) => [u.user_id, title, body, "/notifications"]);
      await query(
        `INSERT INTO notifications (user_id, type, title, message, action_url) VALUES ${values}`,
        params
      );

      // 2. Deliver Email Notifications
      const emailAddresses = users.map(u => u.email).filter(Boolean);
      if (emailAddresses.length > 0) {
        sendEmail({
          to: emailAddresses,
          subject: `[DKP Announcement] ${title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h2 style="color: #1a56db; margin-top: 0;">Digital Knowledge Platform</h2>
              <h3 style="color: #111827;">${title}</h3>
              <p style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${body}</p>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">Digital Knowledge Platform — University of Dhaka, CSE Department</p>
            </div>
          `,
        }).catch(err => {
          console.error("Failed to broadcast announcement emails:", err);
        });
      }
    }

    res.status(201).json({ success: true, data: announcement });

  })
);

// GET /api/notifications/preferences — current user's channel/event-type preferences.
// Rows are created lazily on first write; a user who has never saved preferences
// gets the same defaults the frontend toggles start at (see profile page).
router.get("/preferences", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prefs = await queryOne(
    "SELECT due_date_reminders, hold_availability, weekly_digest, in_app_alerts FROM notification_preferences WHERE user_id = $1",
    [req.user!.user_id]
  );

  res.json({
    success: true,
    data: prefs || {
      due_date_reminders: true,
      hold_availability: true,
      weekly_digest: false,
      in_app_alerts: true,
    },
  });
}));

// PUT /api/notifications/preferences — upsert the current user's preferences
router.put("/preferences", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { due_date_reminders, hold_availability, weekly_digest, in_app_alerts } = req.body as {
    due_date_reminders?: boolean; hold_availability?: boolean; weekly_digest?: boolean; in_app_alerts?: boolean;
  };

  const prefs = await queryOne(
    `INSERT INTO notification_preferences (user_id, due_date_reminders, hold_availability, weekly_digest, in_app_alerts)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       due_date_reminders = $2, hold_availability = $3, weekly_digest = $4, in_app_alerts = $5, updated_at = NOW()
     RETURNING due_date_reminders, hold_availability, weekly_digest, in_app_alerts`,
    [
      req.user!.user_id,
      due_date_reminders ?? true,
      hold_availability ?? true,
      weekly_digest ?? false,
      in_app_alerts ?? true,
    ]
  );

  res.json({ success: true, data: prefs });
}));

export default router;
