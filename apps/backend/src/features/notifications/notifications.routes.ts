import { Router, Response } from "express";
import { query, queryOne } from "../../core/db/pool";
import { authenticate, requireRole, AuthRequest } from "../../core/middleware/auth.middleware";
import { AppError, asyncHandler } from "../../core/middleware/error.middleware";
import { sendEmail } from "../../infrastructure/email.service";

const router = Router();

// GET /api/notifications
router.get("/", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = "1", limit = "20", unread_only } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);

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
    [req.user!.user_id, parseInt(limit), offset]
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
      page: parseInt(page), limit: parseInt(limit),
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

export default router;
