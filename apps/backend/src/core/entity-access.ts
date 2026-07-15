import { AccessTier } from "@dkp/shared";
import { queryOne } from "./db/pool";
import { canAccessTier } from "./access-control";

interface Requester {
  user_id: string;
  role: string;
}

/** Mirrors the visibility rules each entity's own GET /:id endpoint enforces, so
 *  comments/reactions can't be used to read restricted or unpublished items sideways
 *  (see archive.routes.ts, research.routes.ts, showcase.routes.ts for the source of truth). */
export async function canViewEntity(
  entityType: string,
  entityId: string,
  user: Requester | undefined
): Promise<boolean> {
  const role = user?.role ?? "guest";

  switch (entityType) {
    case "archive": {
      const item = await queryOne<{ access_tier: AccessTier; status: string }>(
        "SELECT access_tier, status FROM archive_items WHERE item_id = $1",
        [entityId]
      );
      if (!item) return false;
      if (item.status !== "published" && !["archivist", "librarian", "admin"].includes(role)) {
        return false;
      }
      if (canAccessTier(role, item.access_tier)) return true;
      if (!user) return false;
      const approved = await queryOne(
        `SELECT request_id FROM access_requests WHERE user_id = $1 AND item_id = $2 AND status = 'approved'`,
        [user.user_id, entityId]
      );
      return !!approved;
    }
    case "research": {
      const output = await queryOne<{ access_tier: AccessTier }>(
        "SELECT access_tier FROM research_outputs WHERE output_id = $1",
        [entityId]
      );
      if (!output) return false;
      return canAccessTier(role, output.access_tier);
    }
    case "project": {
      const project = await queryOne<{ status: string; advisor_id: string; submitted_by: string }>(
        "SELECT status, advisor_id, submitted_by FROM student_projects WHERE project_id = $1",
        [entityId]
      );
      if (!project) return false;
      if (project.status === "published") return true;
      if (!user) return false;
      return user.user_id === project.submitted_by || user.user_id === project.advisor_id || role === "admin";
    }
    default:
      // Unrecognized entity types fail closed rather than leaking by default.
      return false;
  }
}
