import cron from "node-cron";
import { query } from "../db/pool";
import { config } from "../config";
import { sendEmail, dueDateReminderEmail } from "../services/email.service";
import { logger } from "../config/logger";

export function startScheduler(): void {
  // Daily at 8 AM: detect overdue and send reminders
  cron.schedule("0 8 * * *", async () => {
    logger.info("Running daily overdue check");
    await checkOverdueAndSendReminders();
    await calculateOverdueFines();
  });

  logger.info("Job scheduler started");
}

async function checkOverdueAndSendReminders(): Promise<void> {
  try {
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
  } catch (err) {
    logger.error("Failed to send overdue reminders", { error: (err as Error).message });
  }
}

async function calculateOverdueFines(): Promise<void> {
  try {
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
  } catch (err) {
    logger.error("Failed to calculate fines", { error: (err as Error).message });
  }
}
