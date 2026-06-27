import { Router, Response } from "express";
import { query, queryOne, withTransaction } from "../../core/db/pool";
import { authenticate, requireRole, optionalAuth, AuthRequest } from "../../core/middleware/auth.middleware";
import { AppError, asyncHandler } from "../../core/middleware/error.middleware";
import { searchCatalog } from "../../infrastructure/elasticsearch.service";
import { config } from "../../core/config";
import { BorrowService } from "./borrow.service";
import { sendEmail, dueDateReminderEmail, holdAvailableEmail } from "../../infrastructure/email.service";

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
         (SELECT COUNT(*) FROM borrows WHERE borrow_status = 'active') as on_loan,
         (SELECT COUNT(*) FROM borrows WHERE borrow_status = 'overdue') as overdue,
         (SELECT COUNT(*) FROM borrows WHERE return_date = CURRENT_DATE) as returns_today,
         (SELECT COUNT(*) FROM hold_requests WHERE status = 'pending') as holds_pending`
    );

    const [fineStats] = await query<{ total_fines: string; pending_count: string }>(
      "SELECT COALESCE(SUM(amount), 0) as total_fines, COUNT(*) as pending_count FROM fines WHERE status = 'pending'"
    );

    const recentTransactions = await query(
      `SELECT b.id as transaction_id, b.user_id as member_id, b.resource_id as catalog_id, b.due_date, b.return_date, b.borrow_status as status, b.created_at, ci.title, u.name as member_name
       FROM borrows b
       JOIN catalog_items ci ON b.resource_id = ci.catalog_id
       JOIN users u ON b.user_id = u.user_id
       ORDER BY b.created_at DESC LIMIT 10`
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
         b.id as transaction_id,
         b.user_id as member_id,
         u.name as member_name,
         u.email as member_email,
         ci.catalog_id,
         ci.title,
         ci.isbn,
         b.due_date,
         CURRENT_DATE - b.due_date as days_overdue,
         COALESCE(b.fine_amount, 0) as fine_amount,
         f.fine_id,
         f.status as fine_status,
         b.borrow_status as status
       FROM borrows b
       JOIN users u ON b.user_id = u.user_id
       JOIN catalog_items ci ON b.resource_id = ci.catalog_id
       LEFT JOIN fines f ON b.id = f.borrow_id
       WHERE b.borrow_status IN ('active', 'overdue') AND b.due_date < CURRENT_DATE
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

    const result = await BorrowService.issueResource(catalog_id, member_id, req.user!.user_id, req.ip || '');

    // Map borrow to transaction for frontend compatibility
    const transaction = {
      ...result.borrow,
      transaction_id: result.borrow.id,
      member_id: result.borrow.user_id,
      catalog_id: result.borrow.resource_id,
      status: result.borrow.borrow_status
    };

    res.status(201).json({ success: true, data: transaction });
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

    const result = await BorrowService.returnResource(transaction_id);

    // Map borrow to transaction for frontend compatibility
    const updated = {
      ...result.borrow,
      transaction_id: result.borrow.id,
      member_id: result.borrow.user_id,
      catalog_id: result.borrow.resource_id,
      status: result.borrow.borrow_status
    };

    res.json({ success: true, data: { transaction: updated, fine_amount: result.fine_amount } });
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
      `SELECT b.id as transaction_id, b.user_id as member_id, b.resource_id as catalog_id, b.due_date, b.return_date, b.borrow_status as status, b.created_at, ci.title, ci.authors, ci.isbn
       FROM borrows b
       JOIN catalog_items ci ON b.resource_id = ci.catalog_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
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
    `SELECT f.*, b.due_date, ci.title as book_title
     FROM fines f
     JOIN borrows b ON f.borrow_id = b.id
     JOIN catalog_items ci ON b.resource_id = ci.catalog_id
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
