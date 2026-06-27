import { Router, Response } from "express";
import { query, queryOne } from "../core/db/pool";
import { authenticate, optionalAuth, AuthRequest } from "../core/middleware/auth.middleware";
import { AppError, asyncHandler } from "../core/middleware/error.middleware";

const router = Router();

// GET /api/reactions/:entityType/:entityId
router.get(
  "/:entityType/:entityId",
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { entityType, entityId } = req.params;
    const userId = req.user?.user_id;

    // Get aggregated counts of each reaction type for this entity
    const countRows = await query<any>(
      `SELECT reaction_type, COUNT(*) as count
       FROM reactions
       WHERE entity_type = $1 AND entity_id = $2
       GROUP BY reaction_type`,
      [entityType, entityId]
    );

    const counts: Record<string, number> = {
      like: 0,
      love: 0,
      clap: 0,
      insightful: 0,
    };

    countRows.forEach((row) => {
      counts[row.reaction_type] = parseInt(row.count);
    });

    // Get reactions that the current user has selected
    let userReactions: string[] = [];
    if (userId) {
      const userRows = await query<any>(
        `SELECT reaction_type
         FROM reactions
         WHERE entity_type = $1 AND entity_id = $2 AND user_id = $3`,
        [entityType, entityId, userId]
      );
      userReactions = userRows.map((row) => row.reaction_type);
    }

    res.json({
      success: true,
      data: {
        counts,
        userReactions,
      },
    });
  })
);

// POST /api/reactions/toggle
router.post(
  "/toggle",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { entityType, entityId, reactionType } = req.body;
    const userId = req.user!.user_id;

    const validTypes = ["like", "love", "clap", "insightful"];
    if (!validTypes.includes(reactionType)) {
      throw new AppError(400, "Invalid reaction type");
    }

    // Check if it exists
    const existing = await queryOne<any>(
      `SELECT * FROM reactions
       WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3 AND reaction_type = $4`,
      [userId, entityType, entityId, reactionType]
    );

    if (existing) {
      // Remove it (toggle off)
      await query(
        `DELETE FROM reactions
         WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3 AND reaction_type = $4`,
        [userId, entityType, entityId, reactionType]
      );

      res.json({
        success: true,
        data: {
          toggledOn: false,
        },
      });
    } else {
      // Insert it (toggle on)
      await query(
        `INSERT INTO reactions (user_id, entity_type, entity_id, reaction_type)
         VALUES ($1, $2, $3, $4)`,
        [userId, entityType, entityId, reactionType]
      );

      res.json({
        success: true,
        data: {
          toggledOn: true,
        },
      });
    }
  })
);

export default router;
