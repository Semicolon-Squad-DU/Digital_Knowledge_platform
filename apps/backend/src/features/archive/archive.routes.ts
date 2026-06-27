import { Router, Response } from "express";
import { query, queryOne, withTransaction } from "../../core/db/pool";
import { authenticate, optionalAuth, requireRole, AuthRequest } from "../../core/middleware/auth.middleware";
import { uploadSingle, uploadMultiple, checkUploadQuota } from "../../core/middleware/upload.middleware";
import { AppError, asyncHandler } from "../../core/middleware/error.middleware";
import { uploadToS3, getPresignedUrl, generateS3Key, deleteFromS3 } from "../../infrastructure/s3.service";
import { indexArchiveItem, searchArchive } from "../../infrastructure/elasticsearch.service";
import { logger } from "../../core/config/logger";
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

// GET /api/archive/download-url?key=... — generate presigned URL, scoped to the caller's access tier
router.get("/download-url", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key } = req.query as { key: string };
  if (!key) throw new AppError(400, "key is required");

  const role = req.user?.role ?? "guest";
  const allowedTiers = ALLOWED_TIERS_BY_ROLE[role] ?? ["public"];

  const item = await queryOne<{ item_id: string; access_tier: AccessTier }>(
    `SELECT item_id, access_tier FROM archive_items WHERE file_url = $1`,
    [key]
  );
  if (!item) throw new AppError(404, "File not found");

  if (!allowedTiers.includes(item.access_tier)) {
    const accessReq = await queryOne<{ status: string }>(
      `SELECT status FROM access_requests WHERE user_id = $1 AND item_id = $2`,
      [req.user!.user_id, item.item_id]
    );
    if (!accessReq || accessReq.status !== "approved") {
      throw new AppError(403, "Access denied. You may request access to this document.");
    }
  }

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
      const accessReq = await queryOne<{ request_id: string; status: string }>(
        `SELECT request_id, status FROM access_requests
         WHERE user_id = $1 AND item_id = $2`,
        [req.user.user_id, item.item_id]
      );
      if (!accessReq || accessReq.status !== "approved") {
        res.status(403).json({
          success: false,
          message: "Access denied. You may request access to this document.",
          data: {
            item_id: item.item_id,
            title_en: (item as any).title_en,
            title_bn: (item as any).title_bn,
            category: (item as any).category,
            access_tier: item.access_tier,
            request_status: accessReq ? accessReq.status : null,
          }
        });
        return;
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
  requireRole("archivist", "admin"),
  checkUploadQuota,
  uploadSingle,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) throw new AppError(400, "No file provided");

    const { title_en, title_bn, description, authors, category, language, access_tier, status, tags, custom_metadata } =
      req.body as Record<string, string>;

    if (!title_en) throw new AppError(400, "English title is required");

    const key = generateS3Key("archive", req.file.originalname, req.file.mimetype);
    await uploadToS3(key, req.file.buffer, req.file.mimetype);

    const initialStatus = status && ["draft","review","published","archived"].includes(status)
      ? status : "published";

    const item = await withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO archive_items
           (title_en, title_bn, description, authors, category, language, access_tier, status, file_url, file_type, file_size, uploaded_by, custom_metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING *`,
        [
          title_en, title_bn || null, description || null,
          authors ? JSON.parse(authors) : [],
          category || "General", language || "en",
          access_tier || "public", initialStatus,
          key, req.file!.mimetype, req.file!.size, req.user!.user_id,
          custom_metadata ? JSON.parse(custom_metadata) : {},
        ]
      );

      await client.query(
        `INSERT INTO archive_versions (item_id, version_number, file_url, metadata_snapshot, changed_by)
         VALUES ($1, 1, $2, $3, $4)`,
        [result.rows[0].item_id, key, JSON.stringify(result.rows[0]), req.user!.user_id]
      );

      // Handle tags — batched into 2 round trips instead of 2-per-tag
      if (tags) {
        const tagNames: string[] = typeof tags === "string" ? JSON.parse(tags) : tags;
        const uniqueNames = [...new Set(tagNames.map((t) => t.trim()).filter(Boolean))];

        if (uniqueNames.length > 0) {
          const tagPlaceholders = uniqueNames.map((_, i) => `($${i + 1})`).join(", ");
          const tagResult = await client.query(
            `INSERT INTO tags (name_en) VALUES ${tagPlaceholders}
             ON CONFLICT (name_en) DO UPDATE SET name_en = EXCLUDED.name_en
             RETURNING tag_id`,
            uniqueNames
          );

          const linkValues = tagResult.rows
            .map((_, i) => `($1, $${i + 2})`)
            .join(", ");
          await client.query(
            `INSERT INTO archive_item_tags (item_id, tag_id) VALUES ${linkValues} ON CONFLICT DO NOTHING`,
            [result.rows[0].item_id, ...tagResult.rows.map((r) => r.tag_id)]
          );
        }
      }

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
  checkUploadQuota,
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

// PATCH /api/archive/:id — metadata edit (archivist/admin only)
router.patch(
  "/:id",
  authenticate,
  requireRole("archivist", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title_en, title_bn, description, authors, category, access_tier, tags: tagIds, custom_metadata } =
      req.body as {
        title_en?: string; title_bn?: string; description?: string;
        authors?: string[]; category?: string; access_tier?: string; tags?: string[];
        custom_metadata?: Record<string, any>;
      };

    const item = await queryOne<{ item_id: string }>(
      "SELECT item_id FROM archive_items WHERE item_id = $1",
      [req.params.id]
    );
    if (!item) throw new AppError(404, "Archive item not found");

    const updated = await withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE archive_items SET
           title_en        = COALESCE($1, title_en),
           title_bn        = COALESCE($2, title_bn),
           description     = COALESCE($3, description),
           authors         = COALESCE($4, authors),
           category        = COALESCE($5, category),
           access_tier     = COALESCE($6, access_tier),
           custom_metadata = COALESCE($7, custom_metadata),
           updated_at      = NOW()
         WHERE item_id = $8
         RETURNING *`,
        [title_en ?? null, title_bn ?? null, description ?? null,
         authors ? JSON.stringify(authors) : null,
         category ?? null, access_tier ?? null,
         custom_metadata ? JSON.stringify(custom_metadata) : null,
         req.params.id]
      );

      if (tagIds !== undefined) {
        await client.query("DELETE FROM archive_item_tags WHERE item_id = $1", [req.params.id]);
        for (const tag_id of tagIds) {
          await client.query(
            "INSERT INTO archive_item_tags (item_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
            [req.params.id, tag_id]
          );
        }
      }

      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1,'UPDATE','archive_item',$2,$3,$4)`,
        [req.user!.user_id, req.params.id, JSON.stringify({ title_en, category, access_tier }), req.ip]
      );

      return result.rows[0];
    });

    res.json({ success: true, data: updated });
  })
);

// DELETE /api/archive/:id — permanently delete archive item (archivist/admin only)
router.delete(
  "/:id",
  authenticate,
  requireRole("archivist", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const item = await queryOne<{ item_id: string; file_url: string; title_en: string }>(
      "SELECT item_id, file_url, title_en FROM archive_items WHERE item_id = $1",
      [req.params.id]
    );
    if (!item) throw new AppError(404, "Archive item not found");

    const versions = await query<{ file_url: string }>(
      "SELECT file_url FROM archive_versions WHERE item_id = $1",
      [req.params.id]
    );

    await withTransaction(async (client) => {
      await client.query("DELETE FROM access_requests WHERE item_id = $1", [req.params.id]);
      await client.query("DELETE FROM archive_item_tags WHERE item_id = $1", [req.params.id]);
      await client.query("DELETE FROM archive_versions WHERE item_id = $1", [req.params.id]);
      await client.query("DELETE FROM archive_items WHERE item_id = $1", [req.params.id]);

      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, 'DELETE', 'archive_item', $2, $3, $4)`,
        [req.user!.user_id, req.params.id, JSON.stringify({ title_en: item.title_en }), req.ip]
      );
    });

    for (const v of versions) {
      if (v.file_url) {
        deleteFromS3(v.file_url).catch((err) => logger.warn("S3 delete failed during item purge", { error: err.message }));
      }
    }
    if (item.file_url) {
      deleteFromS3(item.file_url).catch((err) => logger.warn("S3 main file delete failed during item purge", { error: err.message }));
    }

    res.json({ success: true, message: "Archive item permanently deleted" });
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

// GET /api/archive/access-requests/pending
router.get(
  "/access-requests/pending",
  authenticate,
  requireRole("archivist", "admin"),
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const requests = await query(
      `SELECT ar.*, u.name as user_name, u.email as user_email, ai.title_en as item_title
       FROM access_requests ar
       JOIN users u ON ar.user_id = u.user_id
       JOIN archive_items ai ON ar.item_id = ai.item_id
       WHERE ar.status = 'pending'
       ORDER BY ar.created_at ASC`
    );
    res.json({ success: true, data: requests });
  })
);

// PATCH /api/archive/access-requests/:id/review
router.patch(
  "/access-requests/:id/review",
  authenticate,
  requireRole("archivist", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, rejection_message } = req.body as { status: "approved" | "denied"; rejection_message?: string };
    if (!["approved", "denied"].includes(status)) {
      throw new AppError(400, "Invalid status (must be approved or denied)");
    }

    const request = await queryOne<{ user_id: string; item_id: string; status: string }>(
      "SELECT * FROM access_requests WHERE request_id = $1",
      [req.params.id]
    );
    if (!request) throw new AppError(404, "Access request not found");

    const updated = await queryOne(
      `UPDATE access_requests
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), rejection_message = $3
       WHERE request_id = $4
       RETURNING *`,
      [status, req.user!.user_id, rejection_message || null, req.params.id]
    );

    // Notify user of access decision
    const item = await queryOne<{ title_en: string }>(
      "SELECT title_en FROM archive_items WHERE item_id = $1",
      [request.item_id]
    );

    if (item) {
      const type = status === "approved" ? "access_request_approved" : "access_request_denied";
      const title = status === "approved" ? "Access Request Approved" : "Access Request Denied";
      const message = status === "approved"
        ? `Your request to access "${item.title_en}" has been approved.`
        : `Your request to access "${item.title_en}" was denied.${rejection_message ? ` Reason: ${rejection_message}` : ""}`;

      await query(
        `INSERT INTO notifications (user_id, type, title, message, action_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [request.user_id, type, title, message, `/archive/${request.item_id}`]
      );
    }

    res.json({ success: true, data: updated });
  })
);

// POST /api/archive/:id/version — upload a new version of an existing archive item
router.post(
  "/:id/version",
  authenticate,
  requireRole("archivist", "admin"),
  checkUploadQuota,
  uploadSingle,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const itemId = req.params.id;
    if (!req.file) throw new AppError(400, "No file provided");

    const item = await queryOne<{ item_id: string; title_en: string; status: string; version: number }>(
      "SELECT item_id, title_en, status, version FROM archive_items WHERE item_id = $1",
      [itemId]
    );
    if (!item) throw new AppError(404, "Archive item not found");

    const key = generateS3Key("archive", req.file.originalname, req.file.mimetype);
    await uploadToS3(key, req.file.buffer, req.file.mimetype);

    // Get max version number
    const maxVerRow = await queryOne<{ max_ver: number }>(
      "SELECT COALESCE(MAX(version_number), 0) as max_ver FROM archive_versions WHERE item_id = $1",
      [itemId]
    );
    const nextVersion = (maxVerRow?.max_ver ?? item.version) + 1;

    const updated = await withTransaction(async (client) => {
      // Update item
      const updateResult = await client.query(
        `UPDATE archive_items
         SET file_url = $1, file_type = $2, file_size = $3, version = $4, updated_at = NOW()
         WHERE item_id = $5
         RETURNING *`,
        [key, req.file!.mimetype, req.file!.size, nextVersion, itemId]
      );

      // Insert new version
      await client.query(
        `INSERT INTO archive_versions (item_id, version_number, file_url, metadata_snapshot, changed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [itemId, nextVersion, key, JSON.stringify(updateResult.rows[0]), req.user!.user_id]
      );

      // Audit Log
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, 'UPDATE', 'archive_item', $2, $3, $4)`,
        [req.user!.user_id, itemId, JSON.stringify({ action: "NEW_VERSION", version: nextVersion }), req.ip]
      );

      return updateResult.rows[0];
    });

    if (item.status === "published") {
      indexArchiveItem({
        item_id: updated.item_id, title_en: updated.title_en, title_bn: updated.title_bn,
        description: updated.description, authors: updated.authors, category: updated.category,
        language: updated.language, access_tier: updated.access_tier, status: updated.status,
        file_type: updated.file_type, created_at: updated.created_at,
      }).catch((err) => logger.error("ES indexing failed for new version", { error: err.message }));
    }

    res.status(201).json({ success: true, data: updated });
  })
);

export default router;
