import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "n/a";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "n/a";
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "n/a";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "n/a";
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "n/a";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "n/a";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str;
}

export function getFileIcon(mimeType: string | null | undefined): string {
  if (!mimeType) return "📁";
  const type = String(mimeType).toLowerCase();
  if (type.includes("pdf")) return "📄";
  if (type.includes("word") || type.includes("document") || type.includes("msword")) return "📝";
  if (type.includes("image")) return "🖼️";
  if (type.includes("audio")) return "🎵";
  if (type.includes("video")) return "🎬";
  return "📁";
}

export function getAccessTierBadge(tier: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    public: { label: "Public", color: "bg-tertiary/15 text-tertiary border border-tertiary/30" },
    member: { label: "Members", color: "bg-primary/15 text-primary border border-primary/30" },
    staff: { label: "Staff", color: "bg-primary-container/40 text-primary-fixed border border-primary/25" },
    restricted: { label: "Restricted", color: "bg-error/15 text-error border border-error/30" },
  };
  return map[tier] ?? { label: tier, color: "bg-surface-container-high text-on-surface-variant border border-outline-variant" };
}

export function getStatusBadge(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: "Draft", color: "bg-surface-container-high text-on-surface-variant border border-outline-variant" },
    review: { label: "In Review", color: "bg-primary/15 text-primary border border-primary/25" },
    published: { label: "Published", color: "bg-tertiary/15 text-tertiary border border-tertiary/30" },
    archived: { label: "Archived", color: "bg-surface-container-high text-on-surface-variant border border-outline-variant" },
    pending_review: { label: "Pending Review", color: "bg-primary/15 text-primary border border-primary/25" },
    changes_requested: { label: "Changes Requested", color: "bg-error/15 text-error border border-error/25" },
    active: { label: "Active", color: "bg-tertiary/15 text-tertiary border border-tertiary/30" },
    returned: { label: "Returned", color: "bg-surface-container-high text-on-surface-variant border border-outline-variant" },
    overdue: { label: "Overdue", color: "bg-error/15 text-error border border-error/30" },
  };
  return map[status] ?? { label: status, color: "bg-surface-container-high text-on-surface-variant border border-outline-variant" };
}
