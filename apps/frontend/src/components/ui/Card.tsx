import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  as?: "div" | "article" | "section";
}

export function Card({ children, className, padding = "md", as: Tag = "div" }: CardProps) {
  const paddings = { none: "", sm: "p-3", md: "p-4", lg: "p-6" };
  return (
    <Tag className={cn("gh-box", paddings[padding], className)}>
      {children}
    </Tag>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("gh-box-header flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-sm font-semibold", className)} style={{ color: "var(--color-fg-default)" }}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm mt-0.5", className)} style={{ color: "var(--color-fg-muted)" }}>
      {children}
    </p>
  );
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("mt-3 pt-3 flex items-center justify-between", className)}
      style={{ borderTop: "1px solid var(--color-border-default)" }}
    >
      {children}
    </div>
  );
}
