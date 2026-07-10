/**
 * Enforces the SDD's archive lifecycle: Draft → Review → Published → Archived.
 * Forward moves are allowed for any staff role permitted on the status route
 * (archivist/librarian/admin); backward moves ("regressions") are restricted
 * to Archivist/Admin per the SDD's data lifecycle notes.
 */
export const ARCHIVE_STATUSES = ["draft", "review", "published", "archived"] as const;
export type ArchiveStatus = (typeof ARCHIVE_STATUSES)[number];

const FORWARD_TRANSITIONS: Record<ArchiveStatus, ArchiveStatus[]> = {
  draft: ["review"],
  review: ["published"],
  published: ["archived"],
  archived: [],
};

const REGRESSION_TRANSITIONS: Record<ArchiveStatus, ArchiveStatus[]> = {
  draft: [],
  review: ["draft"],
  published: ["review", "draft"],
  archived: ["published"],
};

export type TransitionRule = "forward" | "regression" | "invalid";

export function getArchiveTransitionRule(from: string, to: string): TransitionRule {
  if (!ARCHIVE_STATUSES.includes(from as ArchiveStatus) || !ARCHIVE_STATUSES.includes(to as ArchiveStatus)) {
    return "invalid";
  }
  if (from === to) return "invalid";
  if (FORWARD_TRANSITIONS[from as ArchiveStatus].includes(to as ArchiveStatus)) return "forward";
  if (REGRESSION_TRANSITIONS[from as ArchiveStatus].includes(to as ArchiveStatus)) return "regression";
  return "invalid";
}
