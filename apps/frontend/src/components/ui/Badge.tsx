import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "done" | "sponsors" | "outline";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: BadgeVariant;
}

const styles: Record<BadgeVariant, string> = {
  default:  "bg-[var(--color-neutral-subtle)] text-[var(--color-fg-muted)] border-[var(--color-border-default)]",
  primary:  "bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)] border-[rgba(9,105,218,0.2)]",
  success:  "bg-[var(--color-success-subtle)] text-[var(--color-success-fg)] border-[rgba(26,127,55,0.2)]",
  warning:  "bg-[var(--color-attention-subtle)] text-[var(--color-attention-fg)] border-[rgba(154,103,0,0.2)]",
  danger:   "bg-[var(--color-danger-subtle)] text-[var(--color-danger-fg)] border-[rgba(209,36,47,0.2)]",
  done:     "bg-[var(--color-done-subtle)] text-[var(--color-done-fg)] border-[rgba(130,80,223,0.2)]",
  sponsors: "bg-[var(--color-sponsors-subtle)] text-[var(--color-sponsors-fg)] border-[rgba(191,57,137,0.2)]",
  outline:  "bg-transparent text-[var(--color-fg-muted)] border-[var(--color-border-default)]",
};

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Maps domain access tiers */
export function AccessTierBadge({ tier }: { tier: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    public:     { label: "Public",     variant: "success" },
    member:     { label: "Members",    variant: "primary" },
    staff:      { label: "Staff",      variant: "done" },
    restricted: { label: "Restricted", variant: "danger" },
  };
  const { label, variant } = map[tier] ?? { label: tier, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}

/** Maps domain statuses */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    draft:             { label: "Draft",             variant: "default" },
    review:            { label: "In Review",         variant: "warning" },
    published:         { label: "Published",         variant: "success" },
    archived:          { label: "Archived",          variant: "default" },
    pending_review:    { label: "Pending Review",    variant: "warning" },
    changes_requested: { label: "Changes Requested", variant: "danger" },
    active:            { label: "Active",            variant: "success" },
    returned:          { label: "Returned",          variant: "default" },
    overdue:           { label: "Overdue",           variant: "danger" },
    pending:           { label: "Pending",           variant: "warning" },
    approved:          { label: "Approved",          variant: "success" },
    denied:            { label: "Denied",            variant: "danger" },
    available:         { label: "Available",         variant: "success" },
    suspended:         { label: "Suspended",         variant: "danger" },
    inactive:          { label: "Inactive",          variant: "default" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}
