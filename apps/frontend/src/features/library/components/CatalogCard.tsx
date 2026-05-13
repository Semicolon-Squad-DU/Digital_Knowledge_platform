import Link from "next/link";
import { Heart, BookMarked } from "lucide-react";
import { CatalogItem } from "@dkp/shared";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth.store";
import { useAddToWishlist, usePlaceHold } from "@/features/library/hooks/useLibrary";
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
    if (!isAuthenticated) {
      toast.error("Please sign in to use wishlist");
      return;
    }
    try {
      await addToWishlist(item.catalog_id);
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
      await placeHold(item.catalog_id);
      toast.success("Hold placed successfully");
    } catch {
      toast.error("Could not place hold");
    }
  };

  return (
    <div className="bg-surface-container border-2 border-outline-variant rounded-none p-5 transition-all duration-300 hover:border-primary/50 relative overflow-hidden group shadow-[2px_2px_0_0_#27272a]">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary z-10" aria-hidden />

      <div className="flex gap-5 pl-2">
        <div className="flex-shrink-0 w-[72px] h-[100px] bg-surface-container-high border border-outline-variant flex items-center justify-center relative overflow-hidden text-on-surface-variant text-[10px] font-mono uppercase tracking-widest text-center px-1">
          {item.catalog_id?.substring(0, 4) || "CAT"}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <Link
              href={`/library/${item.catalog_id}`}
              className="font-display font-semibold text-lg text-on-surface hover:text-primary line-clamp-2 transition-colors leading-tight"
            >
              {item.title}
            </Link>

            {item.authors?.length > 0 && (
              <p className="text-xs uppercase tracking-wider text-on-surface-variant mt-1.5 pt-1 border-t border-outline-variant w-fit">
                {item.authors.slice(0, 2).join(", ")}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2 text-on-surface-variant text-[11px] uppercase tracking-wide font-mono">
              {item.year && <span>{item.year}</span>}
              {item.category && <span className="opacity-50">•</span>}
              {item.category && <span>{item.category}</span>}
              {item.isbn && <span className="opacity-50">•</span>}
              {item.isbn && <span>ISBN {item.isbn}</span>}
              <span className="opacity-50">•</span>
              <span>Shelf {item.catalog_id?.substring(0, 3)?.toUpperCase() || "A1"}</span>
            </div>
          </div>

          <div className="flex items-end justify-between mt-4">
            <span
              className={`text-[11px] uppercase tracking-wide font-medium px-2.5 py-1 rounded border ${
                isAvailable
                  ? "bg-tertiary/10 border-tertiary/30 text-tertiary"
                  : "bg-surface-container-high border-outline-variant text-on-surface-variant"
              }`}
            >
              {isAvailable ? `${item.available_copies} of ${item.total_copies} available` : "On loan"}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleWishlist}
                disabled={wishlistPending}
                className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors rounded-md border border-transparent hover:border-outline-variant"
                aria-label="Add to wishlist"
              >
                <Heart size={16} className="transition-transform group-hover:scale-110" />
              </button>
              {!isAvailable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHold}
                  loading={holdPending}
                  className="h-8 border-outline-variant text-on-surface hover:border-primary hover:text-primary"
                >
                  <BookMarked size={14} className="mr-1.5" /> Hold
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
