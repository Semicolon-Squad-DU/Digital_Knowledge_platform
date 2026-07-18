import { Router, Response } from "express";
import { query, queryOne } from "../../core/db/pool";
import { authenticate, requireRole, optionalAuth, AuthRequest } from "../../core/middleware/auth.middleware";
import { AppError, asyncHandler } from "../../core/middleware/error.middleware";
import { parsePagination } from "../../core/utils/pagination";
import { uploadShowcaseFiles } from "../../core/middleware/upload.middleware";
import { uploadToS3, generateS3Key, getPresignedUrl } from "../../infrastructure/s3.service";
import { sendEmail, projectApprovalEmail } from "../../infrastructure/email.service";
import { logger } from "../../core/config/logger";
import { validateBody, z } from "../../core/middleware/validate.middleware";

const router = Router();

// ── Zod schemas ────────────────────────────────────────────────────────────────
// POST / and PATCH /:id arrive as multipart form fields (via uploadShowcaseFiles)
// — team_members/technologies are JSON-encoded array strings, matching the
// manual JSON.parse already done further down in each handler.
const showcaseCreateSchema = z.object({
  title: z.string().trim().min(1, "title, abstract, advisor_id, semester, department are required"),
  abstract: z.string().trim().min(1, "title, abstract, advisor_id, semester, department are required"),
  advisor_id: z.string().trim().min(1, "title, abstract, advisor_id, semester, department are required"),
  semester: z.string().trim().min(1, "title, abstract, advisor_id, semester, department are required"),
  department: z.string().trim().min(1, "title, abstract, advisor_id, semester, department are required"),
  source_code_url: z.string().trim().optional(),
  team_members: z.string().optional(),
  technologies: z.string().optional(),
});

const showcaseUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  abstract: z.string().trim().min(1).optional(),
  advisor_id: z.string().trim().min(1).optional(),
  semester: z.string().trim().min(1).optional(),
  department: z.string().trim().min(1).optional(),
  source_code_url: z.string().trim().optional(),
  team_members: z.string().optional(),
  technologies: z.string().optional(),
});

const showcaseReviewSchema = z.object({
  action: z.enum(["approve", "request_changes"], { errorMap: () => ({ message: "action must be 'approve' or 'request_changes'" }) }),
  comments: z.string().optional(),
});

// GET /api/showcase
router.get("/", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { department, semester, technology, advisor_id, submitted_by, q, page = "1", limit = "12" } =
    req.query as Record<string, string>;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (submitted_by) {
    conditions.push(`sp.submitted_by = $${paramIdx++}`);
    params.push(submitted_by);
  } else {
    conditions.push("sp.status = 'published'");
  }

  if (department) { conditions.push(`sp.department = $${paramIdx++}`); params.push(department); }
  if (semester) { conditions.push(`sp.semester = $${paramIdx++}`); params.push(semester); }
  if (technology) { conditions.push(`$${paramIdx++} = ANY(sp.technologies)`); params.push(technology); }
  if (advisor_id) { conditions.push(`sp.advisor_id = $${paramIdx++}`); params.push(advisor_id); }
  if (q) { conditions.push(`sp.title ILIKE $${paramIdx++}`); params.push(`%${q}%`); }

  const { page: pageNum, limit: limitNum, offset } = parsePagination(page, limit);
  const whereClause = conditions.join(" AND ");

  const [{ count }] = await query<{ count: string }>(
    `SELECT COUNT(*) FROM student_projects sp WHERE ${whereClause}`,
    params
  );

  const projects = await query<{ thumbnail_url: string | null } & Record<string, unknown>>(
    `SELECT sp.project_id, sp.title, sp.abstract, sp.team_members, sp.semester,
            sp.department, sp.technologies, sp.thumbnail_url, sp.created_at,
            sp.status, sp.advisor_comments,
            u.name as advisor_name
     FROM student_projects sp
     JOIN users u ON sp.advisor_id = u.user_id
     WHERE ${whereClause}
     ORDER BY sp.created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    [...params, limitNum, offset]
  );

  // thumbnail_url is stored as an S3 key, not a public URL — resolve each to a
  // short-lived presigned URL so gallery cards can render it directly.
  const items = await Promise.all(
    projects.map(async (p) => ({
      ...p,
      thumbnail_url: p.thumbnail_url ? await getPresignedUrl(p.thumbnail_url) : null,
    }))
  );

  res.json({
    success: true,
    data: {
      items, total: parseInt(count),
      page: pageNum, limit: limitNum,
      total_pages: Math.ceil(parseInt(count) / limitNum),
    },
  });
}));

// GET /api/showcase/queue/pending
router.get(
  "/queue/pending",
  authenticate,
  requireRole("researcher", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const projects = await query(
      `SELECT sp.*, sub.name as submitted_by_name
       FROM student_projects sp
       JOIN users sub ON sp.submitted_by = sub.user_id
       WHERE sp.advisor_id = $1 AND sp.status = 'pending_review'
       ORDER BY sp.created_at ASC`,
      [req.user!.user_id]
    );
    res.json({ success: true, data: projects });
  })
);

// GET /api/showcase/:id
router.get("/:id", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const project = await queryOne<{
    project_id: string;
    status: string;
    advisor_id: string;
    submitted_by: string;
    thumbnail_url: string | null;
  }>(
    `SELECT sp.*, u.name as advisor_name, u.email as advisor_email,
            sub.name as submitted_by_name
     FROM student_projects sp
     JOIN users u ON sp.advisor_id = u.user_id
     JOIN users sub ON sp.submitted_by = sub.user_id
     WHERE sp.project_id = $1`,
    [req.params.id]
  );
  if (!project) throw new AppError(404, "Project not found");

  // Mirrors the list endpoint: unpublished projects (pending_review, changes_requested,
  // draft) are only visible to the student who submitted it, the assigned advisor, or an
  // admin — everyone else, including guests, gets the same 404 as a nonexistent project.
  const isOwnerOrReviewer = !!req.user && (
    req.user.user_id === project.submitted_by ||
    req.user.user_id === project.advisor_id ||
    req.user.role === "admin"
  );
  if (project.status !== "published" && !isOwnerOrReviewer) {
    throw new AppError(404, "Project not found");
  }

  const thumbnail_url = project.thumbnail_url ? await getPresignedUrl(project.thumbnail_url) : null;

  res.json({ success: true, data: { ...project, thumbnail_url } });
}));

// GET /api/showcase/:id/download-url
router.get("/:id/download-url", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const project = await queryOne<{ report_url: string | null }>(
    "SELECT report_url FROM student_projects WHERE project_id = $1",
    [req.params.id]
  );
  if (!project || !project.report_url) throw new AppError(404, "File not found");

  const url = await getPresignedUrl(project.report_url);
  res.json({ success: true, data: { url } });
}));

// GET /api/showcase/:id/video-url — presigned URL for the demo video, for inline playback
router.get("/:id/video-url", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const project = await queryOne<{ video_url: string | null }>(
    "SELECT video_url FROM student_projects WHERE project_id = $1",
    [req.params.id]
  );
  if (!project || !project.video_url) throw new AppError(404, "Video not found");

  const url = await getPresignedUrl(project.video_url);
  res.json({ success: true, data: { url } });
}));

// POST /api/showcase
router.post(
  "/",
  authenticate,
  requireRole("student_author", "admin"),
  uploadShowcaseFiles,
  validateBody(showcaseCreateSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = req.body as z.infer<typeof showcaseCreateSchema>;
    const files = req.files as { file?: Express.Multer.File[]; video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] } | undefined;
    const reportFile = files?.file?.[0];
    const videoFile = files?.video?.[0];
    const thumbnailFile = files?.thumbnail?.[0];

    const title          = body.title;
    const abstract       = body.abstract;
    const advisor_id     = body.advisor_id;
    const semester       = body.semester;
    const department     = body.department;
    const source_code_url = body.source_code_url;

    // Safely parse JSON fields — multer sends them as strings
    let team_members: unknown[] = [];
    let technologies: string[]  = [];

    try {
      const tm = body.team_members;
      team_members = typeof tm === "string" ? JSON.parse(tm) : Array.isArray(tm) ? tm : [];
    } catch {
      throw new AppError(400, "Invalid team_members format");
    }

    try {
      const tech = body.technologies;
      technologies = typeof tech === "string" ? JSON.parse(tech) : Array.isArray(tech) ? tech : [];
    } catch {
      throw new AppError(400, "Invalid technologies format");
    }

    let report_url: string | null = null;
    if (reportFile) {
      const key = generateS3Key("showcase/reports", reportFile.originalname, reportFile.mimetype);
      await uploadToS3(key, reportFile.buffer, reportFile.mimetype);
      report_url = key;
    }

    let video_url: string | null = null;
    if (videoFile) {
      if (!videoFile.mimetype.startsWith("video/")) {
        throw new AppError(400, "Demo video must be a video file");
      }
      const key = generateS3Key("showcase/videos", videoFile.originalname, videoFile.mimetype);
      await uploadToS3(key, videoFile.buffer, videoFile.mimetype);
      video_url = key;
    }

    let thumbnail_url: string | null = null;
    if (thumbnailFile) {
      if (!thumbnailFile.mimetype.startsWith("image/")) {
        throw new AppError(400, "Thumbnail must be an image file");
      }
      const key = generateS3Key("showcase/thumbnails", thumbnailFile.originalname, thumbnailFile.mimetype);
      await uploadToS3(key, thumbnailFile.buffer, thumbnailFile.mimetype);
      thumbnail_url = key;
    }

    const project = await queryOne(
      `INSERT INTO student_projects
         (title, abstract, team_members, advisor_id, semester, department, technologies, report_url, video_url, source_code_url, thumbnail_url, submitted_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending_review')
       RETURNING *`,
      [
        title, abstract,
        JSON.stringify(team_members),   // JSONB column
        advisor_id, semester, department,
        technologies,                   // TEXT[] column — pass array directly
        report_url, video_url, source_code_url || null, thumbnail_url,
        req.user!.user_id,
      ]
    );

    const advisor = await queryOne<{ name: string; email: string }>(
      "SELECT name, email FROM users WHERE user_id = $1",
      [advisor_id]
    );
    if (advisor) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, action_url)
         VALUES ($1, 'new_upload', $2, $3, $4)`,
        [advisor_id, "New Project Submission", `"${title}" awaits your review`,
         `/showcase/review/${(project as Record<string, string>).project_id}`]
      );
    }

    res.status(201).json({ success: true, data: project });
  })
);

// PATCH /api/showcase/:id/review
router.patch(
  "/:id/review",
  authenticate,
  requireRole("researcher", "admin"),
  validateBody(showcaseReviewSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { action, comments } = req.body as z.infer<typeof showcaseReviewSchema>;

    const project = await queryOne<{
      project_id: string; title: string; advisor_id: string; submitted_by: string; status: string;
      team_members: unknown; abstract: string; report_url: string | null;
    }>(
      "SELECT * FROM student_projects WHERE project_id = $1",
      [req.params.id]
    );

    if (!project) throw new AppError(404, "Project not found");
    if (project.advisor_id !== req.user!.user_id && req.user!.role !== "admin") {
      throw new AppError(403, "Only the assigned advisor can review this project");
    }

    const newStatus = action === "approve" ? "published" : "changes_requested";
    const updated = await queryOne(
      "UPDATE student_projects SET status = $1, advisor_comments = $2 WHERE project_id = $3 RETURNING *",
      [newStatus, comments || null, req.params.id]
    );

    // Auto-archive: Create archive item when project is published — only when a
    // report file exists, since archive_items.file_url is NOT NULL (skip silently
    // for projects approved without an uploaded report rather than erroring).
    // Only fires on the transition INTO published — re-approving an already-published
    // project (e.g. re-review after changes_requested, or a double-submit race) must
    // not insert a second archive_items row for the same project.
    if (action === "approve" && project.report_url && project.status !== "published") {
      try {
        const archiveTitle = `${project.title} - Student Project`;
        const teamMemberNames = Array.isArray(project.team_members as unknown[])
          ? (project.team_members as unknown[]).map((m: unknown) =>
              typeof m === "object" && m !== null && "name" in m ? (m as { name: string }).name : String(m)
            )
          : [];
        const archiveDescription = project.abstract || `Student project: ${project.title}`;
        
        await query(
          `INSERT INTO archive_items
             (title_en, description, authors, category, language, access_tier, status, file_url, file_type, file_size, uploaded_by, source_type, source_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            archiveTitle, archiveDescription,
            teamMemberNames, "Student Project", "en",
            "member", "published", project.report_url || null, "application/pdf", 0,
            req.user!.user_id, "showcase", project.project_id
          ]
        );
      } catch (archiveErr) {
        logger.warn("Failed to auto-archive published project", {
          project_id: project.project_id,
          error: (archiveErr as Error).message,
        });
        // Continue despite archive failure
      }
    }

    const student = await queryOne<{ name: string; email: string }>(
      "SELECT name, email FROM users WHERE user_id = $1",
      [project.submitted_by]
    );

    if (student) {
      const notifType = action === "approve" ? "project_approved" : "project_changes_requested";
      await query(
        `INSERT INTO notifications (user_id, type, title, message, action_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          project.submitted_by, notifType,
          action === "approve" ? "Project Approved!" : "Changes Requested",
          `Your project "${project.title}" has been ${action === "approve" ? "approved" : "returned for changes"}`,
          `/showcase/${project.project_id}`,
        ]
      );

      sendEmail({
        to: student.email,
        subject: action === "approve" ? "Project Approved" : "Changes Requested for Your Project",
        html: projectApprovalEmail(student.name, project.title, action === "approve", comments),
      }).catch(() => {});
    }

    res.json({ success: true, data: updated });
  })
);

// PATCH /api/showcase/:id
router.patch(
  "/:id",
  authenticate,
  requireRole("student_author", "admin"),
  uploadShowcaseFiles,
  validateBody(showcaseUpdateSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const body = req.body as z.infer<typeof showcaseUpdateSchema>;
    const files = req.files as { file?: Express.Multer.File[]; video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] } | undefined;
    const reportFile = files?.file?.[0];
    const videoFile = files?.video?.[0];
    const thumbnailFile = files?.thumbnail?.[0];

    // 1. Fetch current project to verify ownership and review status
    const project = await queryOne<{
      project_id: string;
      submitted_by: string;
      status: string;
      report_url: string | null;
      video_url: string | null;
      thumbnail_url: string | null;
    }>("SELECT project_id, submitted_by, status, report_url, video_url, thumbnail_url FROM student_projects WHERE project_id = $1", [id]);

    if (!project) throw new AppError(404, "Project not found");
    if (project.submitted_by !== req.user!.user_id && req.user!.role !== "admin") {
      throw new AppError(403, "You can only edit your own submissions");
    }
    if (project.status === "published" && req.user!.role !== "admin") {
      throw new AppError(400, "Approved projects cannot be edited. Please contact your advisor.");
    }

    // 2. Parse fields
    const title = body.title;
    const abstract = body.abstract;
    const advisor_id = body.advisor_id;
    const semester = body.semester;
    const department = body.department;
    const source_code_url = body.source_code_url;

    let team_members: unknown[] | undefined;
    let technologies: string[] | undefined;

    if (body.team_members) {
      try {
        const tm = body.team_members;
        team_members = typeof tm === "string" ? JSON.parse(tm) : Array.isArray(tm) ? tm : [];
      } catch {
        throw new AppError(400, "Invalid team_members format");
      }
    }

    if (body.technologies) {
      try {
        const tech = body.technologies;
        technologies = typeof tech === "string" ? JSON.parse(tech) : Array.isArray(tech) ? tech : [];
      } catch {
        throw new AppError(400, "Invalid technologies format");
      }
    }

    let report_url = project.report_url;
    if (reportFile) {
      const key = generateS3Key("showcase/reports", reportFile.originalname, reportFile.mimetype);
      await uploadToS3(key, reportFile.buffer, reportFile.mimetype);
      report_url = key;
    }

    let video_url = project.video_url;
    if (videoFile) {
      if (!videoFile.mimetype.startsWith("video/")) {
        throw new AppError(400, "Demo video must be a video file");
      }
      const key = generateS3Key("showcase/videos", videoFile.originalname, videoFile.mimetype);
      await uploadToS3(key, videoFile.buffer, videoFile.mimetype);
      video_url = key;
    }

    let thumbnail_url = project.thumbnail_url;
    if (thumbnailFile) {
      if (!thumbnailFile.mimetype.startsWith("image/")) {
        throw new AppError(400, "Thumbnail must be an image file");
      }
      const key = generateS3Key("showcase/thumbnails", thumbnailFile.originalname, thumbnailFile.mimetype);
      await uploadToS3(key, thumbnailFile.buffer, thumbnailFile.mimetype);
      thumbnail_url = key;
    }

    // 3. Build dynamic update query
    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (title !== undefined) { updates.push(`title = $${idx++}`); params.push(title); }
    if (abstract !== undefined) { updates.push(`abstract = $${idx++}`); params.push(abstract); }
    if (advisor_id !== undefined) { updates.push(`advisor_id = $${idx++}`); params.push(advisor_id); }
    if (semester !== undefined) { updates.push(`semester = $${idx++}`); params.push(semester); }
    if (department !== undefined) { updates.push(`department = $${idx++}`); params.push(department); }
    if (source_code_url !== undefined) { updates.push(`source_code_url = $${idx++}`); params.push(source_code_url || null); }
    if (team_members !== undefined) { updates.push(`team_members = $${idx++}`); params.push(JSON.stringify(team_members)); }
    if (technologies !== undefined) { updates.push(`technologies = $${idx++}`); params.push(technologies); }
    if (report_url !== undefined) { updates.push(`report_url = $${idx++}`); params.push(report_url); }
    if (video_url !== undefined) { updates.push(`video_url = $${idx++}`); params.push(video_url); }
    if (thumbnail_url !== undefined) { updates.push(`thumbnail_url = $${idx++}`); params.push(thumbnail_url); }

    // Reset status to pending_review when student edits/re-submits
    updates.push(`status = $${idx++}`);
    params.push("pending_review");

    params.push(id);
    const queryStr = `UPDATE student_projects SET ${updates.join(", ")} WHERE project_id = $${idx} RETURNING *`;
    const updatedProject = await queryOne(queryStr, params);

    res.json({ success: true, data: updatedProject });
  })
);

export default router;
