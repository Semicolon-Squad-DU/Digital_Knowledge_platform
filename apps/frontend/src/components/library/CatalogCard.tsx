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
    <div className="bg-[#FFF8E7] rounded-md border border-[#D4C4B7] p-5 shadow-[0_4px_10px_rgba(122,40,40,0.05),0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(122,40,40,0.1),0_4px_8px_rgba(0,0,0,0.04)] relative overflow-hidden group">
      {/* Book spine accent */}
      <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-b from-[#7A2828] to-[#5E1F1F] opacity-90 border-r border-[#4A1717] z-10" />
      <div className="absolute left-2.5 top-0 bottom-0 w-[1px] bg-white/20 z-10" />
      
      <div className="flex gap-5 pl-3">
        {/* Cover placeholder - like a sophisticated book cover */}
        <div className="flex-shrink-0 w-[72px] h-[100px] bg-[#EAE0D5] border border-[#D4C4B7] flex items-center justify-center relative overflow-hidden shadow-inner uppercase tracking-widest text-[#8B7355] text-[10px] font-serif writing-vertical">
          Vol. {item.catalog_id?.substring(0, 2) || "I"}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <Link
              href={`/library/${item.catalog_id}`}
              className="font-heading font-medium text-lg text-[#2c1e16] hover:text-[#7A2828] line-clamp-2 transition-colors leading-tight"
            >
              {item.title}
            </Link>

            {item.authors?.length > 0 && (
              <p className="text-xs uppercase tracking-wider text-[#8B7355] mt-1.5 font-serif pt-1 border-t border-[#D4C4B7]/40 w-fit">
                {item.authors.slice(0, 2).join(", ")}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2 font-serif text-[#8B7355] text-[11px] uppercase tracking-wide">
              {item.year && <span>{item.year}</span>}
              {item.category && <span className="opacity-50">•</span>}
              {item.category && <span>{item.category}</span>}
              {item.isbn && <span className="opacity-50">•</span>}
              {item.isbn && <span>ISBN {item.isbn}</span>}
              {/* Optional mock shelf for aesthetic */}
              <span className="opacity-50">•</span>
              <span>Shelf {item.catalog_id?.substring(0, 3)?.toUpperCase() || "A1"}</span>
            </div>
          </div>

          <div className="flex items-end justify-between mt-4">
            <span
              className={`text-[11px] uppercase tracking-wide font-medium px-2.5 py-1 ${
                isAvailable
                  ? "bg-[#2C5530]/10 border border-[#2C5530]/20 text-[#2C5530]"
                  : "bg-[#8B7355]/10 border border-[#8B7355]/20 text-[#8B7355]"
              }`}
            >
              {isAvailable
                ? `${item.available_copies} of ${item.total_copies} available`
                : "On Loan"}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleWishlist}
                disabled={wishlistPending}
                className="p-2 text-[#8B7355] hover:text-[#7A2828] hover:bg-[#7A2828]/5 transition-colors border border-transparent hover:border-[#7A2828]/10"
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
                  className="font-serif border-[#D4C4B7] text-[#5a4634] hover:bg-[#7A2828]/5 hover:text-[#7A2828] hover:border-[#7A2828]/30 h-8"
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
