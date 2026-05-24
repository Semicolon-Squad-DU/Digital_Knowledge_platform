"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, BookOpen, Trash2, BookMarked, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useWishlist, useRemoveFromWishlist, usePlaceHold } from "@/hooks/useLibrary";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const { data: wishlist, isLoading, refetch } = useWishlist();
  const { mutateAsync: removeFromWishlist, isPending: isRemoving } = useRemoveFromWishlist();
  const { mutateAsync: placeHold, isPending: isHolding } = usePlaceHold();

  const handleRemove = async (catalogId: string, title: string) => {
    try {
      await removeFromWishlist(catalogId);
      toast.success(`"${title}" removed from wishlist`);
      refetch();
    } catch {
      toast.error("Failed to remove from wishlist");
    }
  };

  const handleHold = async (catalogId: string) => {
    try {
      await placeHold(catalogId);
      toast.success("Hold placed — you'll be notified when available");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Could not place hold");
    }
  };

  if (!user) return null;

  return (
    <div className="page-container py-8 max-w-4xl">
      <PageHeader
        title="My Wishlist"
        subtitle="Books you've saved to read later"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Library", href: "/library" },
          { label: "Wishlist" },
        ]}
        actions={
          <Link href="/library">
            <Button variant="outline" size="sm" icon={<BookOpen size={13} />}>
              Browse Catalog
            </Button>
          </Link>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && (!wishlist || wishlist.length === 0) && (
        <EmptyState
          icon={<Heart size={28} />}
          title="Your wishlist is empty"
          description="Browse the library catalog and click the heart icon to save books here."
          action={{ label: "Browse Catalog", onClick: () => router.push("/library"), variant: "primary" }}
        />
      )}

      {!isLoading && wishlist && wishlist.length > 0 && (
        <div className="space-y-3">
          {wishlist.map((item: {
            wishlist_id: string;
            catalog_id: string;
            title: string;
            authors: string[];
            available_copies: number;
            added_at: string;
          }) => {
            const isAvailable = item.available_copies > 0;
            return (
              <div key={item.wishlist_id} className="gh-box p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--gradient-accent)" }}
                  >
                    <BookOpen size={20} className="text-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/library/${item.catalog_id}`}
                      className="font-semibold text-sm hover:underline line-clamp-2"
                      style={{ color: "var(--color-fg-default)" }}
                    >
                      {item.title}
                    </Link>
                    {item.authors?.length > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-fg-muted)" }}>
                        {item.authors.slice(0, 2).join(", ")}
                      </p>
                    )}
                    <span
                      className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: isAvailable ? "var(--color-success-subtle)" : "var(--color-danger-subtle)",
                        color:      isAvailable ? "var(--color-success-fg)"     : "var(--color-danger-fg)",
                      }}
                    >
                      {isAvailable ? `${item.available_copies} available` : "All copies on loan"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isAvailable && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<BookMarked size={13} />}
                        onClick={() => handleHold(item.catalog_id)}
                        loading={isHolding}
                      >
                        Place Hold
                      </Button>
                    )}
                    {isAvailable && (
                      <Link href={`/library/${item.catalog_id}`}>
                        <Button variant="primary" size="sm" icon={<ArrowRight size={13} />}>
                          View
                        </Button>
                      </Link>
                    )}
                    <button
                      onClick={() => handleRemove(item.catalog_id, item.title)}
                      disabled={isRemoving}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: "var(--color-fg-muted)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--color-danger-fg)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--color-fg-muted)")}
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
