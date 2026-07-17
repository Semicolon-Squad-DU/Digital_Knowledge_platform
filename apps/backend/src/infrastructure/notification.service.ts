import { query } from "../core/db/pool";
import { logger } from "../core/config/logger";

export interface BroadcastNotification {
  type: string;
  title: string;
  message: string;
  action_url?: string;
}

// Bulk-inserts one notification row per active user, excluding the actor who
// triggered the event (nobody needs to be told about their own upload).
// Best-effort: failures are logged but never block the caller's real work
// (creating the event/book/research/document) — this is a side effect, not
// something that should fail the request.
export async function notifyAllUsersExcept(
  excludeUserId: string,
  notification: BroadcastNotification
): Promise<void> {
  try {
    const users = await query<{ user_id: string }>(
      "SELECT user_id FROM users WHERE user_id != $1 AND deleted_at IS NULL AND membership_status = 'active'",
      [excludeUserId]
    );
    await bulkInsert(users.map((u) => u.user_id), notification);
  } catch (err) {
    logger.error("Failed to broadcast notification to all users", {
      error: (err as Error).message,
      type: notification.type,
    });
  }
}

// Same idea, but targeted at an explicit list of user ids — used when the audience
// isn't "everyone" or "admins" but a specific set (e.g. everyone who RSVPed to an
// event that's being cancelled).
export async function notifyUsers(userIds: string[], notification: BroadcastNotification): Promise<void> {
  try {
    await bulkInsert(userIds, notification);
  } catch (err) {
    logger.error("Failed to notify targeted users", {
      error: (err as Error).message,
      type: notification.type,
    });
  }
}

// Same idea, but targeted at admins only — used to alert admins that a new
// privileged-role signup needs their approval.
export async function notifyAdmins(notification: BroadcastNotification): Promise<void> {
  try {
    const admins = await query<{ user_id: string }>(
      "SELECT user_id FROM users WHERE role = 'admin' AND deleted_at IS NULL AND membership_status = 'active'"
    );
    await bulkInsert(admins.map((u) => u.user_id), notification);
  } catch (err) {
    logger.error("Failed to notify admins", {
      error: (err as Error).message,
      type: notification.type,
    });
  }
}

async function bulkInsert(userIds: string[], notification: BroadcastNotification): Promise<void> {
  if (userIds.length === 0) return;

  const values = userIds
    .map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`)
    .join(", ");
  const params = userIds.flatMap((userId) => [
    userId,
    notification.type,
    notification.title,
    notification.message,
    notification.action_url ?? null,
  ]);

  await query(`INSERT INTO notifications (user_id, type, title, message, action_url) VALUES ${values}`, params);
}
