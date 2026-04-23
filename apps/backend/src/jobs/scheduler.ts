import cron from "node-cron";
import { query } from "../db/pool";
import { config } from "../config";
import { sendEmail, dueDateReminderEmail } from "../services/email.service";
import { retryQueuedUploads } from "../services/s3.service";
import { logger } from "../config/logger";

// ---------------------------------------------------------------------------
// Failed-jobs log (in-memory; can be persisted to DB in the future)
// ---------------------------------------------------------------------------
interface FailedJobEntry {
  name: string;
  attempt: number;
  error: string;
  ts: string;
}

const failedJobsLog: FailedJobEntry[] = [];

function recordFailure(name: string, attempt: number, err: unknown): void {
  const entry: FailedJobEntry = {
    name,
    attempt,
    error: (err as Error).message ?? String(err),
    ts: new Date().toISOString(),
  };
  failedJobsLog.push(entry);
  // Keep only the last 200 entries
  if (failedJobsLog.length > 200) failedJobsLog.splice(0, failedJobsLog.length - 200);
}

/** Retrieve the most recent failed-jobs entries (latest first). */
export function getFailedJobsLog(limit = 50): FailedJobEntry[] {
  return failedJobsLog.slice(-limit).reverse();
}

// ---------------------------------------------------------------------------
// Retry wrapper – 3 attempts with exponential back-off
// ---------------------------------------------------------------------------
async function withRetry(
  name: string,
  fn: () => Promise<void>,
  maxAttempts = 3,
  baseDelayMs = 2000
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fn();
      return;
    } catch (err) {
      recordFailure(name, attempt, err);
      logger.warn(`Job "${name}" failed on attempt ${attempt}/${maxAttempts}`, {
        error: (err as Error).message,
      });
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.error(`Job "${name}" exhausted all retries`, {
          error: (err as Error).message,
        });
      }
    }
  }
}

export function startScheduler(): void {
  // Daily at 8 AM: detect overdue and send reminders
  cron.schedule("0 8 * * *", () => {
    void withRetry("checkOverdueAndSendReminders", checkOverdueAndSendReminders);
    void withRetry("calculateOverdueFines", calculateOverdueFines);
  });

  // Daily at 9 AM: retry any S3 uploads that were queued locally
  cron.schedule("0 9 * * *", () => {
    void withRetry("retryQueuedUploads", retryQueuedUploads);
  });

  logger.info("Job scheduler started");
}

async function checkOverdueAndSendReminders(): Promise<void> {
  // 3-day reminder
  const threeDayReminders = await query<{
    transaction_id: string;
    member_id: string;
    member_name: string;
    member_email: string;
    book_title: string;
    due_date: string;
  }>(
    `SELECT lt.transaction_id, lt.member_id, u.name as member_name, u.email as member_email,
            ci.title as book_title, lt.due_date
     FROM lending_transactions lt
     JOIN users u ON lt.member_id = u.user_id
     JOIN catalog_items ci ON lt.catalog_id = ci.catalog_id
     WHERE lt.status = 'active'
       AND lt.due_date = CURRENT_DATE + INTERVAL '3 days'`
  );

  for (const reminder of threeDayReminders) {
    await sendEmail({
      to: reminder.member_email,
      subject: `Reminder: "${reminder.book_title}" due in 3 days`,
      html: dueDateReminderEmail(reminder.member_name, reminder.book_title, reminder.due_date, 3),
    });

    await query(
      `INSERT INTO notifications (user_id, type, title, message, action_url)
       VALUES ($1, 'due_date_reminder', $2, $3, '/dashboard')
       ON CONFLICT DO NOTHING`,
      [reminder.member_id, "Book Due in 3 Days", `"${reminder.book_title}" is due on ${reminder.due_date}`]
    );
  }

  // Same-day reminder
  const todayReminders = await query<{
    member_id: string;
    member_name: string;
    member_email: string;
    book_title: string;
    due_date: string;
  }>(
    `SELECT lt.member_id, u.name as member_name, u.email as member_email,
            ci.title as book_title, lt.due_date
     FROM lending_transactions lt
     JOIN users u ON lt.member_id = u.user_id
     JOIN catalog_items ci ON lt.catalog_id = ci.catalog_id
     WHERE lt.status = 'active' AND lt.due_date = CURRENT_DATE`
  );

  for (const reminder of todayReminders) {
    await sendEmail({
      to: reminder.member_email,
      subject: `Due Today: "${reminder.book_title}"`,
      html: dueDateReminderEmail(reminder.member_name, reminder.book_title, reminder.due_date, 0),
    });
  }

  logger.info("Overdue reminders sent", {
    three_day: threeDayReminders.length,
    today: todayReminders.length,
  });
}

async function calculateOverdueFines(): Promise<void> {
  // Mark overdue transactions
  await query(
    `UPDATE lending_transactions
     SET status = 'overdue'
     WHERE status = 'active' AND due_date < CURRENT_DATE`
  );

  // Calculate and upsert fines for overdue items
  const overdueItems = await query<{
    transaction_id: string;
    member_id: string;
    due_date: string;
    book_title: string;
  }>(
    `SELECT lt.transaction_id, lt.member_id, lt.due_date, ci.title as book_title
     FROM lending_transactions lt
     JOIN catalog_items ci ON lt.catalog_id = ci.catalog_id
     WHERE lt.status = 'overdue'`
  );

  for (const item of overdueItems) {
    const daysOverdue = Math.floor(
      (Date.now() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    const fineAmount = daysOverdue * config.library.fineRatePerDay;

    await query(
      `INSERT INTO fines (member_id, transaction_id, amount, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (transaction_id) DO UPDATE SET amount = $3`,
      [item.member_id, item.transaction_id, fineAmount, `Overdue fine for "${item.book_title}"`]
    ).catch(() => {
      // Fine may already exist without unique constraint — update separately
      query(
        "UPDATE fines SET amount = $1 WHERE transaction_id = $2 AND status = 'pending'",
        [fineAmount, item.transaction_id]
      ).catch(() => {});
    });
  }

  logger.info("Overdue fines calculated", { count: overdueItems.length });
}

