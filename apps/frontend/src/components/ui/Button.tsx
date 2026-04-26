import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "default" | "danger" | "outline" | "invisible" | "link";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", loading, disabled, children, icon, ...props }, ref) => {

    const base = [
      "inline-flex items-center justify-center font-medium rounded-md",
      "transition-colors duration-100",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-fg)] focus-visible:ring-offset-1",
      "disabled:opacity-60 disabled:cursor-not-allowed",
      "select-none whitespace-nowrap",
    ].join(" ");

    // GitHub button styles
    const variants: Record<string, string> = {
      // Green primary (GitHub uses green for primary CTAs)
      primary:
        "bg-[#1f883d] text-white border border-[rgba(31,35,40,0.15)] hover:bg-[#1a7f37] active:bg-[#187733] shadow-[0_1px_0_rgba(31,35,40,0.1),inset_0_1px_0_rgba(255,255,255,0.03)]",
      // Default gray
      default:
        "bg-[var(--color-canvas-subtle)] text-[var(--color-fg-default)] border border-[var(--color-border-default)] hover:bg-[var(--color-canvas-inset)] active:bg-[var(--color-canvas-subtle)] shadow-[0_1px_0_rgba(31,35,40,0.04),inset_0_1px_0_rgba(255,255,255,0.25)]",
      // Red danger
      danger:
        "bg-[var(--color-danger-emphasis)] text-white border border-[rgba(31,35,40,0.15)] hover:bg-[#a40e26] active:bg-[#8e0c22] shadow-[0_1px_0_rgba(31,35,40,0.1)]",
      // Outline
      outline:
        "bg-transparent text-[var(--color-accent-fg)] border border-[var(--color-accent-fg)] hover:bg-[var(--color-accent-subtle)] active:bg-[var(--color-accent-subtle)]",
      // Invisible / ghost
      invisible:
        "bg-transparent text-[var(--color-fg-default)] border border-transparent hover:bg-[var(--color-canvas-subtle)] hover:border-[var(--color-border-default)]",
      // Link style
      link:
        "bg-transparent text-[var(--color-accent-fg)] border border-transparent hover:underline p-0 h-auto",
    };

    const sizes: Record<string, string> = {
      sm: "px-3 py-1 text-xs gap-1.5 h-7",
      md: "px-3 py-1.5 text-sm gap-1.5 h-8",
      lg: "px-4 py-2 text-sm gap-2 h-10",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], variant !== "link" && sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
