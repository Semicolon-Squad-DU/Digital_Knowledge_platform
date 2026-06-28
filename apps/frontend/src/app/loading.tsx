export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent-fg)] border-t-transparent"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
