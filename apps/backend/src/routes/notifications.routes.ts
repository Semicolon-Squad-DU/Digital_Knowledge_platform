import { Router, Response } from "express";
import { query, queryOne } from "../db/pool";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth.middleware";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { v4 as uuid } from "uuid";

const router = Router();

// GET /api/notifications
router.get("/", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = "1", limit = "20", unread_only } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ["user_id = $1"];
  const params: unknown[] = [req.user!.user_id];

  if (unread_only === "true") {
    conditions.push("read = FALSE");
  }

  const where = conditions.join(" AND ");

  // Get count and notifications in a single optimized query
  const results = await query<{
    total: number;
    unread_count: number;
    notification_id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    action_url: string;
    read: boolean;
    created_at: string;
  }>(
    `WITH notification_data AS (
      SELECT 
        (SELECT COUNT(*) FROM notifications WHERE ${where}) as total,
        (SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = FALSE) as unread_count
    )
    SELECT 
      notification_data.total,
      notification_data.unread_count,
      n.notification_id,
      n.user_id,
      n.type,
      n.title,
      n.message,
      n.action_url,
      n.read,
      n.created_at
    FROM notification_data, notifications n
    WHERE ${where}
    ORDER BY n.created_at DESC
    LIMIT $2 OFFSET $3`,
    [req.user!.user_id, limitNum, offset]
  );

  if (results.length === 0) {
    return res.json({
      success: true,
      data: {
        notifications: [],
        total: 0,
        unread_count: 0,
        page: pageNum,
        limit: limitNum,
      },
    });
  }

  const firstRow = results[0];
  const notifications = results.map(r => ({
    notification_id: r.notification_id,
    user_id: r.user_id,
    type: r.type,
    title: r.title,
    message: r.message,
    action_url: r.action_url,
    read: r.read,
    created_at: r.created_at,
  }));

  res.json({
    success: true,
    data: {
      notifications,
      total: firstRow.total,
      unread_count: firstRow.unread_count,
      page: pageNum,
      limit: limitNum,
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
      ? "SELECT user_id FROM users WHERE role = $1 AND deleted_at IS NULL"
      : "SELECT user_id FROM users WHERE deleted_at IS NULL";
    const userParams = target_role ? [target_role] : [];

    const users = await query<{ user_id: string }>(userQuery, userParams);

    if (users.length > 0) {
      const values = users
        .map((_, i) => `($${i * 4 + 1}, 'announcement', $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`)
        .join(", ");
      const params = users.flatMap((u) => [u.user_id, title, body, "/notifications"]);
      await query(
        `INSERT INTO notifications (user_id, type, title, message, action_url) VALUES ${values}`,
        params
      );
    }

    res.status(201).json({ success: true, data: announcement });
  })
);

// POST /api/notifications/test - Create a test notification (for debugging)
router.post(
  "/test",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const notification = await queryOne(
      `INSERT INTO notifications (notification_id, user_id, type, title, message, action_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        uuid(),
        req.user!.user_id,
        "test",
        "Test Notification",
        "This is a test notification to verify the notification system is working correctly.",
        "/dashboard"
      ]
    );

    res.status(201).json({
      success: true,
      message: "Test notification created successfully",
      data: notification
    });
  })
);

export default router;
