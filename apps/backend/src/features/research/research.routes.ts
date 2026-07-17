import { Router, Request, Response } from "express";
import { query, queryOne } from "../../core/db/pool";
import { authenticate, requireRole, optionalAuth, AuthRequest } from "../../core/middleware/auth.middleware";
import { AppError, asyncHandler } from "../../core/middleware/error.middleware";
import { parsePagination } from "../../core/utils/pagination";
import { uploadSingle } from "../../core/middleware/upload.middleware";
import { uploadToS3, getPresignedUrl, generateS3Key } from "../../infrastructure/s3.service";
import { logger } from "../../core/config/logger";
import { ALLOWED_TIERS_BY_ROLE } from "../../core/access-control";
import { AccessTier } from "@dkp/shared";
import { notifyAllUsersExcept } from "../../infrastructure/notification.service";
import { indexResearchOutput, searchResearch } from "../../infrastructure/elasticsearch.service";

const router = Router();

/** Fetches a research output joined with its uploader/lab names — the same
 *  shape GET /:id returns — so Elasticsearch documents carry everything a
 *  result card needs without a follow-up DB round trip per hit. */
async function fetchResearchOutputWithJoins(output_id: string) {
  return queryOne(
    `SELECT ro.*, u.name as uploader_name, l.name as lab_name
     FROM research_outputs ro
     JOIN users u ON ro.uploaded_by = u.user_id
     LEFT JOIN labs l ON ro.lab_id = l.lab_id
     WHERE ro.output_id = $1`,
    [output_id]
  );
}

function generateDKPIdentifier(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `DKP-${year}-${random}`;
}

function generateBibTeX(output: Record<string, unknown>): string {
  const authors = (output.authors as Array<{ name: string }>).map((a) => a.name).join(" and ");
  return `@article{${output.dkp_identifier},
  title = {${output.title}},
  author = {${authors}},
  year = {${output.published_date ? new Date(output.published_date as string).getFullYear() : ""}},
  journal = {${output.journal_name || ""}},
  doi = {${output.doi || ""}},
  note = {${output.dkp_identifier}}
}`;
}

function generateAPA(output: Record<string, unknown>): string {
  const authors = (output.authors as Array<{ name: string }>).map((a) => a.name).join(", ");
  const year = output.published_date ? new Date(output.published_date as string).getFullYear() : "n.d.";
  return `${authors} (${year}). ${output.title}. ${output.journal_name || ""}. ${output.doi ? `https://doi.org/${output.doi}` : ""}`;
}

function generateMLA(output: Record<string, unknown>): string {
  const firstAuthor = (output.authors as Array<{ name: string }>)[0]?.name || "";
  const year = output.published_date ? new Date(output.published_date as string).getFullYear() : "n.d.";
  return `${firstAuthor}. "${output.title}." ${output.journal_name || ""}, ${year}.`;
}

// GET /api/research/meta/labs
router.get("/meta/labs", asyncHandler(async (_req, res: Response) => {
  const labs = await query(
    `SELECT l.*, u.name as head_name
     FROM labs l JOIN users u ON l.head_researcher_id = u.user_id
     ORDER BY l.name`
  );
  res.json({ success: true, data: labs });
}));

// POST /api/research/labs
router.post(
  "/labs",
  authenticate,
  requireRole("researcher", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description } = req.body as { name: string; description?: string };
    if (!name) throw new AppError(400, "Lab name is required");

    const lab = await queryOne(
      "INSERT INTO labs (name, description, head_researcher_id) VALUES ($1,$2,$3) RETURNING *",
      [name, description || null, req.user!.user_id]
    );
    res.status(201).json({ success: true, data: lab });
  })
);

// GET /api/research/authors — directory of researchers who have at least one published output
router.get("/authors", asyncHandler(async (_req: Request, res: Response) => {
  const authors = await query(
    `SELECT u.user_id, u.name, u.department, u.avatar_url,
            COUNT(ro.output_id) as output_count,
            MAX(ro.published_date) as latest_publication
     FROM users u
     JOIN research_outputs ro ON ro.uploaded_by = u.user_id
     WHERE u.deleted_at IS NULL AND ro.access_tier = 'public'
     GROUP BY u.user_id, u.name, u.department, u.avatar_url
     ORDER BY output_count DESC, u.name ASC`
  );
  res.json({ success: true, data: authors });
}));

// GET /api/research/authors/:id — dedicated author profile: bio + lab affiliations + publications.
// Distinct from the generic /auth/profile/:id — this is scoped to the Research
// Repository module and aggregates everything a visitor needs to evaluate an
// author's academic output in one call.
router.get("/authors/:id", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const author = await queryOne<{ user_id: string; role: string }>(
    `SELECT user_id, name, email, role, department, bio, avatar_url, created_at
     FROM users WHERE user_id = $1 AND deleted_at IS NULL`,
    [req.params.id]
  );
  if (!author) throw new AppError(404, "Author not found");

  const role = req.user?.role ?? "guest";
  const allowedTiers = ALLOWED_TIERS_BY_ROLE[role] ?? ["public"];

  const publications = await query(
    `SELECT ro.output_id, ro.title, ro.abstract, ro.authors, ro.output_type, ro.dkp_identifier,
            ro.published_date, ro.journal_name, ro.access_tier, l.name as lab_name
     FROM research_outputs ro
     LEFT JOIN labs l ON ro.lab_id = l.lab_id
     WHERE ro.uploaded_by = $1 AND ro.access_tier = ANY($2)
     ORDER BY ro.published_date DESC NULLS LAST, ro.created_at DESC`,
    [req.params.id, allowedTiers]
  );

  const labs = await query(
    `SELECT l.lab_id, l.name, lm.role
     FROM lab_members lm
     JOIN labs l ON lm.lab_id = l.lab_id
     WHERE lm.user_id = $1
     ORDER BY l.name`,
    [req.params.id]
  );

  const headOfLabs = await query(
    `SELECT lab_id, name FROM labs WHERE head_researcher_id = $1`,
    [req.params.id]
  );

  res.json({
    success: true,
    data: { ...author, publications, labs, head_of_labs: headOfLabs },
  });
}));

// GET /api/research
router.get("/", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, author, keyword, year, output_type, lab_id, uploaded_by, page = "1", limit = "20" } =
    req.query as Record<string, string>;

  const role = req.user?.role ?? "guest";
  const allowedTiers = ALLOWED_TIERS_BY_ROLE[role] ?? ["public"];
  const { page: pageNum, limit: limitNum } = parsePagination(page, limit);

  const { hits, total } = await searchResearch({
    query: q,
    author,
    keyword,
    year: year ? parseInt(year, 10) : undefined,
    output_type,
    lab_id,
    uploaded_by,
    allowed_tiers: allowedTiers,
    page: pageNum,
    limit: limitNum,
  });

  res.json({
    success: true,
    data: {
      items: hits, total,
      page: pageNum, limit: limitNum,
      total_pages: Math.ceil(total / limitNum),
    },
  });
}));

// GET /api/research/:id/cite
router.get("/:id/cite", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const output = await queryOne<Record<string, unknown> & { access_tier: AccessTier }>(
    "SELECT * FROM research_outputs WHERE output_id = $1",
    [req.params.id]
  );
  if (!output) throw new AppError(404, "Research output not found");

  const role = req.user?.role ?? "guest";
  const allowedTiers = ALLOWED_TIERS_BY_ROLE[role] ?? ["public"];
  if (!allowedTiers.includes(output.access_tier)) {
    throw new AppError(403, "Sign in to access this resource, or it may require a higher access tier.");
  }

  res.json({
    success: true,
    data: { bibtex: generateBibTeX(output), apa: generateAPA(output), mla: generateMLA(output) },
  });
}));

// GET /api/research/:id/download-url
router.get("/:id/download-url", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const output = await queryOne<{ file_url: string; access_tier: AccessTier; status: string; uploaded_by: string }>(
    "SELECT file_url, access_tier, status, uploaded_by FROM research_outputs WHERE output_id = $1",
    [req.params.id]
  );
  if (!output || !output.file_url) throw new AppError(404, "File not found");

  const isOwnerOrAdmin = req.user?.user_id === output.uploaded_by || req.user?.role === "admin";
  if (output.status === "retracted" && !isOwnerOrAdmin) throw new AppError(404, "File not found");

  const role = req.user?.role ?? "guest";
  const allowedTiers = ALLOWED_TIERS_BY_ROLE[role] ?? ["public"];
  if (!allowedTiers.includes(output.access_tier)) {
    throw new AppError(403, "Sign in to access this resource, or it may require a higher access tier.");
  }

  const url = await getPresignedUrl(output.file_url);
  res.json({ success: true, data: { url } });
}));

// GET /api/research/:id
router.get("/:id", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const output = await queryOne<{ access_tier: AccessTier; status: string; uploaded_by: string }>(
    `SELECT ro.*, u.name as uploader_name, l.name as lab_name
     FROM research_outputs ro
     JOIN users u ON ro.uploaded_by = u.user_id
     LEFT JOIN labs l ON ro.lab_id = l.lab_id
     WHERE ro.output_id = $1`,
    [req.params.id]
  );
  if (!output) throw new AppError(404, "Research output not found");

  const isOwnerOrAdmin = req.user?.user_id === output.uploaded_by || req.user?.role === "admin";
  if (output.status === "retracted" && !isOwnerOrAdmin) throw new AppError(404, "Research output not found");

  const role = req.user?.role ?? "guest";
  const allowedTiers = ALLOWED_TIERS_BY_ROLE[role] ?? ["public"];
  if (!allowedTiers.includes(output.access_tier)) {
    throw new AppError(403, "Sign in to access this resource, or it may require a higher access tier.");
  }

  res.json({ success: true, data: output });
}));

// PATCH /api/research/:id/retract — self-service takedown for the uploader (or admin).
// Retracted outputs stay in the DB (citations/audit trail intact) but drop out of
// search, listing, and direct-view for everyone except the owner/admin.
router.patch(
  "/:id/retract",
  authenticate,
  requireRole("researcher", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const existing = await queryOne<{ output_id: string; uploaded_by: string; status: string }>(
      "SELECT output_id, uploaded_by, status FROM research_outputs WHERE output_id = $1",
      [req.params.id]
    );
    if (!existing) throw new AppError(404, "Research output not found");
    if (existing.uploaded_by !== req.user!.user_id && req.user!.role !== "admin") {
      throw new AppError(403, "You can only retract your own research outputs");
    }
    if (existing.status === "retracted") {
      throw new AppError(409, "This research output is already retracted");
    }

    await query(
      "UPDATE research_outputs SET status = 'retracted', updated_at = NOW() WHERE output_id = $1",
      [req.params.id]
    );

    const joined = await fetchResearchOutputWithJoins(req.params.id);
    if (joined) void indexResearchOutput(joined as Record<string, unknown>);

    res.json({ success: true, data: joined });
  })
);



// PATCH /api/research/:id
router.patch(
  "/:id",
  authenticate,
  requireRole("researcher", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const existing = await queryOne<{
      output_id: string;
      uploaded_by: string;
    }>("SELECT output_id, uploaded_by FROM research_outputs WHERE output_id = $1", [req.params.id]);

    if (!existing) throw new AppError(404, "Research output not found");

    if (existing.uploaded_by !== req.user!.user_id && req.user!.role !== "admin") {
      throw new AppError(403, "You can only edit your own research outputs");
    }

    const {
      title, abstract, authors, keywords,
      doi, output_type, lab_id,
      published_date, journal_name, volume, issue, pages,
    } = req.body as Record<string, string>;

    // Build SET clause dynamically — only update provided fields
    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (title !== undefined) { updates.push(`title = $${idx++}`); params.push(title); }
    if (abstract !== undefined) { updates.push(`abstract = $${idx++}`); params.push(abstract || null); }
    if (authors !== undefined) { updates.push(`authors = $${idx++}`); params.push(typeof authors === "string" ? JSON.parse(authors) : authors); }
    if (keywords !== undefined) { updates.push(`keywords = $${idx++}`); params.push(typeof keywords === "string" ? JSON.parse(keywords) : keywords); }
    if (doi !== undefined) {
      if (doi) {
        const duplicate = await queryOne(
          "SELECT output_id FROM research_outputs WHERE doi = $1 AND output_id != $2",
          [doi, req.params.id]
        );
        if (duplicate) throw new AppError(409, "A research output with this DOI already exists");
      }
      updates.push(`doi = $${idx++}`); params.push(doi || null);
    }
    if (output_type !== undefined) { updates.push(`output_type = $${idx++}`); params.push(output_type); }
    if (lab_id !== undefined) { updates.push(`lab_id = $${idx++}`); params.push(lab_id || null); }
    if (published_date !== undefined) { updates.push(`published_date = $${idx++}`); params.push(published_date || null); }
    if (journal_name !== undefined) { updates.push(`journal_name = $${idx++}`); params.push(journal_name || null); }
    if (volume !== undefined) { updates.push(`volume = $${idx++}`); params.push(volume || null); }
    if (issue !== undefined) { updates.push(`issue = $${idx++}`); params.push(issue || null); }
    if (pages !== undefined) { updates.push(`pages = $${idx++}`); params.push(pages || null); }

    if (updates.length === 0) throw new AppError(400, "No fields provided to update");

    params.push(req.params.id);
    await queryOne(
      `UPDATE research_outputs SET ${updates.join(", ")}, updated_at = NOW()
       WHERE output_id = $${idx}
       RETURNING *`,
      params
    );

    const joined = await fetchResearchOutputWithJoins(req.params.id);
    if (joined) void indexResearchOutput(joined as Record<string, unknown>);

    res.json({ success: true, data: joined });
  })
);

// POST /api/research
router.post(
  "/",
  authenticate,
  requireRole("researcher", "admin"),
  uploadSingle,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = req.body as Record<string, string>;
    const { title, abstract, doi, output_type, lab_id, published_date, journal_name } = body;

    if (!title) throw new AppError(400, "Title is required");

    // Defaults to "public" like the DB column, but a researcher may only choose a tier
    // they themselves can see — otherwise they could restrict a doc above their own
    // access, or (before this check) it silently landed on "public" no matter what.
    const requestedTier = (body.access_tier as AccessTier) || "public";
    const allowedTiers = ALLOWED_TIERS_BY_ROLE[req.user!.role] ?? ["public"];
    if (!allowedTiers.includes(requestedTier)) {
      throw new AppError(403, `You cannot set access tier to "${requestedTier}"`);
    }

    if (doi) {
      const duplicate = await queryOne("SELECT output_id FROM research_outputs WHERE doi = $1", [doi]);
      if (duplicate) throw new AppError(409, "A research output with this DOI already exists");
    }

    // Safely parse JSON fields from multipart FormData
    let authors: unknown[] = [];
    let keywords: string[] = [];

    try {
      const a = body.authors;
      authors = typeof a === "string" ? JSON.parse(a) : Array.isArray(a) ? a : [];
    } catch { authors = []; }

    try {
      const k = body.keywords;
      keywords = typeof k === "string" ? JSON.parse(k) : Array.isArray(k) ? k : [];
    } catch { keywords = []; }

    let file_url: string | null = null;
    if (req.file) {
      const key = generateS3Key("research", req.file.originalname, req.file.mimetype);
      await uploadToS3(key, req.file.buffer, req.file.mimetype);
      file_url = key;
    }

    const dkp_identifier = generateDKPIdentifier();

    const output = await queryOne(
      `INSERT INTO research_outputs
         (title, abstract, authors, keywords, doi, dkp_identifier, file_url, output_type, lab_id, published_date, journal_name, uploaded_by, access_tier)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        title, abstract || null,
        JSON.stringify(authors),   // JSONB — must be a JSON string
        keywords,                  // TEXT[] — pass array directly
        doi || null, dkp_identifier, file_url,
        output_type || "journal",
        lab_id || null, published_date || null, journal_name || null,
        req.user!.user_id, requestedTier,
      ]
    );

    // Auto-archive: Create archive item from research output
    if (file_url && req.file) {
      try {
        const authorNames = Array.isArray(authors)
          ? authors.map((a: unknown) => (typeof a === "object" && a !== null && "name" in a ? (a as { name: string }).name : String(a)))
          : [];
        const archiveDescription = abstract || `Research output: ${title}`;
        
        await query(
          `INSERT INTO archive_items
             (title_en, description, authors, category, language, access_tier, status, file_url, file_type, file_size, uploaded_by, source_type, source_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            title, archiveDescription,
            authorNames, "Research", "en",
            requestedTier, "published", file_url, req.file.mimetype || "application/pdf", req.file.size,
            req.user!.user_id, "research", (output as Record<string, string>).output_id
          ]
        );
      } catch (archiveErr) {
        logger.warn("Failed to auto-archive research output", {
          output_id: (output as Record<string, string>).output_id,
          error: (archiveErr as Error).message,
        });
        // Continue despite archive failure
      }
    }

    const output_id = (output as Record<string, string>).output_id;
    const joined = await fetchResearchOutputWithJoins(output_id);
    if (joined) void indexResearchOutput(joined as Record<string, unknown>);

    // Fire-and-forget — notifyAllUsersExcept never rejects, it logs internally.
    void notifyAllUsersExcept(req.user!.user_id, {
      type: "new_upload",
      title: "New Research Published",
      message: `"${title}" has been published.`,
      action_url: `/research/${output_id}`,
    });

    res.status(201).json({ success: true, data: output });
  })
);

// GET /api/research/labs/:id
router.get("/labs/:id", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const lab = await queryOne(
    `SELECT l.*, u.name as head_name, u.email as head_email
     FROM labs l
     JOIN users u ON l.head_researcher_id = u.user_id
     WHERE l.lab_id = $1`,
    [id]
  );
  if (!lab) throw new AppError(404, "Lab not found");

  const members = await query(
    `SELECT lm.joined_at, u.user_id, u.name, u.email, u.role, u.department
     FROM lab_members lm
     JOIN users u ON lm.user_id = u.user_id
     WHERE lm.lab_id = $1
     ORDER BY u.name ASC`,
    [id]
  );

  const outputs = await query(
    `SELECT * FROM research_outputs
     WHERE lab_id = $1
     ORDER BY published_date DESC, created_at DESC`,
    [id]
  );

  res.json({
    success: true,
    data: {
      lab,
      members,
      outputs,
    },
  });
}));

export default router;
