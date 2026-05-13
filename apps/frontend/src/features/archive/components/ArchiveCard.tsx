import Link from "next/link";
import { Download, Eye, FileText } from "lucide-react";
import { ArchiveItem } from "@dkp/shared";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatFileSize, getAccessTierBadge, getStatusBadge, getFileIcon } from "@/lib/utils";

interface ArchiveCardProps {
  item: ArchiveItem;
  onDownload?: (id: string) => void;
}

export function ArchiveCard({ item, onDownload }: ArchiveCardProps) {
  const tierBadge = getAccessTierBadge(item.access_tier);
  const statusBadge = getStatusBadge(item.status);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-xl">
          {getFileIcon(item.file_type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                href={`/archive/${item.item_id}`}
                className="font-semibold text-gray-900 hover:text-primary-700 line-clamp-2 transition-colors"
              >
                {item.title_en}
              </Link>
              {item.title_bn && (
                <p className="text-sm text-gray-500 mt-0.5">{item.title_bn}</p>
              )}
            </div>
            <div className="flex-shrink-0 flex gap-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tierBadge.color}`}>
                {tierBadge.label}
              </span>
            </div>
          </div>

          {item.authors?.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {item.authors.slice(0, 3).join(", ")}
              {item.authors.length > 3 && ` +${item.authors.length - 3} more`}
            </p>
          )}

          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 4).map((tag) => (
                <span key={tag.tag_id} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {tag.name_en}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{formatDate(item.created_at)}</span>
              <span>{formatFileSize(item.file_size)}</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link href={`/archive/${item.item_id}`}>
                <Button variant="ghost" size="sm">
                  <Eye size={14} /> View
                </Button>
              </Link>
              {item.status === "published" && onDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownload(item.item_id)}
                >
                  <Download size={14} /> Download
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
