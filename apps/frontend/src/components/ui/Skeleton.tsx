import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-3/4" : "w-full")} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-md border p-4 space-y-3", className)}
      style={{ background: "var(--color-canvas-default)", borderColor: "var(--color-border-default)" }}
      aria-hidden="true"
    >
      <div className="flex items-start gap-3">
        <Skeleton className="w-8 h-8 rounded-md flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-2 px-4">
          <Skeleton className={cn("h-3.5", i === 0 ? "w-32" : i === cols - 1 ? "w-16" : "w-24")} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonStatCard() {
  return (
    <div
      className="rounded-md border p-4 flex items-center gap-3"
      style={{ background: "var(--color-canvas-default)", borderColor: "var(--color-border-default)" }}
      aria-hidden="true"
    >
      <Skeleton className="w-10 h-10 rounded-md flex-shrink-0" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
