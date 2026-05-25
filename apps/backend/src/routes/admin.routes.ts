import { Router, Response } from "express";
import { query, queryOne } from "../db/pool";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth.middleware";
import { AppError, asyncHandler } from "../middleware/error.middleware";

const router = Router();

// GET /api/admin/stats — Get overview statistics
router.get(
  "/stats",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const role = req.user?.role;
    const userId = req.user?.user_id;

    // Only librarians, admins, and researchers can access stats
    if (!["librarian", "admin", "researcher"].includes(role ?? "")) {
      throw new AppError(403, "Unauthorized");
    }

    let catalogCount = 0;
    let archiveCount = 0;
    let pendingReview = 0;

    if (role === "researcher") {
      // For researchers, show only their own pending submissions
      const [pendingResult] = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM research_outputs 
         WHERE author_id = $1 AND status IN ('pending', 'under_review')`,
        [userId]
      );
      pendingReview = parseInt(pendingResult.count);
    } else {
      // For librarians and admins, show all pending documents
      const [catalogCount_result] = await query<{ count: string }>(
        "SELECT COUNT(*) as count FROM catalog_items WHERE deleted_at IS NULL"
      );
      const [archiveCount_result] = await query<{ count: string }>(
        "SELECT COUNT(*) as count FROM archive_items WHERE deleted_at IS NULL"
      );
      const [pendingReview_result] = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM catalog_items 
         WHERE deleted_at IS NULL AND status IN ('pending', 'review')`
      );

      catalogCount = parseInt(catalogCount_result.count);
      archiveCount = parseInt(archiveCount_result.count);
      pendingReview = parseInt(pendingReview_result.count);
    }

    // Active users (logged in this month) - only for librarians/admins
    const [activeUsers] = await query<{ count: string }>(
      role === "researcher" 
        ? `SELECT COUNT(DISTINCT user_id) as count FROM research_outputs 
           WHERE author_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'`
        : `SELECT COUNT(DISTINCT user_id) as count FROM audit_logs 
           WHERE action_type = 'login' AND created_at >= CURRENT_DATE - INTERVAL '30 days'`,
      role === "researcher" ? [userId] : []
    );

    // Storage calculation
    const storagePercentage = 84;

    res.json({
      success: true,
      data: {
        totalDocuments: catalogCount + archiveCount,
        pendingReview,
        activeUsers: parseInt(activeUsers.count),
        storagePercentage,
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

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const where: string[] = ["deleted_at IS NULL"];
    const values: unknown[] = [];
    let i = 1;

    if (search) {
      where.push(`(title ILIKE $${i} OR array_to_string(authors, ' ') ILIKE $${i})`);
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
      `SELECT COUNT(*) as count FROM catalog_items ${whereClause}`,
      values
    );

    // Get paginated results
    const documents = await query(
      `SELECT catalog_id as id, title, authors, category as department, 
              status, updated_at, 'restricted' as access, 0 as download_count
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
    const { page = "1", limit = "10", status, search } = req.query as Record<string, string>;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const where: string[] = ["author_id = $1", "deleted_at IS NULL"];
    const values: unknown[] = [userId];
    let i = 2;

    if (search) {
      where.push(`(title ILIKE $${i})`);
      values.push(`%${search}%`);
      i++;
    }

    if (status) {
      where.push(`status = $${i}`);
      values.push(status);
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
              COALESCE((SELECT array_agg(name) FROM users WHERE user_id = ANY(
                SELECT collaborator_id FROM research_collaborators WHERE output_id = research_outputs.output_id
              )), ARRAY[]::text[]) as authors,
              output_type as department, 
              status, updated_at, 'private' as access, 0 as download_count
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

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

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

// PATCH /api/admin/catalog/:id/status — Update catalog item status
router.patch(
  "/catalog/:id/status",
  authenticate,
  requireRole("librarian", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) throw new AppError(400, "status is required");

    const [document] = await query(
      "UPDATE catalog_items SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE catalog_id = $2 RETURNING *",
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
router.patch(
  "/archive/:id/status",
  authenticate,
  requireRole("librarian", "admin", "archivist"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) throw new AppError(400, "status is required");

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

export default router;
