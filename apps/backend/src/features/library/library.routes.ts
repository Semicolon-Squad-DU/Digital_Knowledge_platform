import { Router, Response } from "express";
import { query, queryOne, withTransaction } from "../../core/db/pool";
import { authenticate, requireRole, optionalAuth, AuthRequest } from "../../core/middleware/auth.middleware";
import { AppError, asyncHandler } from "../../core/middleware/error.middleware";
import { parsePagination } from "../../core/utils/pagination";
import { uploadSingle, uploadCatalogImport } from "../../core/middleware/upload.middleware";
import { parseCatalogFile, validateImportRows, CatalogImportRow, exportCatalogToCsv, exportCatalogToXlsx } from "./catalog-import.service";
import { searchCatalog, indexCatalogItem, removeCatalogItemFromIndex } from "../../infrastructure/elasticsearch.service";
import { uploadToS3, getPresignedUrl, generateS3Key } from "../../infrastructure/s3.service";
import { config } from "../../core/config";
import { BorrowService } from "./borrow.service";
import { sendEmail, dueDateReminderEmail, holdAvailableEmail, overdueFineReminderEmail } from "../../infrastructure/email.service";
import { logger } from "../../core/config/logger";
import { notifyAllUsersExcept } from "../../infrastructure/notification.service";
import { AccessTier } from "@dkp/shared";
import { ALLOWED_TIERS_BY_ROLE } from "../../core/access-control";
import { validateBody, z } from "../../core/middleware/validate.middleware";

const router = Router();

const VALID_ACCESS_TIERS: AccessTier[] = ["public", "member", "staff", "restricted"];

// ── Zod schemas ────────────────────────────────────────────────────────────────
const wishlistAddSchema = z.object({
  catalog_id: z.string().min(1, "catalog_id is required"),
});

const holdCreateSchema = z.object({
  catalog_id: z.string().min(1, "catalog_id is required"),
});

const issueSchema = z.object({
  member_id: z.string().min(1, "member_id is required"),
  catalog_id: z.string().min(1).optional(),
  barcode: z.string().min(1).optional(),
  due_date: z.string().min(1).optional(),
}).refine((data) => data.catalog_id || data.barcode, {
  message: "catalog_id or barcode required",
  path: ["catalog_id"],
});

const returnSchema = z.object({
  transaction_id: z.string().min(1).optional(),
  barcode: z.string().min(1).optional(),
  member_id: z.string().min(1).optional(),
});

const renewSchema = z.object({
  transaction_id: z.string().min(1, "transaction_id is required"),
});

const fineAdjustSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: "Amount is required" })
    .gt(0, "Amount must be greater than 0 — use Waive to clear a fine entirely"),
  reason: z.string().trim().min(1, "Reason is required"),
});

const catalogImportCommitSchema = z.object({
  rows: z.array(z.record(z.any())).min(1, "rows array is required").max(2000, "Import is limited to 2000 rows per commit"),
});

const accessRequestReviewSchema = z.object({
  status: z.enum(["approved", "denied"], { errorMap: () => ({ message: "Invalid status (must be approved or denied)" }) }),
  rejection_message: z.string().optional(),
});

const accessRequestCreateSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required"),
});

// Catalog create/update arrive as multipart form fields (via upload.middleware),
// so every field is a string; `authors` is a JSON-encoded array string rather
// than a real array. Coerce accordingly instead of assuming JSON body types.
const catalogCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  isbn: z.string().trim().optional(),
  authors: z.string().optional(),
  publisher: z.string().trim().optional(),
  edition: z.string().trim().optional(),
  year: z.string().optional(),
  category: z.string().trim().optional(),
  total_copies: z.coerce.number({ invalid_type_error: "At least 1 copy required" }).int().min(1, "At least 1 copy required"),
  shelf_location: z.string().trim().optional(),
  description: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  access_tier: z.enum(VALID_ACCESS_TIERS as [AccessTier, ...AccessTier[]]).optional(),
});

const catalogUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  isbn: z.string().trim().optional(),
  authors: z.array(z.string()).optional(),
  publisher: z.string().trim().optional(),
  edition: z.string().trim().optional(),
  year: z.coerce.number().int().optional(),
  category: z.string().trim().optional(),
  total_copies: z.coerce.number().int().min(0).optional(),
  shelf_location: z.string().trim().optional(),
  description: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  access_tier: z.enum(VALID_ACCESS_TIERS as [AccessTier, ...AccessTier[]]).optional(),
});

// GET /api/library/catalog/search
router.get("/catalog/search", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { query: q, author, isbn, category, availability, year_from, year_to, page, limit } =
    req.query as Record<string, string>;

  const { page: pageNum, limit: limitNum } = parsePagination(page ?? "1", limit ?? "20");

  const role = req.user?.role ?? "guest";
  // Only librarians manage the catalog, so only they bypass tier filtering
  // entirely — admin has its own separate oversight view (/admin/catalog/documents)
  // rather than a blanket bypass here.
  let allowedTiers = role === "librarian"
    ? VALID_ACCESS_TIERS
    : (ALLOWED_TIERS_BY_ROLE[role] ?? ["public"]);
  // Any signed-in user can *see* a restricted book in search results (so they
  // can discover it and request access) — same carve-out Archive already uses.
  // The actual gate is on GET /catalog/:id, not here.
  if (role !== "guest" && !allowedTiers.includes("restricted")) {
    allowedTiers = [...allowedTiers, "restricted"];
  }

  const result = await searchCatalog({
    query: q, author, isbn, category,
    availability: availability as "available" | "on_loan" | "all",
    year_from: year_from ? parseInt(year_from) : undefined,
    year_to: year_to ? parseInt(year_to) : undefined,
    page: pageNum,
    limit: limitNum,
    allowed_tiers: allowedTiers,
  });

  res.json({
    success: true,
    data: {
      items: result.hits, total: result.total,
      page: pageNum, limit: limitNum,
      total_pages: Math.ceil(result.total / limitNum),
    },
  });

  if (q && q.trim()) {
    query(
      `INSERT INTO search_queries (query_text, module, user_id, results_count)
       VALUES ($1, 'library', $2, $3)`,
      [q.trim(), req.user?.user_id || null, result.total]
    ).catch((err) => logger.warn("Failed to log search query", { error: err.message }));
  }
}));

// GET /api/library/dashboard
router.get(
  "/dashboard",
  authenticate,
  requireRole("librarian"),
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

// GET /api/library/reports/circulation — date-ranged transaction report for librarians.
// Returns JSON; the frontend renders CSV/PDF exports client-side from this data.
router.get(
  "/reports/circulation",
  authenticate,
  requireRole("librarian"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { from, to, status } = req.query as Record<string, string>;
    const fromDate = from || "1900-01-01";
    const toDate = to || "9999-12-31";
    const statusFilter = status && status !== "all" ? status : null;

    const transactions = await query(
      `SELECT b.id as transaction_id, ci.title, ci.isbn, u.name as member_name, u.email as member_email,
              b.issue_date, b.due_date, b.return_date, b.borrow_status as status,
              b.fine_amount, b.renewal_count
       FROM borrows b
       JOIN catalog_items ci ON b.resource_id = ci.catalog_id
       JOIN users u ON b.user_id = u.user_id
       WHERE b.issue_date BETWEEN $1 AND $2
         AND ($3::text IS NULL OR b.borrow_status::text = $3)
       ORDER BY b.issue_date DESC
       LIMIT 5000`,
      [fromDate, toDate, statusFilter]
    );

    const [summary] = await query<{
      total_issued: string; total_returned: string; total_overdue: string;
      total_fines: string; fines_collected: string; fines_pending: string;
    }>(
      `SELECT
         COUNT(*) as total_issued,
         COUNT(*) FILTER (WHERE borrow_status = 'returned') as total_returned,
         COUNT(*) FILTER (WHERE borrow_status = 'overdue') as total_overdue,
         COALESCE(SUM(fine_amount), 0) as total_fines,
         COALESCE(SUM(fine_amount) FILTER (WHERE borrow_status = 'returned'), 0) as fines_collected,
         COALESCE((SELECT SUM(amount) FROM fines WHERE status = 'pending'), 0) as fines_pending
       FROM borrows
       WHERE issue_date BETWEEN $1 AND $2
         AND ($3::text IS NULL OR borrow_status::text = $3)`,
      [fromDate, toDate, statusFilter]
    );

    res.json({
      success: true,
      data: {
        summary: {
          total_issued: parseInt(summary.total_issued),
          total_returned: parseInt(summary.total_returned),
          total_overdue: parseInt(summary.total_overdue),
          total_fines: parseFloat(summary.total_fines),
          fines_collected: parseFloat(summary.fines_collected),
          fines_pending: parseFloat(summary.fines_pending),
        },
        transactions,
      },
    });
  })
);

// GET /api/library/overdue
router.get(
  "/overdue",
  authenticate,
  requireRole("librarian"),
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    try {
      const overdueTransactions = await query<{
        transaction_id: string;
        member_id: string;
        member_name: string;
        member_email: string;
        catalog_id: string;
        title: string;
        isbn: string;
        due_date: string;
        days_overdue: number;
        fine_amount: string;
        fine_id: string | null;
        fine_status: string | null;
        status: string;
      }>(
        `SELECT 
           b.id as transaction_id,
           b.user_id as member_id,
           u.name as member_name,
           u.email as member_email,
           ci.catalog_id,
           ci.title,
           ci.isbn,
           b.due_date,
           CAST(CURRENT_DATE - b.due_date AS INTEGER) as days_overdue,
           COALESCE(b.fine_amount, 0) as fine_amount,
           f.fine_id,
           f.status as fine_status,
           b.borrow_status as status
         FROM borrows b
         JOIN users u ON b.user_id = u.user_id
         JOIN catalog_items ci ON b.resource_id = ci.catalog_id
         LEFT JOIN fines f ON b.id = f.borrow_id
         WHERE (b.borrow_status = 'overdue' OR (b.borrow_status = 'active' AND b.due_date < CURRENT_DATE))
         ORDER BY days_overdue DESC NULLS LAST`
      );

      res.json({
        success: true,
        data: overdueTransactions,
      });
    } catch (err) {
      logger.error("Error fetching overdue transactions", { error: err });
      throw err;
    }
  })
);

// GET /api/library/holds/pending — all pending holds, for librarian fulfillment
router.get(
  "/holds/pending",
  authenticate,
  requireRole("librarian"),
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const holds = await query(
      `SELECT h.hold_id, h.catalog_id, h.member_id, h.request_date, h.status,
              ci.title, ci.authors, ci.available_copies,
              u.name as member_name, u.email as member_email
       FROM hold_requests h
       JOIN catalog_items ci ON h.catalog_id = ci.catalog_id
       JOIN users u ON h.member_id = u.user_id
       WHERE h.status IN ('pending', 'available')
       ORDER BY h.request_date ASC`
    );
    res.json({ success: true, data: holds });
  })
);

// GET /api/library/wishlist
router.get("/wishlist", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const items = await query(
    `SELECT w.*, ci.title, ci.authors, ci.available_copies, ci.cover_url, ci.category, ci.year, ci.publisher
     FROM wishlists w
     JOIN catalog_items ci ON w.catalog_id = ci.catalog_id
     WHERE w.member_id = $1
     ORDER BY w.added_at DESC`,
    [req.user!.user_id]
  );
  res.json({ success: true, data: items });
}));

// POST /api/library/wishlist
router.post("/wishlist", authenticate, validateBody(wishlistAddSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { catalog_id } = req.body as z.infer<typeof wishlistAddSchema>;
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
router.post("/holds", authenticate, validateBody(holdCreateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { catalog_id } = req.body as z.infer<typeof holdCreateSchema>;

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

// DELETE /api/library/holds/:id — cancel a hold (owner or librarian)
router.delete("/holds/:id", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const hold = await queryOne<{ hold_id: string; member_id: string; status: string }>(
    "SELECT hold_id, member_id, status FROM hold_requests WHERE hold_id = $1",
    [req.params.id]
  );
  if (!hold) throw new AppError(404, "Hold not found");

  if (req.user!.role !== "librarian" && req.user!.user_id !== hold.member_id) {
    throw new AppError(403, "Access denied");
  }
  if (!["pending", "available"].includes(hold.status)) {
    throw new AppError(409, `Hold is already ${hold.status} and cannot be cancelled`);
  }

  await query("UPDATE hold_requests SET status = 'cancelled' WHERE hold_id = $1", [req.params.id]);
  res.json({ success: true, message: "Hold cancelled" });
}));

// POST /api/library/holds/:id/fulfill — issue the held book to the requester and mark
// the hold fulfilled (instead of the caller doing issue + cancel as two separate calls,
// which could leave a checked-out book against a hold still showing "pending").
router.post(
  "/holds/:id/fulfill",
  authenticate,
  requireRole("librarian"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const hold = await queryOne<{ hold_id: string; catalog_id: string; member_id: string; status: string; request_date: string }>(
      "SELECT hold_id, catalog_id, member_id, status, request_date FROM hold_requests WHERE hold_id = $1",
      [req.params.id]
    );
    if (!hold) throw new AppError(404, "Hold not found");
    if (!["pending", "available"].includes(hold.status)) {
      throw new AppError(409, `Hold is already ${hold.status} and cannot be fulfilled`);
    }

    // Enforce first-come-first-served: block fulfilling this hold while an earlier
    // pending/available hold for the same title is still waiting.
    const earlierHold = await queryOne(
      `SELECT hold_id FROM hold_requests
       WHERE catalog_id = $1 AND status IN ('pending','available') AND request_date < $2
       ORDER BY request_date ASC LIMIT 1`,
      [hold.catalog_id, hold.request_date]
    );
    if (earlierHold) {
      throw new AppError(409, "An earlier hold for this title is still waiting and must be fulfilled first");
    }

    const result = await BorrowService.issueResource(hold.catalog_id, hold.member_id, req.user!.user_id, req.ip || "");

    const updatedHold = await queryOne(
      "UPDATE hold_requests SET status = 'fulfilled' WHERE hold_id = $1 RETURNING *",
      [hold.hold_id]
    );

    const transaction = {
      ...result.borrow,
      transaction_id: result.borrow.id,
      member_id: result.borrow.user_id,
      catalog_id: result.borrow.resource_id,
      status: result.borrow.borrow_status,
    };

    res.json({ success: true, data: { transaction, hold: updatedHold } });
  })
);

// GET /api/library/catalog/lookup/:barcode — resolve a scanned/typed barcode to a catalog item
router.get(
  "/catalog/lookup/:barcode",
  authenticate,
  requireRole("librarian"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const item = await queryOne(
      "SELECT catalog_id, title, authors, isbn, barcode, available_copies, total_copies, cover_url FROM catalog_items WHERE barcode = $1 AND deleted_at IS NULL",
      [req.params.barcode]
    );
    if (!item) throw new AppError(404, "No catalog item found for that barcode");
    res.json({ success: true, data: item });
  })
);

// POST /api/library/issue
router.post(
  "/issue",
  authenticate,
  requireRole("librarian"),
  validateBody(issueSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { member_id } = req.body as z.infer<typeof issueSchema>;
    let { catalog_id } = req.body as z.infer<typeof issueSchema>;
    const { barcode, due_date } = req.body as z.infer<typeof issueSchema>;

    if (!catalog_id && barcode) {
      const catalogItem = await queryOne<{ catalog_id: string }>(
        "SELECT catalog_id FROM catalog_items WHERE barcode = $1 AND deleted_at IS NULL",
        [barcode]
      );
      if (!catalogItem) throw new AppError(404, "No catalog item found for that barcode");
      catalog_id = catalogItem.catalog_id;
    }

    // member_id may be a UUID or an email — BorrowService.issueResource expects the UUID.
    let resolvedMemberId = member_id;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(member_id)) {
      const member = await queryOne<{ user_id: string }>(
        "SELECT user_id FROM users WHERE email = $1",
        [member_id]
      );
      if (!member) throw new AppError(404, "No member found for that ID or email");
      resolvedMemberId = member.user_id;
    }

    const result = await BorrowService.issueResource(catalog_id!, resolvedMemberId, req.user!.user_id, req.ip || '', due_date);

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
  requireRole("librarian"),
  validateBody(returnSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { transaction_id, barcode, member_id } = req.body as z.infer<typeof returnSchema>;

    let resolvedTransactionId = transaction_id;

    if (!resolvedTransactionId && barcode) {
      const catalogItem = await queryOne<{ catalog_id: string }>(
        "SELECT catalog_id FROM catalog_items WHERE barcode = $1 AND deleted_at IS NULL",
        [barcode]
      );
      if (!catalogItem) throw new AppError(404, "No catalog item found for that barcode");

      const conditions = ["resource_id = $1", "borrow_status IN ('active', 'overdue')"];
      const params: unknown[] = [catalogItem.catalog_id];
      if (member_id) {
        params.push(member_id);
        conditions.push(`user_id IN (SELECT user_id FROM users WHERE user_id::text = $${params.length} OR email = $${params.length})`);
      }

      const matches = await query<{ id: string }>(
        `SELECT id FROM borrows WHERE ${conditions.join(" AND ")} ORDER BY created_at ASC`,
        params
      );

      if (matches.length === 0) throw new AppError(404, "No active borrow found for that barcode");
      if (matches.length > 1) {
        throw new AppError(409, "Multiple active borrows match this barcode — provide the member's ID or email to disambiguate");
      }

      resolvedTransactionId = matches[0].id;
    }

    if (!resolvedTransactionId) throw new AppError(400, "transaction_id or barcode is required");

    const result = await BorrowService.returnResource(resolvedTransactionId);

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

// POST /api/library/renew — member self-service or librarian on a member's behalf
router.post(
  "/renew",
  authenticate,
  validateBody(renewSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { transaction_id } = req.body as z.infer<typeof renewSchema>;

    const isStaff = req.user!.role === "librarian";
    const result = await BorrowService.renewResource(transaction_id, req.user!.user_id, isStaff, req.user!.user_id, req.ip || "");

    const updated = {
      ...result.borrow,
      transaction_id: result.borrow.id,
      member_id: result.borrow.user_id,
      catalog_id: result.borrow.resource_id,
      status: result.borrow.borrow_status,
    };

    res.json({ success: true, data: { transaction: updated, renewals_left: result.renewals_left } });
  })
);

// GET /api/library/member/:id/history
router.get(
  "/member/:id/history",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user!.role !== "librarian" && req.user!.user_id !== req.params.id) {
      throw new AppError(403, "Access denied");
    }

    const transactions = await query(
      `SELECT b.id as transaction_id, b.user_id as member_id, b.resource_id as catalog_id, b.issue_date, b.due_date, b.return_date, b.borrow_status as status, b.renewal_count, b.created_at, ci.title, ci.authors, ci.isbn
       FROM borrows b
       JOIN catalog_items ci ON b.resource_id = ci.catalog_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: transactions });
  })
);

// GET /api/library/member/:id/holds
router.get(
  "/member/:id/holds",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user!.role !== "librarian" && req.user!.user_id !== req.params.id) {
      throw new AppError(403, "Access denied");
    }

    const holds = await query(
      `SELECT h.hold_id, h.catalog_id, h.member_id, h.request_date, h.status, ci.title, ci.authors, ci.isbn
       FROM hold_requests h
       JOIN catalog_items ci ON h.catalog_id = ci.catalog_id
       WHERE h.member_id = $1
       ORDER BY h.request_date DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: holds });
  })
);

// GET /api/library/fines/:member_id
router.get("/fines/:member_id", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  // Only the librarian may view other members' fines
  const isStaff = req.user!.role === "librarian";
  if (!isStaff && req.user!.user_id !== req.params.member_id) {
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
  requireRole("librarian"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const fine = await queryOne(
      "UPDATE fines SET status = 'waived' WHERE fine_id = $1 RETURNING *",
      [req.params.fine_id]
    );
    if (!fine) throw new AppError(404, "Fine not found");
    res.json({ success: true, data: fine });
  })
);

// PATCH /api/library/fines/:fine_id/pay — record that the member has paid the fine
router.patch(
  "/fines/:fine_id/pay",
  authenticate,
  requireRole("librarian"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const fine = await queryOne(
      "UPDATE fines SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE fine_id = $1 RETURNING *",
      [req.params.fine_id]
    );
    if (!fine) throw new AppError(404, "Fine not found");

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'UPDATE', 'fine', $2, $3, $4)`,
      [req.user!.user_id, req.params.fine_id, JSON.stringify({ status: "paid" }), req.ip]
    );

    res.json({ success: true, data: fine });
  })
);

// POST /api/library/overdue/:transaction_id/notify — send an overdue reminder email to the member
router.post(
  "/overdue/:transaction_id/notify",
  authenticate,
  requireRole("librarian"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const row = await queryOne<{
      member_name: string; member_email: string; title: string;
      days_overdue: number; fine_amount: string;
    }>(
      `SELECT u.name as member_name, u.email as member_email, ci.title,
              CAST(CURRENT_DATE - b.due_date AS INTEGER) as days_overdue,
              COALESCE(b.fine_amount, 0) as fine_amount
       FROM borrows b
       JOIN users u ON b.user_id = u.user_id
       JOIN catalog_items ci ON b.resource_id = ci.catalog_id
       WHERE b.id = $1`,
      [req.params.transaction_id]
    );
    if (!row) throw new AppError(404, "Transaction not found");
    if (!row.member_email) throw new AppError(400, "Member has no email on file");

    await sendEmail({
      to: row.member_email,
      subject: `[DKP] Overdue Reminder — ${row.title}`,
      html: overdueFineReminderEmail(row.member_name, row.title, row.days_overdue, parseFloat(row.fine_amount)),
    });

    res.json({ success: true, message: "Reminder sent" });
  })
);

// PATCH /api/library/fines/:fine_id/adjust
router.patch(
  "/fines/:fine_id/adjust",
  authenticate,
  requireRole("librarian"),
  validateBody(fineAdjustSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { amount, reason } = req.body as z.infer<typeof fineAdjustSchema>;

    const fine = await queryOne(
      `UPDATE fines
       SET amount = $1, reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE fine_id = $3
       RETURNING *`,
      [amount, reason, req.params.fine_id]
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

// GET /api/library/catalog/export — download the full active catalog as CSV or XLSX,
// using the same column layout the importer accepts (round-trippable).
router.get(
  "/catalog/export",
  authenticate,
  requireRole("librarian"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const format = (req.query.format as string) === "xlsx" ? "xlsx" : "csv";
    const filename = `dkp-catalog-${new Date().toISOString().slice(0, 10)}.${format}`;

    if (format === "xlsx") {
      const buffer = await exportCatalogToXlsx();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } else {
      const csv = await exportCatalogToCsv();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csv);
    }
  })
);

// POST /api/library/catalog/import/preview — parse a CSV/Excel file, validate every
// row, and flag duplicates, without writing anything to the database.
router.post(
  "/catalog/import/preview",
  authenticate,
  requireRole("librarian"),
  uploadCatalogImport,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) throw new AppError(400, "A CSV or Excel file is required");

    let rawRows: Record<string, string>[];
    try {
      rawRows = await parseCatalogFile(req.file.buffer);
    } catch {
      throw new AppError(400, "Could not parse file — ensure it is a valid CSV or Excel spreadsheet");
    }
    if (rawRows.length === 0) throw new AppError(400, "File has no data rows");
    if (rawRows.length > 2000) throw new AppError(400, "Import is limited to 2000 rows per file");

    const results = await validateImportRows(rawRows);
    const summary = {
      total: results.length,
      valid: results.filter((r) => r.status === "valid").length,
      duplicate: results.filter((r) => r.status === "duplicate").length,
      invalid: results.filter((r) => r.status === "invalid").length,
    };

    res.json({ success: true, data: { summary, rows: results } });
  })
);

// POST /api/library/catalog/import/commit — bulk-insert previously previewed rows.
// Each row is inserted independently so one bad row doesn't roll back the batch;
// per-row failures (e.g. a DB-level unique violation) are reported, not thrown.
router.post(
  "/catalog/import/commit",
  authenticate,
  requireRole("librarian"),
  validateBody(catalogImportCommitSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { rows } = req.body as { rows: CatalogImportRow[] };

    let imported = 0;
    const failures: { title: string; error: string }[] = [];

    for (const row of rows) {
      if (!row.title || !row.total_copies || row.total_copies < 1) {
        failures.push({ title: row.title || "(untitled)", error: "Missing required fields" });
        continue;
      }
      try {
        const item = await queryOne<{ catalog_id: string }>(
          `INSERT INTO catalog_items
             (title, isbn, authors, publisher, edition, year, category, total_copies, available_copies, shelf_location, description, barcode)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11)
           RETURNING catalog_id`,
          [
            row.title.trim(), row.isbn || null, row.authors || [], row.publisher || null,
            row.edition || null, row.year || null, row.category || "General", row.total_copies,
            row.shelf_location || null, row.description || null, row.barcode?.trim() || null,
          ]
        );
        if (!row.barcode?.trim()) {
          await query("UPDATE catalog_items SET barcode = catalog_id::text WHERE catalog_id = $1", [item!.catalog_id]);
        }
        imported++;
      } catch (err) {
        failures.push({ title: row.title, error: (err as Error).message });
      }
    }

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'CREATE', 'catalog_import', NULL, $2, $3)`,
      [req.user!.user_id, JSON.stringify({ imported, failed: failures.length }), req.ip]
    );

    res.status(201).json({ success: true, data: { imported, failed: failures.length, failures } });
  })
);

// GET /api/library/catalog/access-requests/pending
// Must be registered before "/catalog/:id" — otherwise Express matches "access-requests" as an :id param.
router.get(
  "/catalog/access-requests/pending",
  authenticate,
  requireRole("librarian"),
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const requests = await query(
      `SELECT car.*, u.name as user_name, u.email as user_email, ci.title as book_title
       FROM catalog_access_requests car
       JOIN users u ON car.user_id = u.user_id
       JOIN catalog_items ci ON car.catalog_id = ci.catalog_id
       WHERE car.status = 'pending'
       ORDER BY car.created_at ASC`
    );
    res.json({ success: true, data: requests });
  })
);

// PATCH /api/library/catalog/access-requests/:id/review
router.patch(
  "/catalog/access-requests/:id/review",
  authenticate,
  requireRole("librarian"),
  validateBody(accessRequestReviewSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, rejection_message } = req.body as z.infer<typeof accessRequestReviewSchema>;

    const request = await queryOne<{ user_id: string; catalog_id: string; status: string }>(
      "SELECT * FROM catalog_access_requests WHERE request_id = $1",
      [req.params.id]
    );
    if (!request) throw new AppError(404, "Access request not found");

    const updated = await queryOne(
      `UPDATE catalog_access_requests
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), rejection_message = $3
       WHERE request_id = $4
       RETURNING *`,
      [status, req.user!.user_id, rejection_message || null, req.params.id]
    );

    const book = await queryOne<{ title: string }>(
      "SELECT title FROM catalog_items WHERE catalog_id = $1",
      [request.catalog_id]
    );

    if (book) {
      const type = status === "approved" ? "access_request_approved" : "access_request_denied";
      const title = status === "approved" ? "Access Request Approved" : "Access Request Denied";
      const message = status === "approved"
        ? `Your request to access "${book.title}" has been approved.`
        : `Your request to access "${book.title}" was denied.${rejection_message ? ` Reason: ${rejection_message}` : ""}`;

      await query(
        `INSERT INTO notifications (user_id, type, title, message, action_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [request.user_id, type, title, message, `/library/${request.catalog_id}`]
      );
    }

    res.json({ success: true, data: updated });
  })
);

// GET /api/library/catalog/:id
router.get("/catalog/:id", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const existing = await queryOne<{ catalog_id: string; title: string; category: string; access_tier: AccessTier }>(
    "SELECT catalog_id, title, category, access_tier FROM catalog_items WHERE catalog_id = $1 AND deleted_at IS NULL",
    [req.params.id]
  );
  if (!existing) throw new AppError(404, "Catalog item not found");

  const role = req.user?.role ?? "guest";
  const allowedTiers = ALLOWED_TIERS_BY_ROLE[role] ?? ["public"];
  // Librarians manage the catalog directly (including setting a book to
  // "restricted" — see POST/PUT /catalog above), so they must always be able to
  // view what they manage, the same way archivists always see restricted archive
  // items. Admin is deliberately excluded — same reasoning as the access-request
  // routes above, admin has its own oversight view rather than a blanket bypass.
  // ALLOWED_TIERS_BY_ROLE is shared with Archive/Research and deliberately left
  // untouched here rather than widening it platform-wide.
  const isCatalogStaff = role === "librarian";
  if (!isCatalogStaff && !allowedTiers.includes(existing.access_tier)) {
    if (req.user) {
      const accessReq = await queryOne<{ request_id: string; status: string; rejection_message: string | null }>(
        `SELECT request_id, status, rejection_message FROM catalog_access_requests
         WHERE user_id = $1 AND catalog_id = $2
         ORDER BY created_at DESC LIMIT 1`,
        [req.user.user_id, existing.catalog_id]
      );
      if (!accessReq || accessReq.status !== "approved") {
        res.status(403).json({
          success: false,
          message: "Access denied. You may request access to this book.",
          data: {
            catalog_id: existing.catalog_id,
            title: existing.title,
            category: existing.category,
            access_tier: existing.access_tier,
            request_status: accessReq ? accessReq.status : null,
            rejection_message: accessReq?.rejection_message ?? null,
          },
        });
        return;
      }
    } else {
      res.status(403).json({
        success: false,
        message: "Sign in to request access to this book.",
        data: {
          catalog_id: existing.catalog_id,
          title: existing.title,
          category: existing.category,
          access_tier: existing.access_tier,
          request_status: null,
        },
      });
      return;
    }
  }

  const item = await queryOne<{ view_count: number }>(
    "UPDATE catalog_items SET view_count = view_count + 1 WHERE catalog_id = $1 AND deleted_at IS NULL RETURNING *",
    [req.params.id]
  );
  res.json({ success: true, data: item });
}));

// POST /api/library/catalog/:id/access-request
router.post(
  "/catalog/:id/access-request",
  authenticate,
  validateBody(accessRequestCreateSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reason } = req.body as z.infer<typeof accessRequestCreateSchema>;

    const book = await queryOne<{ catalog_id: string; access_tier: AccessTier; title: string }>(
      "SELECT catalog_id, access_tier, title FROM catalog_items WHERE catalog_id = $1 AND deleted_at IS NULL",
      [req.params.id]
    );
    if (!book) throw new AppError(404, "Catalog item not found");

    const existing = await queryOne(
      "SELECT request_id FROM catalog_access_requests WHERE user_id = $1 AND catalog_id = $2 AND status = 'pending'",
      [req.user!.user_id, req.params.id]
    );
    if (existing) throw new AppError(409, "Access request already pending");

    const request = await queryOne(
      `INSERT INTO catalog_access_requests (user_id, catalog_id, reason) VALUES ($1, $2, $3) RETURNING *`,
      [req.user!.user_id, req.params.id, reason]
    );

    // Notify librarians only — access-request review is a librarian-desk
    // operation, not something admin manages (see the /librarian route guard).
    const requester = await queryOne<{ name: string }>(
      "SELECT name FROM users WHERE user_id = $1",
      [req.user!.user_id]
    );
    const staff = await query<{ user_id: string }>(
      "SELECT user_id FROM users WHERE role = 'librarian'"
    );
    for (const person of staff) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, action_url)
         VALUES ($1, 'pending_approval', 'New Book Access Request', $2, '/librarian')`,
        [person.user_id, `${requester?.name ?? "A user"} has requested access to "${book.title}".`]
      );
    }

    res.status(201).json({ success: true, data: request });
  })
);

// POST /api/library/catalog
router.post(
  "/catalog",
  authenticate,
  requireRole("librarian"),
  uploadSingle,
  validateBody(catalogCreateSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, isbn, publisher, edition, year, category, total_copies, shelf_location, description, barcode } =
      req.body as z.infer<typeof catalogCreateSchema>;
    const rawAuthors = req.body.authors as string | undefined;
    const authors = rawAuthors ? JSON.parse(rawAuthors) : [];
    const totalCopies = total_copies;

    // Librarians and admins (the only roles that can reach this route) may set any
    // tier including "restricted" — same authority archivists have over archive
    // items. This is a creator privilege, distinct from ALLOWED_TIERS_BY_ROLE
    // below, which governs what a *viewer* can see without an approved request.
    const requestedTier: AccessTier = req.body.access_tier ?? "public";

    if (isbn) {
      const duplicate = await queryOne("SELECT catalog_id FROM catalog_items WHERE isbn = $1", [isbn]);
      if (duplicate) throw new AppError(409, "A catalog item with this ISBN already exists");
    }

    let documentUrl: string | null = null;
    if (req.file) {
      const key = generateS3Key("catalog", req.file.originalname, req.file.mimetype);
      await uploadToS3(key, req.file.buffer, req.file.mimetype);
      documentUrl = key;
    }

    const item = await queryOne<{ catalog_id: string }>(
      `INSERT INTO catalog_items
         (title, isbn, authors, publisher, edition, year, category, total_copies, available_copies, shelf_location, description, document_url, barcode, access_tier)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [title, isbn || null, authors, publisher || null, edition || null, year ? parseInt(year, 10) : null,
       category || "General", totalCopies, shelf_location || null, description || null, documentUrl, barcode?.trim() || null,
       requestedTier]
    );

    // No barcode supplied — a DB trigger (see migration 018) auto-assigns a
    // unique DKP-XXXXXX code on insert, so `item` already has one here.
    indexCatalogItem(item as Record<string, unknown>).catch((err) =>
      logger.error("ES indexing failed for new catalog item", { error: err.message })
    );

    // Fire-and-forget — notifyAllUsersExcept never rejects, it logs internally.
    void notifyAllUsersExcept(req.user!.user_id, {
      type: "new_upload",
      title: "New Book Added",
      message: `"${title}" has been added to the library catalog.`,
      action_url: `/library/${item!.catalog_id}`,
    });

    res.status(201).json({ success: true, data: item });
  })
);

// GET /api/library/catalog/:id/download-url
router.get("/catalog/:id/download-url", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await queryOne<{ document_url: string | null; access_tier: AccessTier }>(
    "SELECT document_url, access_tier FROM catalog_items WHERE catalog_id = $1 AND deleted_at IS NULL",
    [req.params.id]
  );
  if (!item || !item.document_url) throw new AppError(404, "No document attached to this catalog item");

  const role = req.user?.role ?? "guest";
  const allowedTiers = ALLOWED_TIERS_BY_ROLE[role] ?? ["public"];
  const isCatalogStaff = role === "librarian";
  if (!isCatalogStaff && !allowedTiers.includes(item.access_tier)) {
    const approved = req.user && await queryOne(
      `SELECT request_id FROM catalog_access_requests WHERE user_id = $1 AND catalog_id = $2 AND status = 'approved'`,
      [req.user.user_id, req.params.id]
    );
    if (!approved) {
      throw new AppError(403, "Sign in to access this resource, or it may require a higher access tier.");
    }
  }

  const url = await getPresignedUrl(item.document_url);
  res.json({ success: true, data: { url } });
}));

// PUT /api/library/catalog/:id
router.put(
  "/catalog/:id",
  authenticate,
  requireRole("librarian"),
  validateBody(catalogUpdateSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const existing = await queryOne(
      "SELECT * FROM catalog_items WHERE catalog_id = $1 AND deleted_at IS NULL",
      [req.params.id]
    );
    if (!existing) throw new AppError(404, "Catalog item not found");

    const { title, isbn, authors, publisher, edition, year, category, total_copies, shelf_location, description, barcode, access_tier } =
      req.body as z.infer<typeof catalogUpdateSchema>;

    // Changing total_copies must keep available_copies in lockstep (copies_check
    // constraint requires available_copies <= total_copies) — the number of
    // copies currently on loan doesn't change just because the total did.
    let newAvailableCopies: number | undefined;
    if (total_copies !== undefined && total_copies !== null) {
      const onLoan = (existing as { total_copies: number; available_copies: number }).total_copies -
        (existing as { total_copies: number; available_copies: number }).available_copies;
      if (total_copies < onLoan) {
        throw new AppError(400, `Cannot set total copies below ${onLoan} — that many are currently on loan`);
      }
      newAvailableCopies = total_copies - onLoan;
    }
    const newAvailabilityStatus = newAvailableCopies !== undefined
      ? (newAvailableCopies === 0 ? "on_loan" : "available")
      : undefined;

    const item = await queryOne(
      `UPDATE catalog_items SET
         title = COALESCE($1, title), isbn = COALESCE($2, isbn), authors = COALESCE($3, authors),
         publisher = COALESCE($4, publisher), edition = COALESCE($5, edition), year = COALESCE($6, year),
         category = COALESCE($7, category), total_copies = COALESCE($8, total_copies),
         shelf_location = COALESCE($9, shelf_location), description = COALESCE($10, description),
         barcode = COALESCE($11, barcode), access_tier = COALESCE($12, access_tier),
         available_copies = COALESCE($13, available_copies),
         availability_status = COALESCE($14, availability_status)
       WHERE catalog_id = $15 RETURNING *`,
      [title, isbn, authors, publisher, edition, year, category, total_copies, shelf_location, description, barcode, access_tier, newAvailableCopies, newAvailabilityStatus, req.params.id]
    );

    indexCatalogItem(item as Record<string, unknown>).catch((err) =>
      logger.error("ES indexing failed for updated catalog item", { error: err.message })
    );

    res.json({ success: true, data: item });
  })
);

// DELETE /api/library/catalog/:id
router.delete(
  "/catalog/:id",
  authenticate,
  requireRole("librarian"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await query("UPDATE catalog_items SET deleted_at = NOW() WHERE catalog_id = $1", [req.params.id]);
    void removeCatalogItemFromIndex(req.params.id);
    res.json({ success: true, message: "Catalog item deleted" });
  })
);

export default router;
