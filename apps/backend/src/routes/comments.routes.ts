import { Router, Response } from "express";
import { query, queryOne } from "../db/pool";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { AppError, asyncHandler } from "../middleware/error.middleware";

const router = Router();

// GET /api/comments/:entityType/:entityId
router.get(
  "/:entityType/:entityId",
  asyncHandler(async (req, res: Response) => {
    const { entityType, entityId } = req.params;

    const commentsList = await query<any>(
      `SELECT c.*, u.name as user_name, u.role as user_role
       FROM comments c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.entity_type = $1 AND c.entity_id = $2
       ORDER BY c.created_at ASC`,
      [entityType, entityId]
    );

    res.json({
      success: true,
      data: commentsList,
    });
  })
);

// POST /api/comments
router.post(
  "/",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { entityType, entityId, parentId, content } = req.body;
    const userId = req.user!.user_id;

    if (!content?.trim()) {
      throw new AppError(400, "Comment content is required");
    }

    const newComment = await queryOne<any>(
      `INSERT INTO comments (user_id, entity_type, entity_id, parent_id, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, entityType, entityId, parentId || null, content.trim()]
    );

    // Fetch comment with user info
    const fullComment = await queryOne<any>(
      `SELECT c.*, u.name as user_name, u.role as user_role
       FROM comments c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.comment_id = $1`,
      [newComment.comment_id]
    );

    res.status(201).json({
      success: true,
      data: fullComment,
    });
  })
);

// DELETE /api/comments/:id
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const commentId = req.params.id;
    const userId = req.user!.user_id;
    const userRole = req.user!.role;

    const existing = await queryOne<any>(
      `SELECT * FROM comments WHERE comment_id = $1`,
      [commentId]
    );

    if (!existing) {
      throw new AppError(404, "Comment not found");
    }

    // Only owner or admin can delete
    if (existing.user_id !== userId && userRole !== "admin") {
      throw new AppError(403, "Not authorized to delete this comment");
    }

    await query("DELETE FROM comments WHERE comment_id = $1", [commentId]);

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  })
);

export default router;
