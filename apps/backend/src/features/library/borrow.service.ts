import { query, queryOne, withTransaction } from "../../core/db/pool";
import { AppError } from "../../core/middleware/error.middleware";
import { config } from "../../core/config";
import { sendEmail, dueDateReminderEmail, holdAvailableEmail } from "../../infrastructure/email.service";

export class BorrowService {
  /**
   * Issue a resource to a user (checkout).
   */
  static async issueResource(resource_id: string, user_id: string, executor_id: string, ip_address: string) {
    return await withTransaction(async (client) => {
      // Lock catalog item
      const [item] = (await client.query(
        "SELECT * FROM catalog_items WHERE catalog_id = $1 AND deleted_at IS NULL FOR UPDATE",
        [resource_id]
      )).rows;

      if (!item) throw new AppError(404, "Catalog item not found");
      if (item.available_copies < 1) throw new AppError(409, "No copies available. Consider placing a hold.");

      // Check member
      const [member] = (await client.query(
        "SELECT user_id, name, email, membership_status FROM users WHERE user_id = $1",
        [user_id]
      )).rows;

      if (!member) throw new AppError(404, "Member not found");
      if (member.membership_status !== "active") throw new AppError(403, "Member account is not active");

      // Check borrow limit
      const [{ count }] = (await client.query(
        "SELECT COUNT(*) FROM borrows WHERE user_id = $1 AND borrow_status = 'active'",
        [user_id]
      )).rows;

      if (parseInt(count) >= config.library.maxBorrowLimit) {
        throw new AppError(409, `Borrow limit reached (max ${config.library.maxBorrowLimit} items)`);
      }

      // Check outstanding fines
      const [fineResult] = (await client.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE member_id = $1 AND status = 'pending'",
        [user_id]
      )).rows;

      if (parseFloat(fineResult.total) > 100) {
        throw new AppError(403, "Outstanding fines exceed limit. Please clear dues first.");
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + config.library.loanPeriodDays);

      // Create borrow record
      const [borrow] = (await client.query(
        `INSERT INTO borrows (user_id, resource_id, due_date, borrow_status, approval_status)
         VALUES ($1, $2, $3, 'active', 'approved') RETURNING *`,
        [user_id, resource_id, dueDate.toISOString().split("T")[0]]
      )).rows;

      // Update catalog item
      const newAvailableCopies = item.available_copies - 1;
      const availabilityStatus = newAvailableCopies === 0 ? 'on_loan' : 'available';

      await client.query(
        "UPDATE catalog_items SET available_copies = $1, availability_status = $2 WHERE catalog_id = $3",
        [newAvailableCopies, availabilityStatus, resource_id]
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, 'CREATE', 'borrow', $2, $3, $4)`,
        [executor_id, borrow.id, JSON.stringify({ resource_id, user_id }), ip_address]
      );

      // Notify
      client.query(
        `INSERT INTO notifications (user_id, type, title, message, action_url)
         VALUES ($1, 'due_date_reminder', $2, $3, $4)`,
        [user_id, "Book Due Soon", `"${item.title}" is due on ${dueDate.toDateString()}`, "/dashboard"]
      ).catch(() => {});

      sendEmail({
        to: member.email,
        subject: "Book Issued Successfully",
        html: dueDateReminderEmail(
          member.name, item.title,
          dueDate.toDateString(),
          config.library.loanPeriodDays
        ),
      }).catch(() => {});

      return { borrow, member, item };
    });
  }

  /**
   * Return a borrowed resource.
   */
  static async returnResource(borrow_id: string) {
    return await withTransaction(async (client) => {
      // Lock borrow record and get catalog title safely
      const [borrow] = (await client.query(
        `SELECT b.*, ci.title as book_title
         FROM borrows b
         JOIN catalog_items ci ON b.resource_id = ci.catalog_id
         WHERE b.id = $1 AND b.borrow_status IN ('active', 'overdue')
         FOR UPDATE`,
        [borrow_id]
      )).rows;

      if (!borrow) throw new AppError(404, "Active borrow record not found");

      const today = new Date();
      const dueDate = new Date(borrow.due_date);
      let fineAmount = parseFloat(borrow.fine_amount) || 0;

      // Ensure overdue fine is calculated properly
      if (today > dueDate) {
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        // If overdueDetection already set fines maybe don't double add, 
        // but let's recalculate based strictly on daysOverdue
        if (daysOverdue > 0) {
           fineAmount = daysOverdue * config.library.fineRatePerDay;
        }
      }

      // Update borrow record
      const [updatedBorrow] = (await client.query(
        `UPDATE borrows
         SET return_date = CURRENT_DATE, fine_amount = $1, borrow_status = 'returned'
         WHERE id = $2 RETURNING *`,
        [fineAmount, borrow_id]
      )).rows;

      // Update catalog item
      await client.query(
        "UPDATE catalog_items SET available_copies = available_copies + 1, availability_status = 'available' WHERE catalog_id = $1",
        [borrow.resource_id]
      );

      // Create fine record if needed
      if (fineAmount > 0) {
        // Use ON CONFLICT or check if fine exists, but schema ensures UNIQUE (borrow_id)
        await client.query(
          `INSERT INTO fines (member_id, borrow_id, amount, reason) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (borrow_id) DO UPDATE SET amount = EXCLUDED.amount`,
          [borrow.user_id, borrow_id, fineAmount, `Overdue fine for "${borrow.book_title}"`]
        );
      }

      // Check next holds
      const [nextHold] = (await client.query(
        `SELECT hr.*, u.email, u.name FROM hold_requests hr
         JOIN users u ON hr.member_id = u.user_id
         WHERE hr.catalog_id = $1 AND hr.status = 'pending'
         ORDER BY hr.request_date ASC LIMIT 1`,
        [borrow.resource_id]
      )).rows;

      if (nextHold) {
        await client.query(
          "UPDATE hold_requests SET status = 'available' WHERE hold_id = $1",
          [nextHold.hold_id]
        );
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, action_url)
           VALUES ($1, 'hold_available', $2, $3, $4)`,
          [nextHold.member_id, "Hold Available", `"${borrow.book_title}" is now available`, "/dashboard"]
        );

        const pickupDeadline = new Date();
        pickupDeadline.setDate(pickupDeadline.getDate() + 3);
        sendEmail({
          to: nextHold.email,
          subject: "Your Hold is Available",
          html: holdAvailableEmail(nextHold.name, borrow.book_title, pickupDeadline.toDateString()),
        }).catch(() => {});
      }

      return { borrow: updatedBorrow, fine_amount: fineAmount };
    });
  }

  /**
   * Overdue detection job: Updates borrow_status to 'overdue' when due_date < CURRENT_DATE
   */
  static async overdueDetection() {
    return await withTransaction(async (client) => {
      const [result] = (await client.query(
        `UPDATE borrows
         SET borrow_status = 'overdue'
         WHERE due_date < CURRENT_DATE AND borrow_status = 'active'
         RETURNING *`
      )).rows;
      return result;
    });
  }
}
