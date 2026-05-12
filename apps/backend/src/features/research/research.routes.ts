import { Router, Response } from "express";
import { query, queryOne } from "../../core/db/pool";
import { authenticate, requireRole, optionalAuth, AuthRequest } from "../../core/middleware/auth.middleware";
import { AppError, asyncHandler } from "../../core/middleware/error.middleware";
import { uploadSingle } from "../../core/middleware/upload.middleware";
import { uploadToS3, generateS3Key } from "../../infrastructure/s3.service";

const router = Router();

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

// GET /api/research
router.get("/", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, author, keyword, year, output_type, lab_id, page = "1", limit = "20" } =
    req.query as Record<string, string>;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (q) { conditions.push(`(ro.title ILIKE $${idx} OR ro.abstract ILIKE $${idx})`); params.push(`%${q}%`); idx++; }
  if (author) { conditions.push(`ro.authors::text ILIKE $${idx++}`); params.push(`%${author}%`); }
  if (keyword) { conditions.push(`$${idx++} = ANY(ro.keywords)`); params.push(keyword); }
  if (year) { conditions.push(`EXTRACT(YEAR FROM ro.published_date) = $${idx++}`); params.push(parseInt(year)); }
  if (output_type) { conditions.push(`ro.output_type = $${idx++}`); params.push(output_type); }
  if (lab_id) { conditions.push(`ro.lab_id = $${idx++}`); params.push(lab_id); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const [{ count }] = await query<{ count: string }>(
    `SELECT COUNT(*) FROM research_outputs ro ${where}`,
    params
  );

  const outputs = await query(
    `SELECT ro.*, u.name as uploader_name, l.name as lab_name
     FROM research_outputs ro
     JOIN users u ON ro.uploaded_by = u.user_id
     LEFT JOIN labs l ON ro.lab_id = l.lab_id
     ${where}
     ORDER BY ro.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, parseInt(limit), offset]
  );

  res.json({
    success: true,
    data: {
      items: outputs, total: parseInt(count),
      page: parseInt(page), limit: parseInt(limit),
      total_pages: Math.ceil(parseInt(count) / parseInt(limit)),
    },
  });
}));

// GET /api/research/:id/cite
router.get("/:id/cite", asyncHandler(async (req, res: Response) => {
  const output = await queryOne<Record<string, unknown>>(
    "SELECT * FROM research_outputs WHERE output_id = $1",
    [req.params.id]
  );
  if (!output) throw new AppError(404, "Research output not found");

  res.json({
    success: true,
    data: { bibtex: generateBibTeX(output), apa: generateAPA(output), mla: generateMLA(output) },
  });
}));

// GET /api/research/:id
router.get("/:id", asyncHandler(async (req, res: Response) => {
  const output = await queryOne(
    `SELECT ro.*, u.name as uploader_name, l.name as lab_name
     FROM research_outputs ro
     JOIN users u ON ro.uploaded_by = u.user_id
     LEFT JOIN labs l ON ro.lab_id = l.lab_id
     WHERE ro.output_id = $1`,
    [req.params.id]
  );
  if (!output) throw new AppError(404, "Research output not found");
  res.json({ success: true, data: output });
}));

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

    if (title !== undefined)          { updates.push(`title = $${idx++}`);          params.push(title); }
    if (abstract !== undefined)       { updates.push(`abstract = $${idx++}`);       params.push(abstract || null); }
    if (authors !== undefined)        { updates.push(`authors = $${idx++}`);        params.push(typeof authors === "string" ? JSON.parse(authors) : authors); }
    if (keywords !== undefined)       { updates.push(`keywords = $${idx++}`);       params.push(typeof keywords === "string" ? JSON.parse(keywords) : keywords); }
    if (doi !== undefined)            { updates.push(`doi = $${idx++}`);            params.push(doi || null); }
    if (output_type !== undefined)    { updates.push(`output_type = $${idx++}`);    params.push(output_type); }
    if (lab_id !== undefined)         { updates.push(`lab_id = $${idx++}`);         params.push(lab_id || null); }
    if (published_date !== undefined) { updates.push(`published_date = $${idx++}`); params.push(published_date || null); }
    if (journal_name !== undefined)   { updates.push(`journal_name = $${idx++}`);   params.push(journal_name || null); }
    if (volume !== undefined)         { updates.push(`volume = $${idx++}`);         params.push(volume || null); }
    if (issue !== undefined)          { updates.push(`issue = $${idx++}`);          params.push(issue || null); }
    if (pages !== undefined)          { updates.push(`pages = $${idx++}`);          params.push(pages || null); }

    if (updates.length === 0) throw new AppError(400, "No fields provided to update");

    params.push(req.params.id);
    const updated = await queryOne(
      `UPDATE research_outputs SET ${updates.join(", ")}, updated_at = NOW()
       WHERE output_id = $${idx}
       RETURNING *`,
      params
    );

    res.json({ success: true, data: updated });
  })
);

// POST /api/research
router.post(
  "/",
  authenticate,
  requireRole("researcher", "admin"),
  uploadSingle,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, abstract, authors, keywords, doi, output_type, lab_id, published_date, journal_name } =
      req.body as Record<string, string>;

    if (!title) throw new AppError(400, "Title is required");

    let file_url: string | null = null;
    if (req.file) {
      const key = generateS3Key("research", req.file.originalname, req.file.mimetype);
      await uploadToS3(key, req.file.buffer, req.file.mimetype);
      file_url = key;
    }

    const dkp_identifier = generateDKPIdentifier();

    const output = await queryOne(
      `INSERT INTO research_outputs
         (title, abstract, authors, keywords, doi, dkp_identifier, file_url, output_type, lab_id, published_date, journal_name, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        title, abstract || null,
        authors ? JSON.parse(authors) : [],
        keywords ? JSON.parse(keywords) : [],
        doi || null, dkp_identifier, file_url,
        output_type || "journal_article",
        lab_id || null, published_date || null, journal_name || null,
        req.user!.user_id,
      ]
    );

    res.status(201).json({ success: true, data: output });
  })
);

export default router;
