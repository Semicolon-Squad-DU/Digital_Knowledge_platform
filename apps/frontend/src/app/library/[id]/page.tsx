"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen, MapPin, Bookmark, QrCode } from "lucide-react";
import { useCatalogItem, useAddToWishlist, usePlaceHold } from "@/features/library/hooks/useLibrary";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import toast from "react-hot-toast";

export default function LibraryItemPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const itemId = params?.id ?? "";
  const loginHref = `/login?returnUrl=${encodeURIComponent(pathname || `/library/${itemId}`)}`;

  const { data: item, isLoading } = useCatalogItem(itemId);
  const { isAuthenticated } = useAuthStore();
  const { mutateAsync: addToWishlist, isPending: wishlistPending } = useAddToWishlist();
  const { mutateAsync: placeHold, isPending: holdPending } = usePlaceHold();

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to use wishlist");
      return;
    }

    try {
      await addToWishlist(itemId);
      toast.success("Added to wishlist");
    } catch {
      toast.error("Already in wishlist");
    }
  };

  const handleHold = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to place a hold");
      return;
    }

    try {
      await placeHold(itemId);
      toast.success("Hold placed successfully");
    } catch {
      toast.error("Could not place hold");
    }
  };

  const handleBorrow = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to borrow");
      return;
    }
    toast.success("Borrow request submitted");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-sm text-on-surface-variant animate-pulse">
          Retrieving catalog records...
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-sm text-error">Catalog record not located.</div>
      </div>
    );
  }

  const isAvailable = item.available_copies > 0;
  const mockShelf = item.catalog_id ? item.catalog_id.substring(0, 3).toUpperCase() : "A1X";

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-10">
        <PageHeader
          title="Volume Details"
          subtitle="Library Catalog Reference"
          breadcrumb={[{ label: "Home", href: "/" }, { label: "Library", href: "/library" }, { label: "Details" }]}
        />

        <div className="max-w-5xl mx-auto mt-6">
          <div className="rounded-xl border border-outline-variant bg-surface-container overflow-hidden shadow-sm">
            <div className="flex flex-col md:flex-row gap-8 p-8 md:p-10">
              <div className="md:w-56 shrink-0">
                <div className="aspect-[2/3] bg-surface-container-high border border-outline-variant rounded-lg flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 to-transparent" />
                  <BookOpen
                    size={44}
                    className="text-on-surface-variant/40 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
                    <p className="text-[10px] uppercase tracking-widest text-center text-on-primary-fixed/90">Vol. {mockShelf}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                <div className="mb-6 flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h1 className="font-display text-3xl md:text-4xl font-medium text-on-surface tracking-tight leading-tight mb-2">
                      {item.title}
                    </h1>
                    {!!item.authors?.length && (
                      <p className="text-sm text-on-surface-variant tracking-wide">By {item.authors.join(", ")}</p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">Status</p>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium border rounded-full ${
                        isAvailable
                          ? "bg-tertiary/10 border-tertiary/30 text-tertiary"
                          : "bg-surface-container-high border-outline-variant text-on-surface-variant"
                      }`}
                    >
                      {isAvailable ? `${item.available_copies} of ${item.total_copies} available` : "On loan"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 text-sm border-b border-outline-variant pb-6">
                  {[
                    { k: "ISBN", v: item.isbn || "N/A" },
                    { k: "Publication year", v: item.year || "Unknown" },
                    { k: "Category", v: item.category || "General" },
                    { k: "Publisher", v: "University Press" },
                  ].map((row) => (
                    <div key={row.k}>
                      <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant">{row.k}</span>
                      <span className="text-on-surface">{row.v}</span>
                    </div>
                  ))}
                </div>

                {!!item.description && (
                  <div className="mb-8">
                    <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">Synopsis</span>
                    <p className="text-sm text-on-surface-variant leading-relaxed border-l-2 border-primary/40 pl-3">
                      {item.description}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-auto pt-4 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant">Shelf location</span>
                      <span className="text-on-surface font-medium">Stack {mockShelf}, row 4</span>
                    </div>
                  </div>

                  <div className="flex items-end gap-3 opacity-70">
                    <div className="text-right">
                      <span className="block text-[8px] font-mono uppercase tracking-widest text-on-surface-variant">
                        Ref: {itemId.substring(0, 8)}
                      </span>
                      <div
                        className="h-6 w-32 border-l border-r border-on-surface-variant/40 relative overflow-hidden mt-1"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(90deg, currentColor 0, currentColor 1px, transparent 1px, transparent 3px, currentColor 3px, currentColor 5px, transparent 5px, transparent 7px)",
                        }}
                      />
                    </div>
                    <QrCode size={24} className="text-on-surface-variant" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <>
                <Button onClick={handleBorrow} disabled={!isAvailable}>
                  Borrow now
                </Button>

                {!isAvailable && (
                  <Button variant="outline" onClick={handleHold} loading={holdPending}>
                    Place hold
                  </Button>
                )}

                <Button variant="outline" onClick={handleWishlist} loading={wishlistPending} className="gap-2">
                  <Bookmark size={16} />
                  Wishlist
                </Button>
              </>
            ) : (
              <p className="text-sm text-on-surface-variant text-center max-w-md">
                <Link href={loginHref} className="text-primary font-medium hover:text-primary-fixed hover:underline">
                  Sign in
                </Link>{" "}
                to borrow books, place holds, or use your wishlist.
              </p>
            )}
          </div>

          <div className="mt-14 border-t border-outline-variant pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-medium text-on-surface">Related volumes</h3>
              <Link
                href={`/library?category=${encodeURIComponent(item.category || "")}`}
                className="text-sm text-primary hover:text-primary-fixed"
              >
                View category →
              </Link>
            </div>

            <div className="flex overflow-x-auto pb-6 gap-5 snap-x hide-scrollbar">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="shrink-0 w-44 snap-center">
                  <div className="aspect-[2/3] bg-surface-container-high border border-outline-variant rounded-lg mb-3 flex items-center justify-center group overflow-hidden relative">
                    <BookOpen
                      size={22}
                      className="text-on-surface-variant/50 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-sm text-on-surface line-clamp-1">Related title {i}</h4>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mt-1">Catalog</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
