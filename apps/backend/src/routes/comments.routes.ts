import { Router, Response } from "express";
import { query, queryOne } from "../core/db/pool";
import { authenticate, optionalAuth, AuthRequest } from "../core/middleware/auth.middleware";
import { AppError, asyncHandler } from "../core/middleware/error.middleware";

const router = Router();

// GET /api/comments/:entityType/:entityId
router.get(
  "/:entityType/:entityId",
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { entityType, entityId } = req.params;
    const userRole = req.user?.role;

    let commentsList;
    if (userRole === "admin") {
      commentsList = await query<any>(
        `SELECT c.*, u.name as user_name, u.role as user_role
         FROM comments c
         JOIN users u ON c.user_id = u.user_id
         WHERE c.entity_type = $1 AND c.entity_id = $2
         ORDER BY c.created_at ASC`,
        [entityType, entityId]
      );
    } else {
      commentsList = await query<any>(
        `SELECT c.*, u.name as user_name, u.role as user_role
         FROM comments c
         JOIN users u ON c.user_id = u.user_id
         WHERE c.entity_type = $1 AND c.entity_id = $2 AND c.is_hidden = FALSE
         ORDER BY c.created_at ASC`,
        [entityType, entityId]
      );
    }

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

// PATCH /api/comments/:id/moderate — Moderate comment
router.patch(
  "/:id/moderate",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { isFlagged, isHidden } = req.body;
    const userRole = req.user!.role;

    if (userRole !== "admin") {
      throw new AppError(403, "Moderation is restricted to administrators");
    }

    const comment = await queryOne<any>(
      `UPDATE comments
       SET is_flagged = COALESCE($1, is_flagged),
           is_hidden = COALESCE($2, is_hidden),
           updated_at = NOW()
       WHERE comment_id = $3
       RETURNING *`,
      [isFlagged !== undefined ? isFlagged : null, isHidden !== undefined ? isHidden : null, id]
    );

    if (!comment) throw new AppError(404, "Comment not found");

    res.json({
      success: true,
      data: comment,
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
