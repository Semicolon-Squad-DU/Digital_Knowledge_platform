"use client";

import { Download, FileText } from "lucide-react";
import { useParams } from "next/navigation";
import { useArchiveItem, useArchiveVersions, useDownloadArchiveItem } from "@/features/archive/hooks/useArchive";
import { Button } from "@/components/ui/Button";
import { formatDate, formatFileSize, getAccessTierBadge, getStatusBadge } from "@/lib/utils";
import toast from "react-hot-toast";

const shell = "rounded-xl border border-outline-variant bg-surface-container p-6";

export default function ArchiveItemPage() {
  const params = useParams<{ id: string }>();
  const itemId = params?.id ?? "";

  const { data: item, isLoading } = useArchiveItem(itemId);
  const { data: versions } = useArchiveVersions(itemId);
  const { mutateAsync: download, isPending } = useDownloadArchiveItem();

  const handleDownload = async () => {
    try {
      const url = await download(itemId);
      window.open(url, "_blank");
    } catch {
      toast.error("Download failed or access denied");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-on-surface-variant">Loading item...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-on-surface-variant">
          Archive item not found.
        </div>
      </div>
    );
  }

  const tier = getAccessTierBadge(item.access_tier);
  const status = getStatusBadge(item.status);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`${shell} mb-4`}>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="font-display text-2xl font-medium text-on-surface tracking-tight">{item.title_en}</h1>
              {item.title_bn && <p className="text-on-surface-variant mt-1">{item.title_bn}</p>}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tier.color}`}>{tier.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
            </div>
          </div>

          {item.description && <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">{item.description}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-on-surface-variant mb-4">
            <p>
              <span className="font-medium text-on-surface">Authors:</span> {item.authors?.join(", ") || "N/A"}
            </p>
            <p>
              <span className="font-medium text-on-surface">Category:</span> {item.category}
            </p>
            <p>
              <span className="font-medium text-on-surface">Language:</span> {item.language}
            </p>
            <p>
              <span className="font-medium text-on-surface">Size:</span> {formatFileSize(item.file_size)}
            </p>
            <p>
              <span className="font-medium text-on-surface">Created:</span> {formatDate(item.created_at)}
            </p>
            <p>
              <span className="font-medium text-on-surface">Updated:</span> {formatDate(item.updated_at)}
            </p>
          </div>

          <Button onClick={handleDownload} disabled={item.status !== "published"} loading={isPending}>
            <Download size={16} /> Download
          </Button>
        </div>

        <div className={shell}>
          <h2 className="font-display text-lg font-medium text-on-surface mb-3">Versions</h2>
          {!versions?.length ? (
            <p className="text-sm text-on-surface-variant">No version history available.</p>
          ) : (
            <ul className="space-y-2">
              {versions.map((version: { version_id: string; version_number: number; created_at: string }) => (
                <li
                  key={version.version_id}
                  className="flex items-center justify-between text-sm border-b border-outline-variant pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 text-on-surface">
                    <FileText size={14} className="text-on-surface-variant" /> Version {version.version_number}
                  </div>
                  <span className="text-on-surface-variant">{formatDate(version.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
