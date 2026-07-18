import { Router, Response } from "express";
import { query, queryOne, withTransaction } from "../../core/db/pool";
import { authenticate, optionalAuth, requireRole, AuthRequest } from "../../core/middleware/auth.middleware";
import { uploadSingle, uploadMultiple, checkUploadQuota } from "../../core/middleware/upload.middleware";
import { AppError, asyncHandler } from "../../core/middleware/error.middleware";
import { parsePagination } from "../../core/utils/pagination";
import { uploadToS3, getPresignedUrl, generateS3Key, deleteFromS3, fileExistsInS3 } from "../../infrastructure/s3.service";
import { indexArchiveItem, searchArchive, removeArchiveItemFromIndex } from "../../infrastructure/elasticsearch.service";
import { logger } from "../../core/config/logger";
import { AccessTier } from "@dkp/shared";
import { ALLOWED_TIERS_BY_ROLE } from "../../core/access-control";
import { getArchiveTransitionRule } from "../../core/archive-lifecycle";
import { createArchiveItemRecord } from "./archive-create.service";
import { validateBody, z } from "../../core/middleware/validate.middleware";

const router = Router();

const VALID_ARCHIVE_STATUSES = ["draft", "review", "published", "archived"] as const;

// ── Zod schemas ────────────────────────────────────────────────────────────────
// Upload routes (/upload, /upload/finalize) arrive as multipart form fields (via
// upload.middleware) or a plain JSON body with the same shape — either way,
// authors/tags/custom_metadata are JSON-encoded strings, not real
// arrays/objects, all the way down into createArchiveItemRecord.
const uploadMetadataSchema = z.object({
  title_en: z.string().trim().min(1, "English title is required"),
  title_bn: z.string().trim().optional(),
  description: z.string().optional(),
  authors: z.string().optional(),
  category: z.string().trim().optional(),
  language: z.string().trim().optional(),
  access_tier: z.string().trim().optional(),
  status: z.string().trim().optional(),
  tags: z.string().optional(),
  custom_metadata: z.string().optional(),
});

const uploadFinalizeSchema = uploadMetadataSchema.extend({
  file_key: z.string().min(1, "file_key, file_type, and file_size are required"),
  file_type: z.string().min(1, "file_key, file_type, and file_size are required"),
  file_size: z.string().min(1, "file_key, file_type, and file_size are required"),
});

const patchMetadataSchema = z.object({
  title_en: z.string().trim().min(1).optional(),
  title_bn: z.string().trim().optional(),
  description: z.string().optional(),
  authors: z.array(z.string()).optional(),
  category: z.string().trim().optional(),
  access_tier: z.string().trim().optional(),
  tags: z.array(z.string()).optional(),
  custom_metadata: z.record(z.any()).optional(),
});

const statusChangeSchema = z.object({
  status: z.enum(VALID_ARCHIVE_STATUSES, { errorMap: () => ({ message: "Invalid status" }) }),
});

const accessRequestReviewSchema = z.object({
  status: z.enum(["approved", "denied"], { errorMap: () => ({ message: "Invalid status (must be approved or denied)" }) }),
  rejection_message: z.string().optional(),
});

const accessRequestCreateSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required"),
});

const bulkMetadataSchema = z.object({
  ids: z.array(z.string()).min(1, "ids array is required"),
  category: z.string().trim().optional(),
  access_tier: z.string().trim().optional(),
  tags: z.array(z.string()).optional(),
});

// Builds a human-readable download filename from a title, keeping the
// original file's extension (S3 keys are UUID-named, e.g. archive/<uuid>.pdf).
function downloadFilename(title: string, key: string): string {
  const ext = key.includes(".") ? key.slice(key.lastIndexOf(".")) : "";
  return `${title}${ext}`;
}

// GET /api/archive/search
router.get("/search", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role ?? "guest";
  let allowedTiers = ALLOWED_TIERS_BY_ROLE[role] ?? ["public"];
  if (role !== "guest" && !allowedTiers.includes("restricted")) {
    allowedTiers = [...allowedTiers, "restricted"];
  }

  const {
    query: q, category, language, file_type, date_from, date_to, tags, page, limit,
  } = req.query as Record<string, string>;

  const { page: pageNum, limit: limitNum } = parsePagination(page ?? "1", limit ?? "20");

  const result = await searchArchive({
    query: q,
    category,
    language,
    file_type,
    date_from,
    date_to,
    tags: tags ? tags.split(",") : undefined,
    page: pageNum,
    limit: limitNum,
    allowed_tiers: allowedTiers,
  });

  res.json({
    success: true,
    data: {
      items: result.hits,
      total: result.total,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(result.total / limitNum),
    },
  });

  if (q && q.trim()) {
    query(
      `INSERT INTO search_queries (query_text, module, user_id, results_count)
       VALUES ($1, 'archive', $2, $3)`,
      [q.trim(), req.user?.user_id || null, result.total]
    ).catch((err) => logger.warn("Failed to log search query", { error: err.message }));
  }
}));

// GET /api/archive/download-url?key=... — generate presigned URL, scoped to the caller's access tier
router.get("/download-url", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key, download } = req.query as { key: string; download?: string };
  if (!key) throw new AppError(400, "key is required");

  const role = req.user?.role ?? "guest";
  const allowedTiers = ALLOWED_TIERS_BY_ROLE[role] ?? ["public"];

  const item = await queryOne<{ item_id: string; access_tier: AccessTier; title_en: string }>(
    `SELECT item_id, access_tier, title_en FROM archive_items WHERE file_url = $1`,
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

  const url = await getPresignedUrl(key, 300, download === "true" ? downloadFilename(item.title_en, key) : undefined); // 5 min expiry
  res.json({ success: true, data: { url } });
}));

// GET /api/archive/meta/tags
router.get("/meta/tags", asyncHandler(async (_req, res: Response) => {
  const tags = await query("SELECT * FROM tags ORDER BY name_en LIMIT 500");
  res.json({ success: true, data: tags });
}));

// GET /api/archive/access-requests/pending
// Must be registered before "/:id" — otherwise Express matches "access-requests" as an :id param.
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
  validateBody(accessRequestReviewSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, rejection_message } = req.body as z.infer<typeof accessRequestReviewSchema>;

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
      const accessReq = await queryOne<{ request_id: string; status: string; rejection_message: string | null }>(
        `SELECT request_id, status, rejection_message FROM access_requests
         WHERE user_id = $1 AND item_id = $2
         ORDER BY created_at DESC LIMIT 1`,
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
            rejection_message: accessReq?.rejection_message ?? null,
          }
        });
        return;
      }
    } else {
      // Guests have no access_requests row to look up — but they still need the
      // same restricted-item payload the frontend renders, otherwise it has
      // nothing to show and falls through to a misleading "not found" screen.
      res.status(403).json({
        success: false,
        message: "Sign in to request access to this document.",
        data: {
          item_id: item.item_id,
          title_en: (item as any).title_en,
          title_bn: (item as any).title_bn,
          category: (item as any).category,
          access_tier: item.access_tier,
          request_status: null,
        }
      });
      return;
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

  const item = await queryOne<{ item_id: string; access_tier: AccessTier; file_url: string; status: string; title_en: string }>(
    "SELECT item_id, access_tier, file_url, status, title_en FROM archive_items WHERE item_id = $1",
    [req.params.id]
  );

  if (!item) throw new AppError(404, "Item not found");

  // Draft/review/archived items are only downloadable/previewable by staff who can
  // already see them via GET /:id — the same visibility rule as that route.
  if (item.status !== "published" && !["archivist", "librarian", "admin"].includes(role)) {
    throw new AppError(404, "Item not found");
  }

  if (!allowedTiers.includes(item.access_tier)) {
    const accessReq = req.user && await queryOne<{ status: string }>(
      `SELECT status FROM access_requests WHERE user_id = $1 AND item_id = $2`,
      [req.user.user_id, item.item_id]
    );
    if (!accessReq || accessReq.status !== "approved") {
      throw new AppError(403, "Access denied");
    }
  }

  const forceDownload = req.query.download === "true";
  const url = await getPresignedUrl(item.file_url, 900, forceDownload ? downloadFilename(item.title_en, item.file_url) : undefined);

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
  validateBody(uploadMetadataSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) throw new AppError(400, "No file provided");

    const { title_en, title_bn, description, authors, category, language, access_tier, status, tags, custom_metadata } =
      req.body as z.infer<typeof uploadMetadataSchema>;

    const key = generateS3Key("archive", req.file.originalname, req.file.mimetype);
    await uploadToS3(key, req.file.buffer, req.file.mimetype);

    const item = await createArchiveItemRecord({
      key, fileType: req.file.mimetype, fileSize: req.file.size,
      uploadedBy: req.user!.user_id, ip: req.ip || "",
      title_en, title_bn, description, authors, category, language, access_tier, status, tags, custom_metadata,
    });

    res.status(201).json({ success: true, data: item });
  })
);

// POST /api/archive/upload/finalize — completes an archive upload after the file
// was already streamed to S3 via the tus resumable-upload endpoint (mounted at
// /api/uploads/tus). Same metadata contract as POST /upload, minus the file itself.
router.post(
  "/upload/finalize",
  authenticate,
  requireRole("archivist", "admin"),
  validateBody(uploadFinalizeSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      file_key, file_type, file_size,
      title_en, title_bn, description, authors, category, language, access_tier, status, tags, custom_metadata,
    } = req.body as z.infer<typeof uploadFinalizeSchema>;

    const exists = await fileExistsInS3(file_key);
    if (!exists) throw new AppError(404, "Uploaded file not found in storage — the tus upload may not have finished");

    const item = await createArchiveItemRecord({
      key: file_key, fileType: file_type, fileSize: parseInt(file_size, 10),
      uploadedBy: req.user!.user_id, ip: req.ip || "",
      title_en, title_bn, description, authors, category, language, access_tier, status, tags, custom_metadata,
    });

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

        // Routed through the same shared creator as the single-file upload paths so
        // bulk items get a real archive_versions baseline row too (previously hand-rolled
        // its own INSERT and skipped it, leaving nothing for later diffing/versioning).
        const item = await createArchiveItemRecord({
          key, fileType: file.mimetype, fileSize: file.size,
          uploadedBy: req.user!.user_id, ip: req.ip || "",
          title_en: file.originalname.replace(/\.[^/.]+$/, ""),
          category: "General", language: "en", access_tier: "member",
        });

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
  validateBody(patchMetadataSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title_en, title_bn, description, authors, category, access_tier, tags: tagIds, custom_metadata } =
      req.body as z.infer<typeof patchMetadataSchema>;

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
    const item = await queryOne<{ item_id: string; file_url: string; title_en: string; source_type: string | null; source_id: string | null }>(
      "SELECT item_id, file_url, title_en, source_type, source_id FROM archive_items WHERE item_id = $1",
      [req.params.id]
    );
    if (!item) throw new AppError(404, "Archive item not found");

    // Auto-archived twin of a live research output or showcase project — deleting it
    // here would silently orphan that record's reference with no warning. The source
    // record is the record of truth; retract/remove it there instead.
    if (item.source_type === "research") {
      const source = await queryOne<{ output_id: string }>(
        "SELECT output_id FROM research_outputs WHERE output_id = $1", [item.source_id]
      );
      if (source) {
        throw new AppError(409, "This archive item is the published copy of a research output. Retract the research output first, then delete this record.");
      }
    }
    if (item.source_type === "showcase") {
      const source = await queryOne<{ project_id: string }>(
        "SELECT project_id FROM student_projects WHERE project_id = $1", [item.source_id]
      );
      if (source) {
        throw new AppError(409, "This archive item is the published copy of a showcase project. Remove the showcase project first, then delete this record.");
      }
    }

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

    void removeArchiveItemFromIndex(req.params.id);

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
  validateBody(statusChangeSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status } = req.body as z.infer<typeof statusChangeSchema>;

    const item = await queryOne<{ item_id: string; status: string; file_url: string; version: number }>(
      "SELECT item_id, status, file_url, version FROM archive_items WHERE item_id = $1",
      [req.params.id]
    );
    if (!item) throw new AppError(404, "Item not found");

    const rule = getArchiveTransitionRule(item.status, status);
    if (rule === "invalid") {
      throw new AppError(409, `Cannot move from "${item.status}" to "${status}" — the lifecycle is Draft → Review → Published → Archived`);
    }
    if (rule === "regression" && !["archivist", "admin"].includes(req.user!.role)) {
      throw new AppError(403, "Only an Archivist or Admin can move a document backward in its lifecycle");
    }

    const updated = await queryOne(
      "UPDATE archive_items SET status = $1 WHERE item_id = $2 RETURNING *",
      [status, req.params.id]
    );

    if (status === "published") {
      indexArchiveItem({ ...(updated as object), status }).catch(() => {});
    } else {
      void removeArchiveItemFromIndex(req.params.id);
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
  validateBody(accessRequestCreateSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reason } = req.body as z.infer<typeof accessRequestCreateSchema>;

    const item = await queryOne<{ item_id: string; access_tier: AccessTier; title_en: string }>(
      "SELECT item_id, access_tier, title_en FROM archive_items WHERE item_id = $1 AND status = 'published'",
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

    // Notify all archivists about the new access request
    const requester = await queryOne<{ name: string }>(
      "SELECT name FROM users WHERE user_id = $1",
      [req.user!.user_id]
    );
    const archivists = await query<{ user_id: string }>(
      "SELECT user_id FROM users WHERE role = 'archivist'"
    );
    for (const arch of archivists) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, action_url)
         VALUES ($1, 'pending_approval', 'New Access Request', $2, '/admin')`,
        [arch.user_id, `${requester?.name ?? "A user"} has requested access to "${item.title_en}".`]
      );
    }

    res.status(201).json({ success: true, data: request });
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

// PATCH /api/archive/bulk-metadata — bulk update metadata for multiple items (archivist/admin only)
router.patch(
  "/bulk-metadata",
  authenticate,
  requireRole("archivist", "admin"),
  validateBody(bulkMetadataSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ids, category, access_tier, tags } = req.body as z.infer<typeof bulkMetadataSchema>;

    const updated = await withTransaction(async (client) => {
      const updates: string[] = [];
      const params: unknown[] = [];
      let idx = 1;

      if (category !== undefined) {
        updates.push(`category = $${idx++}`);
        params.push(category);
      }
      if (access_tier !== undefined) {
        updates.push(`access_tier = $${idx++}`);
        params.push(access_tier);
      }

      if (updates.length > 0) {
        params.push(ids);
        await client.query(
          `UPDATE archive_items SET ${updates.join(", ")}, updated_at = NOW()
           WHERE item_id = ANY($${idx})`,
          params
        );
      }

      if (tags !== undefined) {
        await client.query(
          "DELETE FROM archive_item_tags WHERE item_id = ANY($1)",
          [ids]
        );

        if (tags.length > 0) {
          for (const item_id of ids) {
            for (const tag_id of tags) {
              await client.query(
                "INSERT INTO archive_item_tags (item_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
                [item_id, tag_id]
              );
            }
          }
        }
      }

      // Add audit logs
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, details, ip_address)
         VALUES ($1, 'UPDATE', 'archive_item', $2, $3)`,
        [
          req.user!.user_id,
          JSON.stringify({ action: "BULK_UPDATE", ids, category, access_tier, tags_updated: tags !== undefined }),
          req.ip,
        ]
      );

      return { ids, count: ids.length };
    });

    res.json({ success: true, data: updated });
  })
);

export default router;
