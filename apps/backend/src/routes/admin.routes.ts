import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import cron from "node-cron";
import { query, queryOne, withTransaction } from "../core/db/pool";
import { config } from "../core/config";
import { authenticate, requireRole, AuthRequest } from "../core/middleware/auth.middleware";
import { AppError, asyncHandler } from "../core/middleware/error.middleware";
import { parsePagination } from "../core/utils/pagination";
import { sendEmail, accountApprovalEmail } from "../infrastructure/email.service";
import { s3Client } from "../infrastructure/s3.service";
import { esClient } from "../infrastructure/elasticsearch.service";
import {
  listBackups,
  getBackup,
  performBackup,
  getBackupDownloadUrl,
  restoreBackup,
} from "../infrastructure/backup.service";
import { applyBackupSchedule } from "../jobs/scheduler";

const router = Router();

// GET /api/admin/stats — Get overview statistics
router.get(
  "/stats",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const role = req.user?.role;

    // Only librarians, admins, researchers, and archivists can access stats
    if (!["librarian", "admin", "researcher", "archivist"].includes(role ?? "")) {
      throw new AppError(403, "Unauthorized");
    }

    let catalogCount = 0;
    let archiveCount = 0;
    let pendingReview = 0;
    let totalUsers = 0;
    let showcaseCount = 0;

    // Fetch total users count
    const [totalUsers_result] = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL AND membership_status = 'active'"
    );
    totalUsers = parseInt(totalUsers_result.count);

    // Fetch student showcase projects count
    const [showcaseCount_result] = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM student_projects"
    );
    showcaseCount = parseInt(showcaseCount_result.count);

    if (role === "researcher") {
      // Research outputs have no moderation workflow — they publish immediately
      // on upload (see POST /api/research), so there's never a pending submission.
      pendingReview = 0;
    } else {
      // For librarians and admins, show all pending documents
      const [catalogCount_result] = await query<{ count: string }>(
        "SELECT COUNT(*) as count FROM catalog_items WHERE deleted_at IS NULL"
      );
      const [archiveCount_result] = await query<{ count: string }>(
        "SELECT COUNT(*) as count FROM archive_items"
      );
      const [pendingArchive_result] = await query<{ count: string }>(
        "SELECT COUNT(*) as count FROM archive_items WHERE status = 'review'"
      );
      const [pendingProjects_result] = await query<{ count: string }>(
        "SELECT COUNT(*) as count FROM student_projects WHERE status = 'pending_review'"
      );

      catalogCount = parseInt(catalogCount_result.count);
      archiveCount = parseInt(archiveCount_result.count);
      pendingReview = parseInt(pendingArchive_result.count) + parseInt(pendingProjects_result.count);
    }

    // Active users (logged in this month) - only shown to librarians/admins in the UI
    const [activeUsers] = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT user_id) as count FROM audit_logs
       WHERE action = 'LOGIN' AND timestamp >= CURRENT_DATE - INTERVAL '30 days'`
    );

    // Storage calculation — based on actual bytes stored (archive_items.file_size is the
    // only table that tracks real upload size) against the configured bucket capacity.
    const [storageResult] = await query<{ total_bytes: string | null }>(
      "SELECT SUM(file_size) as total_bytes FROM archive_items"
    );
    const storageUsedBytes = parseInt(storageResult.total_bytes ?? "0") || 0;
    const storageCapacityBytes = config.s3.capacityGB * 1024 * 1024 * 1024;
    const storagePercentage = Math.min(100, Math.max(1, Math.round((storageUsedBytes / storageCapacityBytes) * 100)));

    const [pendingApprovalResult] = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE membership_status = 'pending_approval' AND deleted_at IS NULL"
    );

    // Monthly upload/download trends for the last 5 months (real counts, not mocked)
    const monthlyTrendsResult = await query<{ month: string; uploads: string; downloads: string }>(
      `WITH months AS (
         SELECT date_trunc('month', CURRENT_DATE) - (n || ' months')::interval AS month_start
         FROM generate_series(4, 0, -1) AS n
       ),
       uploads AS (
         SELECT date_trunc('month', created_at) AS month_start, COUNT(*) AS count
         FROM (
           SELECT created_at FROM archive_items
           UNION ALL
           SELECT created_at FROM catalog_items WHERE deleted_at IS NULL
         ) u
         GROUP BY 1
       ),
       downloads AS (
         SELECT date_trunc('month', "timestamp") AS month_start, COUNT(*) AS count
         FROM audit_logs
         WHERE action = 'DOWNLOAD'
         GROUP BY 1
       )
       SELECT to_char(m.month_start, 'Mon') AS month,
              COALESCE(u.count, 0) AS uploads,
              COALESCE(d.count, 0) AS downloads
       FROM months m
       LEFT JOIN uploads u ON u.month_start = m.month_start
       LEFT JOIN downloads d ON d.month_start = m.month_start
       ORDER BY m.month_start`
    );
    const monthlyTrends = monthlyTrendsResult.map((row) => ({
      month: row.month,
      uploads: parseInt(row.uploads),
      downloads: parseInt(row.downloads),
    }));

    res.json({
      success: true,
      data: {
        totalUsers,
        archiveCount,
        catalogCount,
        showcaseCount,
        totalDocuments: catalogCount + archiveCount,
        pendingReview,
        pendingApproval: parseInt(pendingApprovalResult.count),
        activeUsers: parseInt(activeUsers.count),
        storagePercentage,
        storageUsedBytes,
        storageCapacityBytes,
        monthlyTrends,
      },
    });
  })
);

// GET /api/admin/catalog/documents — Get catalog documents with filtering
router.get(
  "/catalog/documents",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const role = req.user?.role;
    const userId = req.user?.user_id;

    // Only librarians and admins can access full catalog
    if (!["librarian", "admin"].includes(role ?? "")) {
      throw new AppError(403, "Unauthorized");
    }

    const { page = "1", limit = "10", status, search } = req.query as Record<string, string>;
    const { page: pageNum, limit: limitNum, offset } = parsePagination(page, limit);

    const where: string[] = ["deleted_at IS NULL"];
    const values: unknown[] = [];
    let i = 1;

    if (search) {
      where.push(`(title ILIKE $${i} OR array_to_string(authors, ' ') ILIKE $${i})`);
      values.push(`%${search}%`);
      i++;
    }

    if (status) {
      where.push(`availability_status = $${i}`);
      values.push(status);
      i++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    // Get total count
    const [countResult] = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM catalog_items ${whereClause}`,
      values
    );

    // Get paginated results
    const documents = await query(
      `SELECT catalog_id as id, title, authors, category as department,
              availability_status as status, updated_at, 'restricted' as access, 0 as download_count
       FROM catalog_items
       ${whereClause}
       ORDER BY updated_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limitNum, offset]
    );

    res.json({
      success: true,
      data: {
        items: documents,
        total: parseInt(countResult.count),
        page: pageNum,
        limit: limitNum,
      },
    });
  })
);

// GET /api/admin/my-submissions — Get researcher's own submissions
router.get(
  "/my-submissions",
  authenticate,
  requireRole("researcher"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id;
    const { page = "1", limit = "10", search } = req.query as Record<string, string>;
    const { page: pageNum, limit: limitNum, offset } = parsePagination(page, limit);

    // research_outputs has no status/review workflow — every upload is uploaded_by
    // its author and visible immediately, so there's no status column to filter on.
    const where: string[] = ["uploaded_by = $1"];
    const values: unknown[] = [userId];
    let i = 2;

    if (search) {
      where.push(`(title ILIKE $${i})`);
      values.push(`%${search}%`);
      i++;
    }

    const whereClause = `WHERE ${where.join(" AND ")}`;

    // Get total count
    const [countResult] = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM research_outputs ${whereClause}`,
      values
    );

    // Get paginated results
    const documents = await query(
      `SELECT output_id as id, title,
              COALESCE((SELECT array_agg(elem->>'name') FROM jsonb_array_elements(authors) elem), ARRAY[]::text[]) as authors,
              output_type as department,
              'published' as status, updated_at, 'private' as access, 0 as download_count
       FROM research_outputs
       ${whereClause}
       ORDER BY updated_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limitNum, offset]
    );

    res.json({
      success: true,
      data: {
        items: documents,
        total: parseInt(countResult.count),
        page: pageNum,
        limit: limitNum,
      },
    });
  })
);

// GET /api/admin/archive/documents — Get archive documents with filtering
router.get(
  "/archive/documents",
  authenticate,
  requireRole("librarian", "admin", "archivist"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = "1", limit = "10", status, search } = req.query as Record<string, string>;
    const { page: pageNum, limit: limitNum, offset } = parsePagination(page, limit);

    const where: string[] = ["deleted_at IS NULL"];
    const values: unknown[] = [];
    let i = 1;

    if (search) {
      where.push(`(title_en ILIKE $${i} OR title_bn ILIKE $${i})`);
      values.push(`%${search}%`);
      i++;
    }

    if (status) {
      where.push(`status = $${i}`);
      values.push(status);
      i++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    // Get total count
    const [countResult] = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM archive_items ${whereClause}`,
      values
    );

    // Get paginated results
    const documents = await query(
      `SELECT item_id as id, title_en as title, category, 
              status, updated_at, access_tier as access, 0 as download_count
       FROM archive_items
       ${whereClause}
       ORDER BY updated_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limitNum, offset]
    );

    res.json({
      success: true,
      data: {
        items: documents,
        total: parseInt(countResult.count),
        page: pageNum,
        limit: limitNum,
      },
    });
  })
);

// PATCH /api/admin/catalog/:id/status — Update catalog item availability status
// catalog_items has no generic `status` column (only availability_status, driven
// by borrow/return elsewhere) — this previously wrote to a column that doesn't
// exist and 500'd on every call. Kept dead-code-safe since nothing in the current
// UI calls this endpoint (useUpdateDocumentStatus is unused), but fixed so it
// works correctly if it's ever wired up.
const CATALOG_AVAILABILITY_STATUSES = ["available", "on_loan"];
router.patch(
  "/catalog/:id/status",
  authenticate,
  requireRole("librarian", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) throw new AppError(400, "status is required");
    if (!CATALOG_AVAILABILITY_STATUSES.includes(status)) {
      throw new AppError(400, `Invalid status — must be one of: ${CATALOG_AVAILABILITY_STATUSES.join(", ")}`);
    }

    const [document] = await query(
      "UPDATE catalog_items SET availability_status = $1, updated_at = CURRENT_TIMESTAMP WHERE catalog_id = $2 RETURNING *",
      [status, id]
    );

    if (!document) throw new AppError(404, "Document not found");

    res.json({
      success: true,
      data: document,
    });
  })
);

// PATCH /api/admin/archive/:id/status — Update archive item status
const ARCHIVE_STATUSES = ["draft", "review", "published", "archived"];
router.patch(
  "/archive/:id/status",
  authenticate,
  requireRole("librarian", "admin", "archivist"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) throw new AppError(400, "status is required");
    if (!ARCHIVE_STATUSES.includes(status)) {
      throw new AppError(400, `Invalid status — must be one of: ${ARCHIVE_STATUSES.join(", ")}`);
    }

    const [document] = await query(
      "UPDATE archive_items SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE item_id = $2 RETURNING *",
      [status, id]
    );

    if (!document) throw new AppError(404, "Document not found");

    res.json({
      success: true,
      data: document,
    });
  })
);

// PATCH /api/admin/catalog/:id/access — Update catalog access level
router.patch(
  "/catalog/:id/access",
  authenticate,
  requireRole("librarian", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { access } = req.body;

    if (!access) throw new AppError(400, "access is required");

    // Map access levels appropriately for catalog
    const accessMap: Record<string, string> = {
      public: "public",
      restricted: "restricted",
      private: "private",
    };

    const mappedAccess = accessMap[access] || "restricted";

    const [document] = await query(
      "UPDATE catalog_items SET access_level = $1, updated_at = CURRENT_TIMESTAMP WHERE catalog_id = $2 RETURNING *",
      [mappedAccess, id]
    );

    if (!document) throw new AppError(404, "Document not found");

    res.json({
      success: true,
      data: document,
    });
  })
);

// PATCH /api/admin/archive/:id/access — Update archive access level
router.patch(
  "/archive/:id/access",
  authenticate,
  requireRole("librarian", "admin", "archivist"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { access } = req.body;

    if (!access) throw new AppError(400, "access is required");

    const [document] = await query(
      "UPDATE archive_items SET access_tier = $1, updated_at = CURRENT_TIMESTAMP WHERE item_id = $2 RETURNING *",
      [access, id]
    );

    if (!document) throw new AppError(404, "Document not found");

    res.json({
      success: true,
      data: document,
    });
  })
);

// DELETE /api/admin/catalog/:id — Delete catalog item (soft delete)
router.delete(
  "/catalog/:id",
  authenticate,
  requireRole("librarian", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const [document] = await query(
      "UPDATE catalog_items SET deleted_at = CURRENT_TIMESTAMP WHERE catalog_id = $1 RETURNING *",
      [id]
    );

    if (!document) throw new AppError(404, "Document not found");

    res.json({
      success: true,
      data: { message: "Document deleted successfully" },
    });
  })
);

// DELETE /api/admin/archive/:id — Delete archive item (soft delete)
router.delete(
  "/archive/:id",
  authenticate,
  requireRole("librarian", "admin", "archivist"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const [document] = await query(
      "UPDATE archive_items SET deleted_at = CURRENT_TIMESTAMP WHERE item_id = $1 RETURNING *",
      [id]
    );

    if (!document) throw new AppError(404, "Document not found");

    res.json({
      success: true,
      data: { message: "Document deleted successfully" },
    });
  })
);

// GET /api/admin/users — Get users with filtering
router.get(
  "/users",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { search, role, status, page = "1", limit = "10" } = req.query as Record<string, string>;
    const { page: pageNum, limit: limitNum, offset } = parsePagination(page, limit);

    const where: string[] = ["deleted_at IS NULL"];
    const values: unknown[] = [];
    let i = 1;

    if (search) {
      where.push(`(name ILIKE $${i} OR email ILIKE $${i} OR department ILIKE $${i})`);
      values.push(`%${search}%`);
      i++;
    }

    if (role && role !== "all") {
      where.push(`role = $${i}`);
      values.push(role);
      i++;
    }

    if (status && status !== "all") {
      where.push(`membership_status = $${i}`);
      values.push(status);
      i++;
    }

    const whereClause = `WHERE ${where.join(" AND ")}`;

    const [countResult] = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      values
    );

    const usersList = await query(
      `SELECT user_id, name, email, role, requested_role, department, membership_status, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limitNum, offset]
    );

    res.json({
      success: true,
      data: {
        items: usersList,
        total: parseInt(countResult.count),
        page: pageNum,
        limit: limitNum,
      },
    });
  })
);

// POST /api/admin/users — Create new user
router.post(
  "/users",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password || !role) {
      throw new AppError(400, "Name, email, password, and role are required");
    }

    const existing = await queryOne("SELECT user_id FROM users WHERE email = $1", [email]);
    if (existing) {
      throw new AppError(409, "Email already registered");
    }

    const password_hash = await bcrypt.hash(password, 12);
    const newUser = await queryOne<{ user_id: string; name: string; email: string; role: string; department: string; membership_status: string; created_at: string }>(
      `INSERT INTO users (name, email, password_hash, role, department, membership_status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING user_id, name, email, role, department, membership_status, created_at`,
      [name, email, password_hash, role, department || null]
    );

    if (!newUser) {
      throw new AppError(500, "Failed to create user account");
    }

    // Log in audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'CREATE', 'user', $2, $3)`,
      [req.user!.user_id, newUser.user_id, JSON.stringify({ email, role, name })]
    );

    res.status(201).json({
      success: true,
      data: newUser,
    });
  })
);

// PATCH /api/admin/users/:id — Update user
router.patch(
  "/users/:id",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, email, role, department, membership_status } = req.body;

    const existingUser = await queryOne<{ role: string; membership_status: string }>(
      "SELECT * FROM users WHERE user_id = $1", [id]
    );
    if (!existingUser) {
      throw new AppError(404, "User not found");
    }

    const demotingFromAdmin = role !== undefined && role !== "admin" && existingUser.role === "admin";
    const deactivatingAccount = membership_status !== undefined && membership_status !== "active" && existingUser.membership_status === "active";

    if (id === req.user!.user_id && (demotingFromAdmin || deactivatingAccount)) {
      throw new AppError(400, "You cannot change your own role or account status. Ask another admin to make this change.");
    }

    if (existingUser.role === "admin" && existingUser.membership_status === "active" && (demotingFromAdmin || deactivatingAccount)) {
      const [{ count: activeAdminCount }] = await query<{ count: string }>(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND membership_status = 'active' AND deleted_at IS NULL"
      );
      if (parseInt(activeAdminCount) <= 1) {
        throw new AppError(400, "Cannot modify the last remaining active admin account.");
      }
    }

    const updatedUser = await queryOne(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           role = COALESCE($3, role),
           department = COALESCE($4, department),
           membership_status = COALESCE($5, membership_status),
           updated_at = NOW()
       WHERE user_id = $6
       RETURNING user_id, name, email, role, department, membership_status, created_at`,
      [name, email, role, department, membership_status, id]
    );

    // Log in audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'UPDATE', 'user', $2, $3)`,
      [req.user!.user_id, id, JSON.stringify({ name, email, role, membership_status })]
    );

    res.json({
      success: true,
      data: updatedUser,
    });
  })
);

// POST /api/admin/users/:id/approve — Approve or reject a pending_approval account
// (researcher, archivist, librarian, or admin — all privileged self-registered roles land here)
router.post(
  "/users/:id/approve",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { approved, reason } = req.body as { approved: boolean; reason?: string };

    if (id === req.user!.user_id) {
      throw new AppError(400, "You cannot approve or reject your own account. Ask another admin to review it.");
    }

    // Locks the row for the duration of the transaction so two concurrent approve/reject
    // calls (double-click, two admin tabs) can't both pass the pending_approval check —
    // the second one blocks on FOR UPDATE, then re-reads the now-resolved row and 409s
    // instead of also updating the role/status and firing a duplicate audit log + email.
    const { user, finalRole, newStatus } = await withTransaction(async (client) => {
      const [lockedUser] = (
        await client.query(
          `SELECT name, email, role, membership_status, requested_role
           FROM users WHERE user_id = $1 AND deleted_at IS NULL FOR UPDATE`,
          [id]
        )
      ).rows;

      if (!lockedUser) throw new AppError(404, "User not found");
      if (lockedUser.membership_status !== "pending_approval") {
        throw new AppError(409, "This account has already been reviewed.");
      }

      let newStatus = approved ? "active" : "suspended";
      let finalRole: string = lockedUser.role;

      if (lockedUser.requested_role) {
        if (approved) {
          finalRole = lockedUser.requested_role;
          newStatus = "active";
          await client.query(
            "UPDATE users SET role = $1, requested_role = NULL, membership_status = $2, updated_at = NOW() WHERE user_id = $3",
            [finalRole, newStatus, id]
          );
        } else {
          newStatus = "active";
          await client.query(
            "UPDATE users SET requested_role = NULL, membership_status = $1, updated_at = NOW() WHERE user_id = $2",
            [newStatus, id]
          );
        }
      } else {
        await client.query(
          "UPDATE users SET membership_status = $1, updated_at = NOW() WHERE user_id = $2",
          [newStatus, id]
        );
      }

      return { user: lockedUser, finalRole, newStatus };
    });

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, 'user', $3, $4)`,
      [
        req.user!.user_id,
        approved ? "APPROVE_USER" : "REJECT_USER",
        id,
        JSON.stringify({
          reason,
          role: user.role,
          requested_role: user.requested_role,
          action: user.requested_role ? "ROLE_SWITCH" : "SIGNUP"
        })
      ]
    );

    const roleLabel = finalRole.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    await sendEmail({
      to: user.email,
      subject: approved ? `Your DKP ${roleLabel.toLowerCase()} account has been approved` : "Your DKP account request update",
      html: accountApprovalEmail(user.name, approved, reason, roleLabel),
    });

    res.json({ success: true, data: { approved, membership_status: newStatus, role: finalRole } });
  })
);

// DELETE /api/admin/users/:id — Delete user
router.delete(
  "/users/:id",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { mode } = req.query as { mode?: "hard_delete" | "anonymize" };

    if (id === req.user!.user_id) {
      throw new AppError(400, "You cannot delete your own account. Ask another admin to do this.");
    }

    const existingUser = await queryOne<{ role: string; membership_status: string }>(
      "SELECT * FROM users WHERE user_id = $1", [id]
    );
    if (!existingUser) {
      throw new AppError(404, "User not found");
    }

    if (existingUser.role === "admin" && existingUser.membership_status === "active") {
      const [{ count: activeAdminCount }] = await query<{ count: string }>(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND membership_status = 'active' AND deleted_at IS NULL"
      );
      if (parseInt(activeAdminCount) <= 1) {
        throw new AppError(400, "Cannot delete the last remaining active admin account.");
      }
    }

    if (mode === "hard_delete") {
      // Most tables that reference users(user_id) have no ON DELETE clause (default
      // RESTRICT), so a bare DELETE FROM users throws a raw FK-violation 500 for
      // anyone who's ever uploaded, reviewed, advised, submitted, borrowed, or
      // organized anything. Rather than cascading all of that content away as a
      // side effect of removing an account (a much more dangerous failure mode),
      // hard delete only proceeds for accounts with no such history — anything
      // else has to go through "Anonymize", which is built for exactly this case.
      const [{ has_refs: hasRefs }] = await query<{ has_refs: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM archive_items WHERE uploaded_by = $1
           UNION ALL SELECT 1 FROM archive_versions WHERE changed_by = $1
           UNION ALL SELECT 1 FROM access_requests WHERE user_id = $1 OR reviewed_by = $1
           UNION ALL SELECT 1 FROM labs WHERE head_researcher_id = $1
           UNION ALL SELECT 1 FROM research_outputs WHERE uploaded_by = $1
           UNION ALL SELECT 1 FROM student_projects WHERE advisor_id = $1 OR submitted_by = $1
           UNION ALL SELECT 1 FROM borrows WHERE user_id = $1
           UNION ALL SELECT 1 FROM hold_requests WHERE member_id = $1
           UNION ALL SELECT 1 FROM wishlists WHERE member_id = $1
           UNION ALL SELECT 1 FROM fines WHERE member_id = $1
           UNION ALL SELECT 1 FROM announcements WHERE created_by = $1
           UNION ALL SELECT 1 FROM events WHERE created_by = $1
         ) as has_refs`,
        [id]
      );

      if (hasRefs) {
        throw new AppError(
          409,
          "This user has associated content or activity (uploads, submissions, borrows, etc.) and can't be hard-deleted. Use \"Anonymize\" instead to remove their personal data while preserving those records."
        );
      }

      // audit_logs is an append-only log (UPDATE/DELETE are blocked by DB rule) and
      // user_id is nullable there specifically so a log entry can outlive its user —
      // sever the link instead of leaving it as the one remaining blocker.
      await withTransaction(async (client) => {
        await client.query("UPDATE audit_logs SET user_id = NULL WHERE user_id = $1", [id]);
        await client.query("DELETE FROM users WHERE user_id = $1", [id]);
      });
    } else {
      const randomHash = Math.random().toString(36).substring(2, 10);
      await query(
        `UPDATE users
         SET name = 'Deleted User',
             email = $1,
             password_hash = NULL,
             deleted_at = NOW(),
             membership_status = 'inactive'
         WHERE user_id = $2`,
        [`deleted_${randomHash}@dkp.edu`, id]
      );
    }

    // Log in audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'DELETE', 'user', $2, $3)`,
      [req.user!.user_id, id, JSON.stringify({ mode })]
    );

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  })
);

// GET /api/admin/configs — Get configurations
router.get(
  "/configs",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const configs = await query("SELECT key, value, description, category FROM system_configs ORDER BY category, key");
    res.json({
      success: true,
      data: configs,
    });
  })
);

// POST /api/admin/configs — Update configurations
router.post(
  "/configs",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { configs } = req.body as { configs: Record<string, string> };
    if (!configs) {
      throw new AppError(400, "Configs are required");
    }

    for (const [key, value] of Object.entries(configs)) {
      await query(
        `INSERT INTO system_configs (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, value]
      );
    }

    // Log in audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, details)
       VALUES ($1, 'UPDATE', 'system_config', $2)`,
      [req.user!.user_id, JSON.stringify({ updated_keys: Object.keys(configs) })]
    );

    res.json({
      success: true,
      message: "Configurations updated successfully",
    });
  })
);

// GET /api/admin/audit-logs — Get audit logs
router.get(
  "/audit-logs",
  authenticate,
  requireRole("admin", "archivist"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { search, action, entityType, entity_type, page = "1", limit = "10" } = req.query as Record<string, string>;
    const resolvedEntityType = entityType || entity_type;
    const { page: pageNum, limit: limitNum, offset } = parsePagination(page, limit);

    const where: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (search) {
      where.push(`(u.name ILIKE $${i} OR a.user_id::text ILIKE $${i})`);
      values.push(`%${search}%`);
      i++;
    }

    if (action && action !== "all") {
      where.push(`a.action = $${i}`);
      values.push(action);
      i++;
    }

    if (resolvedEntityType && resolvedEntityType !== "all") {
      where.push(`a.entity_type = $${i}`);
      values.push(resolvedEntityType);
      i++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const [countResult] = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_logs a LEFT JOIN users u ON a.user_id = u.user_id ${whereClause}`,
      values
    );

    const logs = await query(
      `SELECT a.log_id, a.user_id, u.name as user_name, a.action as action, a.entity_type, a.entity_id, a.details, a.timestamp
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.user_id
       ${whereClause}
       ORDER BY a.timestamp DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limitNum, offset]
    );

    res.json({
      success: true,
      data: {
        items: logs,
        total: parseInt(countResult.count),
        page: pageNum,
        limit: limitNum,
      },
    });
  })
);

// GET /api/admin/health - Live System Health & Infrastructure Monitoring
router.get(
  "/health",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    let databaseStatus = "healthy";
    let s3Status = "healthy";
    let esStatus = "healthy";
    const alerts: Array<{ id: string; type: string; title: string; message: string; timestamp: string; read: boolean }> = [];

    // 1. Check Database connection
    try {
      await query("SELECT 1");
    } catch (err: any) {
      databaseStatus = "unhealthy";
      alerts.push({
        id: "alert-db",
        type: "downtime",
        title: "Database Degradation Detected",
        message: `Database connection test failed. Details: ${err.message || "Unknown error"}`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }

    // 2. Check MinIO / S3 Connection
    try {
      const { ListBucketsCommand } = require("@aws-sdk/client-s3");
      await s3Client.send(new ListBucketsCommand({}));
    } catch (err: any) {
      s3Status = "unhealthy";
      alerts.push({
        id: "alert-s3",
        type: "downtime",
        title: "S3 Storage Connection Failed",
        message: `MinIO/S3 storage server is unreachable. Details: ${err.message || "Unknown error"}`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }

    // 3. Check Elasticsearch Connection
    try {
      await esClient.ping();
    } catch (err: any) {
      esStatus = "unhealthy";
      alerts.push({
        id: "alert-es",
        type: "error_spike",
        title: "Elasticsearch Node Offline",
        message: `Unable to establish connection with the search node. Details: ${err.message || "Unknown error"}`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }

    // Surface the real status of the most recent backup, if one exists
    const [latestBackup] = await listBackups(1);
    if (latestBackup) {
      if (latestBackup.status === "failed") {
        alerts.push({
          id: `alert-backup-${latestBackup.backup_id}`,
          type: "error_spike",
          title: "Backup Failed",
          message: `Backup "${latestBackup.filename}" failed: ${latestBackup.error_message || "unknown error"}`,
          timestamp: latestBackup.completed_at || latestBackup.started_at,
          read: false,
        });
      } else if (latestBackup.status === "completed") {
        alerts.push({
          id: `alert-backup-${latestBackup.backup_id}`,
          type: "info",
          title: "Backup Completed Successfully",
          message: `Backup "${latestBackup.filename}" was generated and stored in the S3 bucket.`,
          timestamp: latestBackup.completed_at || latestBackup.started_at,
          read: true,
        });
      }
    }

    res.json({
      success: true,
      data: {
        status: (databaseStatus === "healthy" && s3Status === "healthy" && esStatus === "healthy") ? "healthy" : "degraded",
        services: {
          api: "healthy",
          database: databaseStatus,
          s3: s3Status,
          elasticsearch: esStatus,
        },
        alerts,
      },
    });
  })
);

// GET /api/admin/backups — List database backups
router.get(
  "/backups",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const backups = await listBackups();
    res.json({ success: true, data: backups });
  })
);

// POST /api/admin/backups/generate — Trigger a manual backup (pg_dump -> gzip -> S3)
router.post(
  "/backups/generate",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const record = await performBackup("manual", req.user!.user_id);

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'BACKUP', 'backup', $2, $3)`,
      [req.user!.user_id, record.backup_id, JSON.stringify({ status: record.status, filename: record.filename })]
    );

    if (record.status === "failed") {
      res.status(502).json({ success: false, message: record.error_message, data: record });
      return;
    }

    res.status(201).json({ success: true, data: record });
  })
);

// GET /api/admin/backups/:id/download — Presigned S3 download URL for a completed backup
router.get(
  "/backups/:id/download",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const url = await getBackupDownloadUrl(req.params.id).catch((err: Error) => {
      throw new AppError(400, err.message);
    });
    res.json({ success: true, data: { url } });
  })
);

// POST /api/admin/backups/:id/restore — Restore a backup into the live database.
// Requires the admin to type the exact backup filename as confirmation, and
// always takes a fresh safety backup first.
router.post(
  "/backups/:id/restore",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { confirmFilename } = req.body as { confirmFilename?: string };

    const backup = await getBackup(id);
    if (!backup) throw new AppError(404, "Backup not found");
    if (!confirmFilename || confirmFilename !== backup.filename) {
      throw new AppError(400, "confirmFilename must exactly match the backup's filename to proceed");
    }

    try {
      const result = await restoreBackup(id, req.user!.user_id);

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES ($1, 'RESTORE', 'backup', $2, $3)`,
        [req.user!.user_id, id, JSON.stringify({ filename: backup.filename, preRestoreBackupId: result.preRestoreBackup.backup_id })]
      );

      res.json({ success: true, data: result });
    } catch (err) {
      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES ($1, 'RESTORE', 'backup', $2, $3)`,
        [req.user!.user_id, id, JSON.stringify({ filename: backup.filename, error: (err as Error).message })]
      );
      throw new AppError(502, (err as Error).message);
    }
  })
);

// GET /api/admin/backups/schedule — Current backup cron schedule
router.get(
  "/backups/schedule",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const rows = await query<{ key: string; value: string }>(
      "SELECT key, value FROM system_configs WHERE key IN ('backup_cron_expression', 'backup_enabled')"
    );
    const configMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    res.json({
      success: true,
      data: {
        cronExpression: configMap.backup_cron_expression || "0 9 * * *",
        enabled: configMap.backup_enabled !== "false",
      },
    });
  })
);

// PUT /api/admin/backups/schedule — Update backup cron schedule (takes effect immediately)
router.put(
  "/backups/schedule",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { cronExpression, enabled } = req.body as { cronExpression?: string; enabled?: boolean };

    if (!cronExpression || typeof enabled !== "boolean") {
      throw new AppError(400, "cronExpression (string) and enabled (boolean) are required");
    }

    if (!cron.validate(cronExpression)) {
      throw new AppError(400, "Invalid cron expression");
    }

    await query(
      `INSERT INTO system_configs (key, value) VALUES ('backup_cron_expression', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [cronExpression]
    );
    await query(
      `INSERT INTO system_configs (key, value) VALUES ('backup_enabled', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [String(enabled)]
    );

    applyBackupSchedule(cronExpression, enabled);

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, details)
       VALUES ($1, 'UPDATE', 'backup_schedule', $2)`,
      [req.user!.user_id, JSON.stringify({ cronExpression, enabled })]
    );

    res.json({ success: true, data: { cronExpression, enabled } });
  })
);

// GET /api/admin/analytics/search — Top search terms and zero-result queries
router.get(
  "/analytics/search",
  authenticate,
  requireRole("admin", "librarian", "archivist"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const topQueries = await query(
      `SELECT query_text, COUNT(*)::int as search_count
       FROM search_queries
       GROUP BY query_text
       ORDER BY search_count DESC
       LIMIT 20`
    );

    const zeroResultQueries = await query(
      `SELECT query_text, COUNT(*)::int as search_count
       FROM search_queries
       WHERE results_count = 0
       GROUP BY query_text
       ORDER BY search_count DESC
       LIMIT 20`
    );

    res.json({
      success: true,
      data: {
        top_queries: topQueries,
        zero_result_queries: zeroResultQueries,
      },
    });
  })
);

export default router;

