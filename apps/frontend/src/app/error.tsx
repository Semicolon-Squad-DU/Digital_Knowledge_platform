"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-[var(--color-fg-default)]">Something went wrong</h1>
      <p className="max-w-md text-sm text-[var(--color-fg-muted)]">
        An unexpected error occurred while loading this page. You can try again, or head back to the homepage.
      </p>
      <div className="flex gap-3 pt-2">
        <button
          onClick={reset}
          className="rounded-lg border border-[var(--color-border-default)] px-4 py-2 text-sm font-medium text-[var(--color-fg-default)] hover:bg-[var(--color-canvas-subtle)]"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-lg bg-[var(--color-accent-fg)] px-4 py-2 text-sm font-medium text-white"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
