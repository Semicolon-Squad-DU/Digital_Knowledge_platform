import Link from "next/link";
import { BookOpen, Heart, BookMarked } from "lucide-react";
import { CatalogItem } from "@dkp/shared";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth.store";
import { useAddToWishlist, usePlaceHold } from "@/hooks/useLibrary";
import toast from "react-hot-toast";

interface CatalogCardProps {
  item: CatalogItem;
}

export function CatalogCard({ item }: CatalogCardProps) {
  const { isAuthenticated } = useAuthStore();
  const { mutateAsync: addToWishlist, isPending: wishlistPending } = useAddToWishlist();
  const { mutateAsync: placeHold, isPending: holdPending } = usePlaceHold();

  const isAvailable = item.available_copies > 0;

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error("Please sign in to use wishlist"); return; }
    try {
      await addToWishlist(item.catalog_id);
      toast.success("Added to wishlist");
    } catch {
      toast.error("Already in wishlist");
    }
  };

  const handleHold = async () => {
    if (!isAuthenticated) { toast.error("Please sign in to place a hold"); return; }
    try {
      await placeHold(item.catalog_id);
      toast.success("Hold placed successfully");
    } catch {
      toast.error("Could not place hold");
    }
  };

  return (
    <div className="surface p-5 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Cover placeholder */}
        <div
          className="flex-shrink-0 w-16 h-20 rounded-lg flex items-center justify-center"
          style={{ background: "var(--gradient-accent)" }}
        >
          <BookOpen className="text-white" size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <Link
            href={`/library/${item.catalog_id}`}
            className="font-semibold line-clamp-2 transition-colors hover:underline"
            style={{ color: "var(--color-fg-default)" }}
          >
            {item.title}
          </Link>

          {item.authors?.length > 0 && (
            <p className="text-sm mt-0.5" style={{ color: "var(--color-fg-muted)" }}>
              {item.authors.slice(0, 2).join(", ")}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "var(--color-fg-subtle)" }}>
            {item.year && <span>{item.year}</span>}
            {item.category && <span>• {item.category}</span>}
            {item.isbn && <span>• ISBN: {item.isbn}</span>}
          </div>

          <div className="flex items-center justify-between mt-3">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: isAvailable ? "var(--color-success-subtle)" : "var(--color-danger-subtle)",
                color:      isAvailable ? "var(--color-success-fg)"     : "var(--color-danger-fg)",
              }}
            >
              {isAvailable
                ? `${item.available_copies} of ${item.total_copies} available`
                : "All copies on loan"}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={handleWishlist}
                disabled={wishlistPending}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--color-fg-subtle)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-danger-fg)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-fg-subtle)")}
                aria-label="Add to wishlist"
              >
                <Heart size={16} />
              </button>
              {!isAvailable && (
                <Button variant="outline" size="sm" onClick={handleHold} loading={holdPending}>
                  <BookMarked size={14} /> Hold
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
