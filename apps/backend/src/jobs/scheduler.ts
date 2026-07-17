import cron, { type ScheduledTask } from "node-cron";
import { query, queryOne } from "../core/db/pool";
import { config } from "../core/config";
import { sendEmail, dueDateReminderEmail, weeklyDigestEmail } from "../infrastructure/email.service";
import { retryQueuedUploads } from "../infrastructure/s3.service";
import { performBackup } from "../infrastructure/backup.service";
import { logger } from "../core/config/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type JobFn = () => Promise<void>;

interface FailedJob {
  name: string;
  fn: JobFn;
  failedAt: Date;
  lastError: string;
  attempts: number;
}

// In-memory failed jobs log (persists for the lifetime of the process)
const failedJobsLog: FailedJob[] = [];

// ---------------------------------------------------------------------------
// Retry wrapper — 3 attempts, exponential backoff (1s, 2s, 4s)
// ---------------------------------------------------------------------------

async function withRetry(name: string, fn: JobFn, maxAttempts = 3): Promise<void> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fn();
      // Success — remove from failed log if it was previously recorded
      const idx = failedJobsLog.findIndex((j) => j.name === name);
      if (idx !== -1) {
        failedJobsLog.splice(idx, 1);
        logger.info(`Job recovered successfully`, { job: name });
      }
      return;
    } catch (err) {
      lastError = err as Error;
      logger.warn(`Job attempt ${attempt}/${maxAttempts} failed`, {
        job: name,
        error: lastError.message,
      });

      if (attempt < maxAttempts) {
        const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  // All attempts exhausted — record in failed log
  logger.error(`Job failed after ${maxAttempts} attempts`, {
    job: name,
    error: lastError.message,
  });

  const existing = failedJobsLog.find((j) => j.name === name);
  if (existing) {
    existing.failedAt = new Date();
    existing.lastError = lastError.message;
    existing.attempts += maxAttempts;
  } else {
    failedJobsLog.push({
      name,
      fn,
      failedAt: new Date(),
      lastError: lastError.message,
      attempts: maxAttempts,
    });
  }
}

// ---------------------------------------------------------------------------
// Scheduler bootstrap
// ---------------------------------------------------------------------------

export async function startScheduler(): Promise<void> {
  // Daily at 8 AM: overdue check + fines
  cron.schedule("0 8 * * *", async () => {
    logger.info("Running daily overdue check");
    await withRetry("checkOverdueAndSendReminders", checkOverdueAndSendReminders);
    await withRetry("calculateOverdueFines", calculateOverdueFines);
  });

  // Daily at 9 AM: retry all previously failed jobs + queued S3 uploads
  cron.schedule("0 9 * * *", async () => {
    await withRetry("retryQueuedUploads", retryQueuedUploads);

    if (failedJobsLog.length === 0) {
      logger.info("No failed jobs to retry");
      return;
    }

    logger.info(`Retrying ${failedJobsLog.length} failed job(s)`);

    // Snapshot the list so mutations during iteration are safe
    const toRetry = [...failedJobsLog];
    for (const job of toRetry) {
      logger.info(`Retrying failed job`, { job: job.name, previousError: job.lastError });
      await withRetry(job.name, job.fn);
    }
  });

  // Weekly, Monday 7 AM: email digest of the past 7 days' notifications, sent
  // only to users who opted into "Weekly Digest" in their notification
  // preferences (see FR-044). Matches the label in profile settings — this
  // is not a daily job.
  cron.schedule("0 7 * * 1", async () => {
    logger.info("Running weekly notification digest");
    await withRetry("sendWeeklyDigests", sendWeeklyDigests);
  });

  await loadBackupSchedule();

  logger.info("Job scheduler started");
}

// ---------------------------------------------------------------------------
// Exported for monitoring / admin endpoints
// ---------------------------------------------------------------------------

export function getFailedJobs(): Readonly<FailedJob[]> {
  return failedJobsLog;
}

// ---------------------------------------------------------------------------
// Scheduled backups — dynamically reconfigurable at runtime from the
// backup_cron_expression / backup_enabled keys in system_configs, so the
// Admin > Backups schedule UI takes effect immediately without a restart.
// ---------------------------------------------------------------------------

let backupTask: ScheduledTask | null = null;

export async function loadBackupSchedule(): Promise<void> {
  const [enabledConfig, cronConfig] = await Promise.all([
    queryOne<{ value: string }>("SELECT value FROM system_configs WHERE key = 'backup_enabled'"),
    queryOne<{ value: string }>("SELECT value FROM system_configs WHERE key = 'backup_cron_expression'"),
  ]);

  applyBackupSchedule(
    cronConfig?.value || "0 9 * * *",
    enabledConfig ? enabledConfig.value === "true" : true
  );
}

export function applyBackupSchedule(cronExpression: string, enabled: boolean): void {
  if (backupTask) {
    backupTask.stop();
    backupTask = null;
  }

  if (!enabled) {
    logger.info("Scheduled backups disabled");
    return;
  }

  if (!cron.validate(cronExpression)) {
    logger.error("Invalid backup cron expression, scheduled backups not started", { cronExpression });
    return;
  }

  backupTask = cron.schedule(cronExpression, async () => {
    logger.info("Running scheduled database backup");
    await withRetry("runScheduledBackup", async () => {
      const record = await performBackup("scheduled");
      if (record.status !== "completed") {
        throw new Error(record.error_message || "Scheduled backup failed");
      }
    });
  });

  logger.info("Backup job scheduled", { cronExpression });
}

// ---------------------------------------------------------------------------
// Job implementations
// ---------------------------------------------------------------------------

async function checkOverdueAndSendReminders(): Promise<void> {
  // 3-day reminder — LEFT JOIN so a user with no preferences row (never
  // visited Account Settings) still gets reminders, matching the column
  // defaults (due_date_reminders / in_app_alerts both TRUE by default).
  const threeDayReminders = await query<{
    borrow_id: string;
    member_id: string;
    member_name: string;
    member_email: string;
    book_title: string;
    due_date: string;
    due_date_reminders: boolean;
    in_app_alerts: boolean;
  }>(
    `SELECT b.id as borrow_id, b.user_id as member_id, u.name as member_name, u.email as member_email,
            ci.title as book_title, b.due_date,
            COALESCE(np.due_date_reminders, TRUE) as due_date_reminders,
            COALESCE(np.in_app_alerts, TRUE) as in_app_alerts
     FROM borrows b
     JOIN users u ON b.user_id = u.user_id
     JOIN catalog_items ci ON b.resource_id = ci.catalog_id
     LEFT JOIN notification_preferences np ON np.user_id = b.user_id
     WHERE b.borrow_status = 'active'
       AND b.due_date = CURRENT_DATE + INTERVAL '3 days'`
  );

  for (const reminder of threeDayReminders) {
    if (reminder.due_date_reminders) {
      await sendEmail({
        to: reminder.member_email,
        subject: `Reminder: "${reminder.book_title}" due in 3 days`,
        html: dueDateReminderEmail(reminder.member_name, reminder.book_title, reminder.due_date, 3),
      });
    }

    if (reminder.in_app_alerts) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, action_url)
         VALUES ($1, 'due_date_reminder', $2, $3, '/dashboard')
         ON CONFLICT DO NOTHING`,
        [reminder.member_id, "Book Due in 3 Days", `"${reminder.book_title}" is due on ${reminder.due_date}`]
      );
    }
  }

  // Same-day reminder
  const todayReminders = await query<{
    member_id: string;
    member_name: string;
    member_email: string;
    book_title: string;
    due_date: string;
    due_date_reminders: boolean;
    in_app_alerts: boolean;
  }>(
    `SELECT b.user_id as member_id, u.name as member_name, u.email as member_email,
            ci.title as book_title, b.due_date,
            COALESCE(np.due_date_reminders, TRUE) as due_date_reminders,
            COALESCE(np.in_app_alerts, TRUE) as in_app_alerts
     FROM borrows b
     JOIN users u ON b.user_id = u.user_id
     JOIN catalog_items ci ON b.resource_id = ci.catalog_id
     LEFT JOIN notification_preferences np ON np.user_id = b.user_id
     WHERE b.borrow_status = 'active' AND b.due_date = CURRENT_DATE`
  );

  for (const reminder of todayReminders) {
    if (reminder.due_date_reminders) {
      await sendEmail({
        to: reminder.member_email,
        subject: `Due Today: "${reminder.book_title}"`,
        html: dueDateReminderEmail(reminder.member_name, reminder.book_title, reminder.due_date, 0),
      }).catch(() => {});
    }

    if (reminder.in_app_alerts) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, action_url)
         VALUES ($1, 'due_date_reminder', $2, $3, '/dashboard')
         ON CONFLICT DO NOTHING`,
        [reminder.member_id, "Book Due Today", `"${reminder.book_title}" is due today! Please return it to avoid fines.`]
      ).catch(() => {});
    }
  }

  logger.info("Overdue reminders sent", {
    three_day: threeDayReminders.length,
    today: todayReminders.length,
  });
}

async function calculateOverdueFines(): Promise<void> {
  // Mark overdue borrows
  await query(
    `UPDATE borrows
     SET borrow_status = 'overdue'
     WHERE borrow_status = 'active' AND due_date < CURRENT_DATE`
  );

  // Calculate and upsert fines for overdue items
  const overdueItems = await query<{
    borrow_id: string;
    member_id: string;
    due_date: string;
    book_title: string;
  }>(
    `SELECT b.id as borrow_id, b.user_id as member_id, b.due_date, ci.title as book_title
     FROM borrows b
     JOIN catalog_items ci ON b.resource_id = ci.catalog_id
     WHERE b.borrow_status = 'overdue'`
  );

  for (const item of overdueItems) {
    const daysOverdue = Math.floor(
      (Date.now() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    const fineAmount = Math.max(daysOverdue, 1) * config.library.fineRatePerDay;

    await query(
      `INSERT INTO fines (member_id, borrow_id, amount, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (borrow_id) DO UPDATE SET amount = $3, updated_at = NOW()`,
      [item.member_id, item.borrow_id, fineAmount, `Overdue fine for "${item.book_title}"`]
    );
  }

  logger.info("Overdue fines calculated", { count: overdueItems.length });
}

// FR-043: one email per user summarizing all in-app notifications they
// received (read or not) over the past 7 days — reuses the notifications
// table as the source of truth rather than tracking digest-eligible events
// separately, so the digest always matches what the in-app feed shows.
// Only sent to users who opted into weekly_digest (FR-044); everyone else
// is skipped even if they have unread notifications.
async function sendWeeklyDigests(): Promise<void> {
  const recipients = await query<{ user_id: string; name: string; email: string }>(
    `SELECT DISTINCT u.user_id, u.name, u.email
     FROM notifications n
     JOIN users u ON u.user_id = n.user_id
     JOIN notification_preferences np ON np.user_id = u.user_id
     WHERE n.created_at >= NOW() - INTERVAL '7 days'
       AND u.deleted_at IS NULL
       AND np.weekly_digest = TRUE`
  );

  let sent = 0;
  for (const recipient of recipients) {
    const items = await query<{ title: string; message: string; created_at: string }>(
      `SELECT title, message, created_at FROM notifications
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC`,
      [recipient.user_id]
    );
    if (items.length === 0) continue;

    await sendEmail({
      to: recipient.email,
      subject: `Your DKP weekly digest — ${items.length} update${items.length > 1 ? "s" : ""}`,
      html: weeklyDigestEmail(recipient.name, items),
    });
    sent++;
  }

  logger.info("Weekly digests sent", { recipients: sent });
}
