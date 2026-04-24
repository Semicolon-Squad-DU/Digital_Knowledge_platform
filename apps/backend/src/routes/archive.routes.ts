import { Router, Response } from "express";
import { query, queryOne, withTransaction } from "../db/pool";
import { authenticate, optionalAuth, requireRole, AuthRequest } from "../middleware/auth.middleware";
import { uploadSingle, uploadMultiple } from "../middleware/upload.middleware";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { uploadToS3, getPresignedUrl, generateS3Key } from "../services/s3.service";
import { indexArchiveItem, searchArchive } from "../services/elasticsearch.service";
import { logger } from "../config/logger";
import { AccessTier } from "@dkp/shared";

const router = Router();

const ALLOWED_TIERS_BY_ROLE: Record<string, AccessTier[]> = {
  guest: ["public"],
  member: ["public", "member"],
  student_author: ["public", "member"],
  researcher: ["public", "member", "staff"],
  archivist: ["public", "member", "staff", "restricted"],
  librarian: ["public", "member", "staff"],
  admin: ["public", "member", "staff", "restricted"],
};

// GET /api/archive/search
router.get("/search", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role ?? "guest";
  const allowedTiers = ALLOWED_TIERS_BY_ROLE[role] ?? ["public"];

  const {
    q, category, language, file_type, date_from, date_to, tags, page, limit,
  } = req.query as Record<string, string>;

  const result = await searchArchive({
    query: q,
    category,
    language,
    file_type,
    date_from,
    date_to,
    tags: tags ? tags.split(",") : undefined,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
    allowed_tiers: allowedTiers,
  });

  res.json({
    success: true,
    data: {
      items: result.hits,
      total: result.total,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      total_pages: Math.ceil(result.total / (limit ? parseInt(limit) : 20)),
    },
  });
}));

// GET /api/archive/download-url?key=... — generate presigned URL for any S3 key
router.get("/download-url", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key } = req.query as { key: string };
  if (!key) throw new AppError(400, "key is required");
  const url = await getPresignedUrl(key, 300); // 5 min expiry
  res.json({ success: true, data: { url } });
}));

// GET /api/archive/meta/tags
router.get("/meta/tags", asyncHandler(async (_req, res: Response) => {
  const tags = await query("SELECT * FROM tags ORDER BY name_en");
  res.json({ success: true, data: tags });
}));

// GET /api/archive/:id
router.get("/:id", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role ?? "guest";
  const allowedTiers = ALLOWED_TIERS_BY_ROLE[role] ?? ["public"];

  const item = await queryOne<{
    item_id: string;
    access_tier: AccessTier;
    status: string;
    file_url: string;
  }>(
    `SELECT ai.*, u.name as uploader_name,
            array_agg(DISTINCT jsonb_build_object('tag_id', t.tag_id, 'name_en', t.name_en, 'name_bn', t.name_bn)) FILTER (WHERE t.tag_id IS NOT NULL) as tags
     FROM archive_items ai
     LEFT JOIN users u ON ai.uploaded_by = u.user_id
     LEFT JOIN archive_item_tags ait ON ai.item_id = ait.item_id
     LEFT JOIN tags t ON ait.tag_id = t.tag_id
     WHERE ai.item_id = $1
     GROUP BY ai.item_id, u.name`,
    [req.params.id]
  );

  if (!item) throw new AppError(404, "Archive item not found");

  if (!allowedTiers.includes(item.access_tier)) {
    if (req.user) {
      const accessReq = await queryOne(
        `SELECT request_id FROM access_requests
         WHERE user_id = $1 AND item_id = $2 AND status = 'approved'`,
        [req.user.user_id, item.item_id]
      );
      if (!accessReq) {
        throw new AppError(403, "Access denied. You may request access to this document.");
      }
    } else {
      throw new AppError(403, "Access denied");
    }
  }

  if (item.status !== "published" && !["archivist", "librarian", "admin"].includes(role)) {
    throw new AppError(404, "Archive item not found");
  }

  res.json({ success: true, data: item });
}));

// GET /api/archive/:id/download
router.get("/:id/download", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role ?? "guest";
  const allowedTiers = ALLOWED_TIERS_BY_ROLE[role] ?? ["public"];

  const item = await queryOne<{ item_id: string; access_tier: AccessTier; file_url: string; status: string }>(
    "SELECT item_id, access_tier, file_url, status FROM archive_items WHERE item_id = $1",
    [req.params.id]
  );

  if (!item || item.status !== "published") throw new AppError(404, "Item not found");

  if (!allowedTiers.includes(item.access_tier)) {
    throw new AppError(403, "Access denied");
  }

  const url = await getPresignedUrl(item.file_url);

  if (req.user) {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'DOWNLOAD', 'archive_item', $2, '{}', $3)`,
      [req.user.user_id, item.item_id, req.ip]
    );
  }

  res.json({ success: true, data: { url } });
}));

// POST /api/archive/upload
router.post(
  "/upload",
  authenticate,
  requireRole("archivist", "librarian", "admin"),
  uploadSingle,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) throw new AppError(400, "No file provided");

    const { title_en, title_bn, description, authors, category, language, access_tier } =
      req.body as Record<string, string>;

    if (!title_en) throw new AppError(400, "English title is required");

    const key = generateS3Key("archive", req.file.originalname, req.file.mimetype);
    await uploadToS3(key, req.file.buffer, req.file.mimetype);

    const item = await withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO archive_items
           (title_en, title_bn, description, authors, category, language, access_tier, file_url, file_type, file_size, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          title_en, title_bn || null, description || null,
          authors ? JSON.parse(authors) : [],
          category || "General", language || "en", access_tier || "public",
          key, req.file!.mimetype, req.file!.size, req.user!.user_id,
        ]
      );

      await client.query(
        `INSERT INTO archive_versions (item_id, version_number, file_url, metadata_snapshot, changed_by)
         VALUES ($1, 1, $2, $3, $4)`,
        [result.rows[0].item_id, key, JSON.stringify(result.rows[0]), req.user!.user_id]
      );

      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, 'CREATE', 'archive_item', $2, $3, $4)`,
        [req.user!.user_id, result.rows[0].item_id, JSON.stringify({ title_en }), req.ip]
      );

      return result.rows[0];
    });

    indexArchiveItem({
      item_id: item.item_id, title_en: item.title_en, title_bn: item.title_bn,
      description: item.description, authors: item.authors, category: item.category,
      language: item.language, access_tier: item.access_tier, status: item.status,
      file_type: item.file_type, created_at: item.created_at,
    }).catch((err) => logger.error("ES indexing failed", { error: err.message }));

    res.status(201).json({ success: true, data: item });
  })
);

// POST /api/archive/bulk-upload
router.post(
  "/bulk-upload",
  authenticate,
  requireRole("archivist", "admin"),
  uploadMultiple,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) throw new AppError(400, "No files provided");

    const results: { filename: string; status: "success" | "error"; item_id?: string; error?: string }[] = [];

    for (const file of files) {
      try {
        const key = generateS3Key("archive", file.originalname, file.mimetype);
        await uploadToS3(key, file.buffer, file.mimetype);

        const [item] = await query<{ item_id: string }>(
          `INSERT INTO archive_items
             (title_en, category, language, access_tier, file_url, file_type, file_size, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING item_id`,
          [
            file.originalname.replace(/\.[^/.]+$/, ""),
            "General", "en", "member", key, file.mimetype, file.size, req.user!.user_id,
          ]
        );

        results.push({ filename: file.originalname, status: "success", item_id: item.item_id });
      } catch (err) {
        results.push({ filename: file.originalname, status: "error", error: (err as Error).message });
      }
    }

    const succeeded = results.filter((r) => r.status === "success").length;
    res.json({ success: true, data: { results, succeeded, failed: results.length - succeeded } });
  })
);

// PATCH /api/archive/:id/status
router.patch(
  "/:id/status",
  authenticate,
  requireRole("archivist", "librarian", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status } = req.body as { status: string };
    const validStatuses = ["draft", "review", "published", "archived"];
    if (!validStatuses.includes(status)) throw new AppError(400, "Invalid status");

    const item = await queryOne<{ item_id: string; status: string; file_url: string; version: number }>(
      "SELECT item_id, status, file_url, version FROM archive_items WHERE item_id = $1",
      [req.params.id]
    );
    if (!item) throw new AppError(404, "Item not found");

    const updated = await queryOne(
      "UPDATE archive_items SET status = $1 WHERE item_id = $2 RETURNING *",
      [status, req.params.id]
    );

    if (status === "published") {
      indexArchiveItem({ ...(updated as object), status }).catch(() => {});
    }

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'STATUS_CHANGE', 'archive_item', $2, $3, $4)`,
      [req.user!.user_id, req.params.id, JSON.stringify({ from: item.status, to: status }), req.ip]
    );

    res.json({ success: true, data: updated });
  })
);

// GET /api/archive/:id/versions
router.get(
  "/:id/versions",
  authenticate,
  requireRole("archivist", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const versions = await query(
      `SELECT av.*, u.name as changed_by_name
       FROM archive_versions av
       JOIN users u ON av.changed_by = u.user_id
       WHERE av.item_id = $1
       ORDER BY av.version_number DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: versions });
  })
);

// POST /api/archive/:id/access-request
router.post(
  "/:id/access-request",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reason } = req.body as { reason: string };
    if (!reason?.trim()) throw new AppError(400, "Reason is required");

    const item = await queryOne(
      "SELECT item_id, access_tier FROM archive_items WHERE item_id = $1 AND status = 'published'",
      [req.params.id]
    );
    if (!item) throw new AppError(404, "Item not found");

    const existing = await queryOne(
      "SELECT request_id FROM access_requests WHERE user_id = $1 AND item_id = $2 AND status = 'pending'",
      [req.user!.user_id, req.params.id]
    );
    if (existing) throw new AppError(409, "Access request already pending");

    const request = await queryOne(
      `INSERT INTO access_requests (user_id, item_id, reason) VALUES ($1, $2, $3) RETURNING *`,
      [req.user!.user_id, req.params.id, reason]
    );

    res.status(201).json({ success: true, data: request });
  })
);

export default router;
