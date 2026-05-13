import Link from "next/link";
import { ArchiveItem } from "@dkp/shared";
import { getFileIcon } from "@/lib/utils";

interface ArchiveVaultCardProps {
  item: ArchiveItem;
}

function yearFrom(iso: string) {
  try {
    return new Date(iso).getFullYear().toString();
  } catch {
    return "—";
  }
}

export function ArchiveVaultCard({ item }: ArchiveVaultCardProps) {
  const restricted = item.access_tier === "restricted";
  const published = item.status === "published";
  const blurb = item.description?.trim() || item.title_bn || "No abstract available for this record.";

  return (
    <Link href={`/archive/${item.item_id}`} className="block group">
      <article className="bg-surface gumroad-card flex flex-col h-full border-outline-variant">
        <div className="relative h-44 overflow-hidden border-b-2 border-outline-variant p-2 bg-surface-container">
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-4xl grayscale opacity-90 group-hover:opacity-100 transition-opacity">
            {getFileIcon(item.file_type)}
          </div>
          <div className="absolute top-3 right-3 bg-background border border-outline-variant px-2 py-0.5 text-xs font-mono text-on-surface">
            {yearFrom(item.created_at)}
          </div>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            {restricted ? (
              <>
                <span className="material-symbols-outlined text-error text-base">lock</span>
                <span className="text-xs font-mono text-error">Restricted</span>
              </>
            ) : published ? (
              <>
                <span className="w-2 h-2 rounded-full bg-tertiary shrink-0" />
                <span className="text-xs font-mono text-tertiary">Published</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-outline-variant shrink-0" />
                <span className="text-xs font-mono text-on-surface-variant capitalize">{item.status}</span>
              </>
            )}
          </div>
          <h2 className="text-lg font-bold text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {item.title_en}
          </h2>
          <p className="text-sm text-on-surface-variant mb-4 line-clamp-3 flex-1">{blurb}</p>
          <div className="mt-auto pt-4 border-t border-outline-variant flex items-center justify-between gap-2">
            <span className="text-xs text-on-surface-variant font-mono truncate">
              {item.category} · {item.item_id.slice(0, 8)}
            </span>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors shrink-0 text-xl">
              {restricted ? "lock" : "arrow_forward"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
