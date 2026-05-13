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
    <Tag
      className={cn(
        "rounded-lg border border-outline-variant bg-surface-container shadow-sm",
        paddings[padding],
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-outline-variant bg-surface-container-high px-4 py-3",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-sm font-semibold text-on-surface", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm mt-0.5 text-on-surface-variant", className)}>
      {children}
    </p>
  );
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mt-3 pt-3 flex items-center justify-between border-t border-outline-variant", className)}>
      {children}
    </div>
  );
}
