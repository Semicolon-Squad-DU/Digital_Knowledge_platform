import { Router, Response } from "express";
import { query, queryOne, withTransaction } from "../db/pool";
import { authenticate, requireRole, optionalAuth, AuthRequest } from "../middleware/auth.middleware";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { searchCatalog } from "../services/elasticsearch.service";
import { config } from "../config";
import { sendEmail, dueDateReminderEmail, holdAvailableEmail } from "../services/email.service";

const router = Router();

// GET /api/library/catalog/search
router.get("/catalog/search", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, author, isbn, category, availability, year_from, year_to, page, limit } =
    req.query as Record<string, string>;

  const result = await searchCatalog({
    query: q, author, isbn, category,
    availability: availability as "available" | "on_loan" | "all",
    year_from: year_from ? parseInt(year_from) : undefined,
    year_to: year_to ? parseInt(year_to) : undefined,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });

  res.json({
    success: true,
    data: {
      items: result.hits, total: result.total,
      page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20,
      total_pages: Math.ceil(result.total / (limit ? parseInt(limit) : 20)),
    },
  });
}));

// GET /api/library/dashboard
router.get(
  "/dashboard",
  authenticate,
  requireRole("librarian", "admin"),
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const [stats] = await query<{
      on_loan: string; overdue: string; returns_today: string; holds_pending: string;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM lending_transactions WHERE status = 'active') as on_loan,
         (SELECT COUNT(*) FROM lending_transactions WHERE status = 'active' AND due_date < CURRENT_DATE) as overdue,
         (SELECT COUNT(*) FROM lending_transactions WHERE return_date = CURRENT_DATE) as returns_today,
         (SELECT COUNT(*) FROM hold_requests WHERE status = 'pending') as holds_pending`
    );

    const [fineStats] = await query<{ total_fines: string; pending_count: string }>(
      "SELECT COALESCE(SUM(amount), 0) as total_fines, COUNT(*) as pending_count FROM fines WHERE status = 'pending'"
    );

    const recentTransactions = await query(
      `SELECT lt.*, ci.title, u.name as member_name
       FROM lending_transactions lt
       JOIN catalog_items ci ON lt.catalog_id = ci.catalog_id
       JOIN users u ON lt.member_id = u.user_id
       ORDER BY lt.created_at DESC LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        on_loan: parseInt(stats.on_loan), overdue: parseInt(stats.overdue),
        returns_today: parseInt(stats.returns_today), holds_pending: parseInt(stats.holds_pending),
        fines_pending: parseInt(fineStats.pending_count),
        total_fines_amount: parseFloat(fineStats.total_fines),
        recent_transactions: recentTransactions,
      },
    });
  })
);

// GET /api/library/overdue
router.get(
  "/overdue",
  authenticate,
  requireRole("librarian", "admin"),
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const overdueTransactions = await query(
      `SELECT 
         lt.transaction_id,
         lt.member_id,
         u.name as member_name,
         u.email as member_email,
         ci.catalog_id,
         ci.title,
         ci.isbn,
         lt.due_date,
         CURRENT_DATE - lt.due_date as days_overdue,
         COALESCE(f.amount, 0) as fine_amount,
         f.fine_id,
         f.status as fine_status,
         lt.status
       FROM lending_transactions lt
       JOIN users u ON lt.member_id = u.user_id
       JOIN catalog_items ci ON lt.catalog_id = ci.catalog_id
       LEFT JOIN fines f ON lt.transaction_id = f.transaction_id
       WHERE lt.status = 'active' AND lt.due_date < CURRENT_DATE
       ORDER BY days_overdue DESC`
    );

    res.json({
      success: true,
      data: overdueTransactions,
    });
  })
);

// GET /api/library/wishlist
router.get("/wishlist", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const items = await query(
    `SELECT w.*, ci.title, ci.authors, ci.available_copies, ci.cover_url
     FROM wishlists w
     JOIN catalog_items ci ON w.catalog_id = ci.catalog_id
     WHERE w.member_id = $1
     ORDER BY w.added_at DESC`,
    [req.user!.user_id]
  );
  res.json({ success: true, data: items });
}));

// POST /api/library/wishlist
router.post("/wishlist", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { catalog_id } = req.body as { catalog_id: string };
  const item = await queryOne(
    "INSERT INTO wishlists (member_id, catalog_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *",
    [req.user!.user_id, catalog_id]
  );
  res.status(201).json({ success: true, data: item });
}));

// DELETE /api/library/wishlist/:catalog_id
router.delete("/wishlist/:catalog_id", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  await query(
    "DELETE FROM wishlists WHERE member_id = $1 AND catalog_id = $2",
    [req.user!.user_id, req.params.catalog_id]
  );
  res.json({ success: true, message: "Removed from wishlist" });
}));

// POST /api/library/holds
router.post("/holds", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { catalog_id } = req.body as { catalog_id: string };
  if (!catalog_id) throw new AppError(400, "catalog_id required");

  const existing = await queryOne(
    "SELECT hold_id FROM hold_requests WHERE catalog_id = $1 AND member_id = $2 AND status IN ('pending','available')",
    [catalog_id, req.user!.user_id]
  );
  if (existing) throw new AppError(409, "Hold already placed for this item");

  const hold = await queryOne(
    "INSERT INTO hold_requests (catalog_id, member_id) VALUES ($1, $2) RETURNING *",
    [catalog_id, req.user!.user_id]
  );

  const [{ count }] = await query<{ count: string }>(
    "SELECT COUNT(*) FROM hold_requests WHERE catalog_id = $1 AND status = 'pending'",
    [catalog_id]
  );

  res.status(201).json({ success: true, data: { ...hold, queue_position: parseInt(count) } });
}));

// POST /api/library/issue
router.post(
  "/issue",
  authenticate,
  requireRole("librarian", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { catalog_id, member_id } = req.body as { catalog_id: string; member_id: string };
    if (!catalog_id || !member_id) throw new AppError(400, "catalog_id and member_id required");

    const transaction = await withTransaction(async (client) => {
      const [item] = (await client.query(
        "SELECT * FROM catalog_items WHERE catalog_id = $1 AND deleted_at IS NULL FOR UPDATE",
        [catalog_id]
      )).rows;
      if (!item) throw new AppError(404, "Catalog item not found");
      if (item.available_copies < 1) throw new AppError(409, "No copies available. Consider placing a hold.");

      const [member] = (await client.query(
        "SELECT user_id, name, email, membership_status FROM users WHERE user_id = $1",
        [member_id]
      )).rows;
      if (!member) throw new AppError(404, "Member not found");
      if (member.membership_status !== "active") throw new AppError(403, "Member account is not active");

      const [{ count }] = (await client.query(
        "SELECT COUNT(*) FROM lending_transactions WHERE member_id = $1 AND status = 'active'",
        [member_id]
      )).rows;
      if (parseInt(count) >= config.library.maxBorrowLimit) {
        throw new AppError(409, `Borrow limit reached (max ${config.library.maxBorrowLimit} items)`);
      }

      const [fineResult] = (await client.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE member_id = $1 AND status = 'pending'",
        [member_id]
      )).rows;
      if (parseFloat(fineResult.total) > 100) {
        throw new AppError(403, "Outstanding fines exceed limit. Please clear dues first.");
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + config.library.loanPeriodDays);

      const [txn] = (await client.query(
        `INSERT INTO lending_transactions (catalog_id, member_id, due_date)
         VALUES ($1, $2, $3) RETURNING *`,
        [catalog_id, member_id, dueDate.toISOString().split("T")[0]]
      )).rows;

      await client.query(
        "UPDATE catalog_items SET available_copies = available_copies - 1 WHERE catalog_id = $1",
        [catalog_id]
      );

      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, 'CREATE', 'lending_transaction', $2, $3, $4)`,
        [req.user!.user_id, txn.transaction_id, JSON.stringify({ catalog_id, member_id }), req.ip]
      );

      client.query(
        `INSERT INTO notifications (user_id, type, title, message, action_url)
         VALUES ($1, 'due_date_reminder', $2, $3, $4)`,
        [member_id, "Book Due Soon", `"${item.title}" is due on ${dueDate.toDateString()}`, "/dashboard"]
      ).catch(() => {});

      return { transaction: txn, member, item };
    });

    sendEmail({
      to: transaction.member.email,
      subject: "Book Issued Successfully",
      html: dueDateReminderEmail(
        transaction.member.name, transaction.item.title,
        new Date(transaction.transaction.due_date).toDateString(),
        config.library.loanPeriodDays
      ),
    }).catch(() => {});

    res.status(201).json({ success: true, data: transaction.transaction });
  })
);

// POST /api/library/return
router.post(
  "/return",
  authenticate,
  requireRole("librarian", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { transaction_id } = req.body as { transaction_id: string };
    if (!transaction_id) throw new AppError(400, "transaction_id required");

    const result = await withTransaction(async (client) => {
      const [txn] = (await client.query(
        `SELECT lt.*, ci.title as book_title
         FROM lending_transactions lt
         JOIN catalog_items ci ON lt.catalog_id = ci.catalog_id
         WHERE lt.transaction_id = $1 AND lt.status = 'active'
         FOR UPDATE`,
        [transaction_id]
      )).rows;

      if (!txn) throw new AppError(404, "Active transaction not found");

      const today = new Date();
      const dueDate = new Date(txn.due_date);
      let fineAmount = 0;

      if (today > dueDate) {
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        fineAmount = daysOverdue * config.library.fineRatePerDay;
      }

      const [updated] = (await client.query(
        `UPDATE lending_transactions
         SET return_date = CURRENT_DATE, fine_amount = $1, status = 'returned'
         WHERE transaction_id = $2 RETURNING *`,
        [fineAmount, transaction_id]
      )).rows;

      await client.query(
        "UPDATE catalog_items SET available_copies = available_copies + 1 WHERE catalog_id = $1",
        [txn.catalog_id]
      );

      if (fineAmount > 0) {
        await client.query(
          `INSERT INTO fines (member_id, transaction_id, amount, reason) VALUES ($1, $2, $3, $4)`,
          [txn.member_id, transaction_id, fineAmount, `Overdue fine for "${txn.book_title}"`]
        );
      }

      const [nextHold] = (await client.query(
        `SELECT hr.*, u.email, u.name FROM hold_requests hr
         JOIN users u ON hr.member_id = u.user_id
         WHERE hr.catalog_id = $1 AND hr.status = 'pending'
         ORDER BY hr.request_date ASC LIMIT 1`,
        [txn.catalog_id]
      )).rows;

      if (nextHold) {
        await client.query(
          "UPDATE hold_requests SET status = 'available' WHERE hold_id = $1",
          [nextHold.hold_id]
        );
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, action_url)
           VALUES ($1, 'hold_available', $2, $3, $4)`,
          [nextHold.member_id, "Hold Available", `"${txn.book_title}" is now available`, "/dashboard"]
        );

        const pickupDeadline = new Date();
        pickupDeadline.setDate(pickupDeadline.getDate() + 3);
        sendEmail({
          to: nextHold.email,
          subject: "Your Hold is Available",
          html: holdAvailableEmail(nextHold.name, txn.book_title, pickupDeadline.toDateString()),
        }).catch(() => {});
      }

      return { transaction: updated, fine_amount: fineAmount };
    });

    res.json({ success: true, data: result });
  })
);

// GET /api/library/member/:id/history
router.get(
  "/member/:id/history",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user!.role === "member" && req.user!.user_id !== req.params.id) {
      throw new AppError(403, "Access denied");
    }

    const transactions = await query(
      `SELECT lt.*, ci.title, ci.authors, ci.isbn
       FROM lending_transactions lt
       JOIN catalog_items ci ON lt.catalog_id = ci.catalog_id
       WHERE lt.member_id = $1
       ORDER BY lt.created_at DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: transactions });
  })
);

// GET /api/library/fines/:member_id
router.get("/fines/:member_id", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role === "member" && req.user!.user_id !== req.params.member_id) {
    throw new AppError(403, "Access denied");
  }

  const fines = await query(
    `SELECT f.*, lt.due_date, ci.title as book_title
     FROM fines f
     JOIN lending_transactions lt ON f.transaction_id = lt.transaction_id
     JOIN catalog_items ci ON lt.catalog_id = ci.catalog_id
     WHERE f.member_id = $1
     ORDER BY f.created_at DESC`,
    [req.params.member_id]
  );

  const [{ total }] = await query<{ total: string }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE member_id = $1 AND status = 'pending'",
    [req.params.member_id]
  );

  res.json({ success: true, data: { fines, total_pending: parseFloat(total) } });
}));

// PATCH /api/library/fines/:fine_id/waive
router.patch(
  "/fines/:fine_id/waive",
  authenticate,
  requireRole("librarian", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const fine = await queryOne(
      "UPDATE fines SET status = 'waived' WHERE fine_id = $1 RETURNING *",
      [req.params.fine_id]
    );
    if (!fine) throw new AppError(404, "Fine not found");
    res.json({ success: true, data: fine });
  })
);

// PATCH /api/library/fines/:fine_id/adjust
router.patch(
  "/fines/:fine_id/adjust",
  authenticate,
  requireRole("librarian", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { amount, reason } = req.body as { amount: number; reason: string };

    if (amount === undefined || amount === null) {
      throw new AppError(400, "Amount is required");
    }

    if (amount < 0) {
      throw new AppError(400, "Amount must be non-negative");
    }

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      throw new AppError(400, "Reason is required");
    }

    const fine = await queryOne(
      `UPDATE fines
       SET amount = $1, reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE fine_id = $3
       RETURNING *`,
      [amount, reason.trim(), req.params.fine_id]
    );

    if (!fine) throw new AppError(404, "Fine not found");

    // Log the adjustment in audit logs
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'UPDATE', 'fine', $2, $3, $4)`,
      [req.user!.user_id, req.params.fine_id, JSON.stringify({ amount, reason }), req.ip]
    );

    res.json({ success: true, data: fine });
  })
);

// GET /api/library/catalog/:id
router.get("/catalog/:id", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await queryOne(
    "SELECT * FROM catalog_items WHERE catalog_id = $1 AND deleted_at IS NULL",
    [req.params.id]
  );
  if (!item) throw new AppError(404, "Catalog item not found");
  res.json({ success: true, data: item });
}));

// POST /api/library/catalog
router.post(
  "/catalog",
  authenticate,
  requireRole("librarian", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, isbn, authors, publisher, edition, year, category, total_copies, shelf_location, description } =
      req.body as Record<string, unknown>;

    if (!title) throw new AppError(400, "Title is required");
    if (!total_copies || (total_copies as number) < 1) throw new AppError(400, "At least 1 copy required");

    const item = await queryOne(
      `INSERT INTO catalog_items
         (title, isbn, authors, publisher, edition, year, category, total_copies, available_copies, shelf_location, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10)
       RETURNING *`,
      [title, isbn || null, authors || [], publisher || null, edition || null, year || null,
       category || "General", total_copies, shelf_location || null, description || null]
    );

    res.status(201).json({ success: true, data: item });
  })
);

// PUT /api/library/catalog/:id
router.put(
  "/catalog/:id",
  authenticate,
  requireRole("librarian", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const existing = await queryOne(
      "SELECT * FROM catalog_items WHERE catalog_id = $1 AND deleted_at IS NULL",
      [req.params.id]
    );
    if (!existing) throw new AppError(404, "Catalog item not found");

    const { title, isbn, authors, publisher, edition, year, category, total_copies, shelf_location, description } =
      req.body as Record<string, unknown>;

    const item = await queryOne(
      `UPDATE catalog_items SET
         title = COALESCE($1, title), isbn = COALESCE($2, isbn), authors = COALESCE($3, authors),
         publisher = COALESCE($4, publisher), edition = COALESCE($5, edition), year = COALESCE($6, year),
         category = COALESCE($7, category), total_copies = COALESCE($8, total_copies),
         shelf_location = COALESCE($9, shelf_location), description = COALESCE($10, description)
       WHERE catalog_id = $11 RETURNING *`,
      [title, isbn, authors, publisher, edition, year, category, total_copies, shelf_location, description, req.params.id]
    );

    res.json({ success: true, data: item });
  })
);

// DELETE /api/library/catalog/:id
router.delete(
  "/catalog/:id",
  authenticate,
  requireRole("librarian", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await query("UPDATE catalog_items SET deleted_at = NOW() WHERE catalog_id = $1", [req.params.id]);
    res.json({ success: true, message: "Catalog item deleted" });
  })
);

export default router;
