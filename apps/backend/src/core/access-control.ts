import { AccessTier } from "@dkp/shared";

export const ALLOWED_TIERS_BY_ROLE: Record<string, AccessTier[]> = {
  guest: ["public"],
  member: ["public", "member"],
  student_author: ["public", "member"],
  researcher: ["public", "member", "staff"],
  archivist: ["public", "member", "staff", "restricted"],
  librarian: ["public", "member", "staff"],
  admin: ["public", "member", "staff", "restricted"],
};

export function getAllowedTiers(role: string | undefined): AccessTier[] {
  return ALLOWED_TIERS_BY_ROLE[role ?? "guest"] ?? ["public"];
}

export function canAccessTier(role: string | undefined, tier: AccessTier): boolean {
  return getAllowedTiers(role).includes(tier);
}
