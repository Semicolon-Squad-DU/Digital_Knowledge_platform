import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  className?: string;
}

export function PageHeader({ title, subtitle, actions, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn("page-header", className)}>
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs mb-2" style={{ color: "var(--color-fg-muted)" }} aria-label="Breadcrumb">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="transition-colors hover:underline" style={{ color: "var(--color-fg-muted)" }}>
                    {crumb.label}
                  </a>
                ) : (
                  <span className="font-medium" style={{ color: "var(--color-fg-default)" }}>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
