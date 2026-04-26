"use client";

import { Download, FileText } from "lucide-react";
import { useParams } from "next/navigation";
import { useArchiveItem, useArchiveVersions, useDownloadArchiveItem } from "@/hooks/useArchive";
import { Button } from "@/components/ui/Button";
import { formatDate, formatFileSize, getAccessTierBadge, getStatusBadge } from "@/lib/utils";
import toast from "react-hot-toast";

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
    return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">Loading item...</div>;
  }

  if (!item) {
    return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">Archive item not found.</div>;
  }

  const tier = getAccessTierBadge(item.access_tier);
  const status = getStatusBadge(item.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{item.title_en}</h1>
            {item.title_bn && <p className="text-slate-600 mt-1">{item.title_bn}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tier.color}`}>{tier.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
          </div>
        </div>

        {item.description && <p className="text-sm text-slate-700 mb-4">{item.description}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600 mb-4">
          <p><span className="font-medium text-slate-800">Authors:</span> {item.authors?.join(", ") || "N/A"}</p>
          <p><span className="font-medium text-slate-800">Category:</span> {item.category}</p>
          <p><span className="font-medium text-slate-800">Language:</span> {item.language}</p>
          <p><span className="font-medium text-slate-800">Size:</span> {formatFileSize(item.file_size)}</p>
          <p><span className="font-medium text-slate-800">Created:</span> {formatDate(item.created_at)}</p>
          <p><span className="font-medium text-slate-800">Updated:</span> {formatDate(item.updated_at)}</p>
        </div>

        <Button onClick={handleDownload} disabled={item.status !== "published"} loading={isPending}>
          <Download size={16} /> Download
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Versions</h2>
        {!versions?.length ? (
          <p className="text-sm text-slate-500">No version history available.</p>
        ) : (
          <ul className="space-y-2">
            {versions.map((version: { version_id: string; version_number: number; created_at: string }) => (
              <li key={version.version_id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                <div className="flex items-center gap-2 text-slate-700">
                  <FileText size={14} /> Version {version.version_number}
                </div>
                <span className="text-slate-500">{formatDate(version.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
