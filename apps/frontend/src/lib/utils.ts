import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
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

export function getFileIcon(mimeType: string): string {
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("image")) return "🖼️";
  if (mimeType.includes("audio")) return "🎵";
  if (mimeType.includes("video")) return "🎬";
  return "📁";
}

export function getAccessTierBadge(tier: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    public: { label: "Public", color: "bg-green-100 text-green-800" },
    member: { label: "Members", color: "bg-blue-100 text-blue-800" },
    staff: { label: "Staff", color: "bg-purple-100 text-purple-800" },
    restricted: { label: "Restricted", color: "bg-red-100 text-red-800" },
  };
  return map[tier] ?? { label: tier, color: "bg-gray-100 text-gray-800" };
}

export function getStatusBadge(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: "Draft", color: "bg-gray-100 text-gray-700" },
    review: { label: "In Review", color: "bg-yellow-100 text-yellow-800" },
    published: { label: "Published", color: "bg-green-100 text-green-800" },
    archived: { label: "Archived", color: "bg-slate-100 text-slate-700" },
    pending_review: { label: "Pending Review", color: "bg-yellow-100 text-yellow-800" },
    changes_requested: { label: "Changes Requested", color: "bg-orange-100 text-orange-800" },
    active: { label: "Active", color: "bg-green-100 text-green-800" },
    returned: { label: "Returned", color: "bg-gray-100 text-gray-700" },
    overdue: { label: "Overdue", color: "bg-red-100 text-red-800" },
  };
  return map[status] ?? { label: status, color: "bg-gray-100 text-gray-800" };
}
