"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Heart, BookMarked, ArrowLeft,
  Building2, Calendar, Hash, Layers,
  MapPin, Copy, CheckCircle, Clock, FileText,
} from "lucide-react";
import { useCatalogItem, useAddToWishlist, usePlaceHold } from "@/hooks/useLibrary";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// PDF Preview — fetches presigned URL then embeds in iframe
// ---------------------------------------------------------------------------
function PdfPreview({ pdfKey }: { pdfKey: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    api.get("/archive/download-url", { params: { key: pdfKey } })
      .then(({ data }) => {
        if (!cancelled) setUrl(data.data.url);
      })
      .catch(() => {
        if (!cancelled) {
          // Fallback to direct MinIO URL
          setUrl(`http://localhost:9000/dkp-files/${pdfKey}`);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [pdfKey]);

  if (loading) {
    return (
      <div className="h-96 rounded-xl bg-[var(--color-canvas-subtle)] border border-[var(--color-border-default)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-accent-fg)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-[var(--color-fg-muted)]">Loading preview…</p>
        </div>
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className="h-40 rounded-xl bg-[var(--color-canvas-subtle)] border border-[var(--color-border-default)] flex items-center justify-center">
        <p className="text-sm text-[var(--color-fg-muted)]">Preview unavailable</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--color-border-default)] bg-[var(--color-canvas-subtle)]">
      <iframe
        src={`${url}#page=1&view=FitH&toolbar=0`}
        className="w-full"
        style={{ height: "480px" }}
        title="PDF Preview"
        onError={() => setError(true)}
      />
    </div>
  );
}

export default function LibraryItemPage() {
  const params  = useParams<{ id: string }>();
  const router  = useRouter();
  const itemId  = params?.id ?? "";

  const { data: item, isLoading } = useCatalogItem(itemId);
  const { isAuthenticated, user } = useAuthStore();
  const { mutateAsync: addToWishlist, isPending: wishlistPending } = useAddToWishlist();
  const { mutateAsync: placeHold,    isPending: holdPending }      = usePlaceHold();
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error("Please sign in to use wishlist"); return; }
    try {
      await addToWishlist(itemId);
      toast.success("Added to wishlist");
    } catch {
      toast.error("Already in wishlist");
    }
  };

  const handleHold = async () => {
    if (!isAuthenticated) { toast.error("Please sign in to place a hold"); return; }
    try {
      await placeHold(itemId);
      toast.success("Hold placed — you'll be notified when available");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Could not place hold");
    }
  };

  const handleReadPdf = async (pdfKey: string) => {
    setPdfLoading(true);
    try {
      const { data } = await api.get("/archive/download-url", { params: { key: pdfKey } });
      window.open(data.data.url, "_blank");
    } catch {
      window.open(`http://localhost:9000/dkp-files/${pdfKey}`, "_blank");
      toast("Opening via direct link");
    } finally {
      setPdfLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container py-8 max-w-4xl">
        <SkeletonCard />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page-container py-16 text-center">
        <BookOpen size={36} className="mx-auto mb-3 text-[var(--color-fg-muted)]" />
        <p className="font-semibold text-[var(--color-fg-default)]">Book not found.</p>
        <button onClick={() => router.back()} className="text-sm text-[var(--color-accent-fg)] mt-2 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const isAvailable  = item.available_copies > 0;
  const isLibrarian  = ["librarian", "admin"].includes(user?.role ?? "");
  const availPercent = Math.round((item.available_copies / item.total_copies) * 100);
  const pdfKey       = item.cover_url; // PDF S3 key stored in cover_url column

  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-cyan-500 to-blue-600",
  ];
  const gradient = gradients[item.title.charCodeAt(0) % gradients.length];

  return (
    <div className="page-container py-8 max-w-4xl">
      <PageHeader
        title=""
        breadcrumb={[
          { label: "Home",    href: "/" },
          { label: "Library", href: "/library" },
          { label: item.title },
        ]}
      />

      <div className="gh-box overflow-hidden">
        {/* Hero */}
        <div className={cn("bg-gradient-to-br p-8 flex items-end gap-6", gradient)}>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl font-bold text-white leading-tight">{item.title}</h1>
            {item.authors?.length > 0 && (
              <p className="text-white/80 text-sm mt-1">{item.authors.join(", ")}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                isAvailable ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
              )}>
                {isAvailable ? <CheckCircle size={12} /> : <Clock size={12} />}
                {isAvailable
                  ? `${item.available_copies} of ${item.total_copies} available`
                  : "All copies on loan"}
              </span>
              {item.category && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                  {item.category}
                </span>
              )}
              {pdfKey && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white flex items-center gap-1">
                  <FileText size={11} /> PDF Available
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {/* Availability bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)] mb-1.5">
              <span>Availability</span>
              <span>{item.available_copies} / {item.total_copies} copies</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--color-canvas-inset)] overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", isAvailable ? "bg-green-500" : "bg-red-400")}
                style={{ width: `${availPercent}%` }}
              />
            </div>
          </div>

          {/* Description */}          {item.description && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-fg-default)] mb-2">About this book</h2>
              <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: Building2, label: "Publisher",      value: item.publisher },
              { icon: Calendar,  label: "Year",           value: item.year?.toString() },
              { icon: Hash,      label: "ISBN",           value: item.isbn },
              { icon: Layers,    label: "Edition",        value: item.edition },
              { icon: MapPin,    label: "Shelf Location", value: item.shelf_location },
              { icon: Copy,      label: "Total Copies",   value: item.total_copies?.toString() },
            ].filter(m => m.value).map((meta) => (
              <div key={meta.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--color-canvas-subtle)] border border-[var(--color-border-muted)]">
                <meta.icon size={14} className="mt-0.5 flex-shrink-0 text-[var(--color-accent-fg)]" />
                <div>
                  <p className="text-xs text-[var(--color-fg-muted)]">{meta.label}</p>
                  <p className="text-sm font-medium text-[var(--color-fg-default)] mt-0.5">{meta.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* PDF Preview — shown after metadata */}
          {pdfKey && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-fg-default)] mb-2 flex items-center gap-1.5">
                <FileText size={14} className="text-[var(--color-accent-fg)]" />
                PDF Preview
              </h2>
              <PdfPreview pdfKey={pdfKey} />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--color-border-muted)]">
            {pdfKey && (
              <Button
                variant="primary"
                onClick={() => handleReadPdf(pdfKey)}
                loading={pdfLoading}
                icon={<FileText size={14} />}
              >
                {pdfLoading ? "Opening…" : "Read PDF"}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleWishlist}
              loading={wishlistPending}
              icon={<Heart size={14} />}
            >
              Add to Wishlist
            </Button>

            {!isAvailable && (
              <Button
                variant="outline"
                onClick={handleHold}
                loading={holdPending}
                icon={<BookMarked size={14} />}
              >
                Place Hold
              </Button>
            )}

            {isAvailable && isAuthenticated && !isLibrarian && (
              <Button
                variant="outline"
                onClick={handleHold}
                loading={holdPending}
                icon={<BookMarked size={14} />}
              >
                Reserve
              </Button>
            )}

            <Button
              variant="invisible"
              onClick={() => router.back()}
              icon={<ArrowLeft size={14} />}
            >
              Back to Catalog
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
