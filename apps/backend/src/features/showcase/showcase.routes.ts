import { Router, Response } from "express";
import { query, queryOne } from "../../core/db/pool";
import { authenticate, requireRole, optionalAuth, AuthRequest } from "../../core/middleware/auth.middleware";
import { AppError, asyncHandler } from "../../core/middleware/error.middleware";
import { uploadSingle } from "../../core/middleware/upload.middleware";
import { uploadToS3, generateS3Key } from "../../infrastructure/s3.service";
import { sendEmail, projectApprovalEmail } from "../../infrastructure/email.service";

const router = Router();

// GET /api/showcase
router.get("/", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { department, semester, technology, advisor_id, q, page = "1", limit = "12" } =
    req.query as Record<string, string>;

  const conditions: string[] = ["sp.status = 'published'"];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (department) { conditions.push(`sp.department = $${paramIdx++}`); params.push(department); }
  if (semester) { conditions.push(`sp.semester = $${paramIdx++}`); params.push(semester); }
  if (technology) { conditions.push(`$${paramIdx++} = ANY(sp.technologies)`); params.push(technology); }
  if (advisor_id) { conditions.push(`sp.advisor_id = $${paramIdx++}`); params.push(advisor_id); }
  if (q) { conditions.push(`sp.title ILIKE $${paramIdx++}`); params.push(`%${q}%`); }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const whereClause = conditions.join(" AND ");

  const [{ count }] = await query<{ count: string }>(
    `SELECT COUNT(*) FROM student_projects sp WHERE ${whereClause}`,
    params
  );

  const projects = await query(
    `SELECT sp.project_id, sp.title, sp.abstract, sp.team_members, sp.semester,
            sp.department, sp.technologies, sp.thumbnail_url, sp.created_at,
            u.name as advisor_name
     FROM student_projects sp
     JOIN users u ON sp.advisor_id = u.user_id
     WHERE ${whereClause}
     ORDER BY sp.created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    [...params, parseInt(limit), offset]
  );

  res.json({
    success: true,
    data: {
      items: projects, total: parseInt(count),
      page: parseInt(page), limit: parseInt(limit),
      total_pages: Math.ceil(parseInt(count) / parseInt(limit)),
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
router.get("/:id", optionalAuth, asyncHandler(async (req, res: Response) => {
  const project = await queryOne(
    `SELECT sp.*, u.name as advisor_name, u.email as advisor_email,
            sub.name as submitted_by_name
     FROM student_projects sp
     JOIN users u ON sp.advisor_id = u.user_id
     JOIN users sub ON sp.submitted_by = sub.user_id
     WHERE sp.project_id = $1`,
    [req.params.id]
  );
  if (!project) throw new AppError(404, "Project not found");
  res.json({ success: true, data: project });
}));

// POST /api/showcase
router.post(
  "/",
  authenticate,
  requireRole("student_author", "admin"),
  uploadSingle,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = req.body as Record<string, unknown>;

    const title          = body.title as string;
    const abstract       = body.abstract as string;
    const advisor_id     = body.advisor_id as string;
    const semester       = body.semester as string;
    const department     = body.department as string;
    const source_code_url = body.source_code_url as string | undefined;

    if (!title || !abstract || !advisor_id || !semester || !department) {
      throw new AppError(400, "title, abstract, advisor_id, semester, department are required");
    }

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
    if (req.file) {
      const key = generateS3Key("showcase/reports", req.file.originalname, req.file.mimetype);
      await uploadToS3(key, req.file.buffer, req.file.mimetype);
      report_url = key;
    }

    const project = await queryOne(
      `INSERT INTO student_projects
         (title, abstract, team_members, advisor_id, semester, department, technologies, report_url, source_code_url, submitted_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        title, abstract,
        JSON.stringify(team_members),   // JSONB column
        advisor_id, semester, department,
        technologies,                   // TEXT[] column — pass array directly
        report_url, source_code_url || null,
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
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { action, comments } = req.body as { action: "approve" | "request_changes"; comments?: string };

    const project = await queryOne<{
      project_id: string; title: string; advisor_id: string; submitted_by: string; status: string;
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

export default router;
