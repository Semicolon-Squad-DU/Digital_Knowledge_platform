import Link from "next/link";

const links = [
  { href: "#", label: "Editorial Policy" },
  { href: "#", label: "Archive Standards" },
  { href: "#", label: "Open Access" },
  { href: "#", label: "Terms of Research" },
] as const;

export function VaultFooter() {
  return (
    <footer className="bg-surface-container-lowest border-t-4 border-outline-variant mt-auto">
      <div className="page-container grid grid-cols-1 md:grid-cols-4 gap-8 px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="md:col-span-1">
          <span className="text-xl md:text-2xl font-display font-black uppercase tracking-widest text-on-surface block mb-4">
            DKP // ARCHIVE
          </span>
          <p className="font-body text-sm leading-relaxed text-on-surface-variant max-w-sm">
            © {new Date().getFullYear()} University Digital Knowledge Platform. All rights reserved. Built for discovery, lending, and open scholarship.
          </p>
        </div>
        <div className="md:col-span-3 flex flex-wrap gap-x-8 gap-y-3 md:justify-end items-start">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-on-surface-variant hover:text-primary underline text-sm font-body transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
