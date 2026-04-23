"use client";

import { useParams } from "next/navigation";
import { BookOpen, Heart, BookMarked } from "lucide-react";
import { useCatalogItem, useAddToWishlist, usePlaceHold } from "@/hooks/useLibrary";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function LibraryItemPage() {
  const params = useParams<{ id: string }>();
  const itemId = params?.id ?? "";

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

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">Loading catalog item...</div>;
  }

  if (!item) {
    return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">Catalog item not found.</div>;
  }

  const isAvailable = item.available_copies > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-20 h-24 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
            <BookOpen size={30} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{item.title}</h1>
            {!!item.authors?.length && (
              <p className="text-sm text-slate-600 mt-1">{item.authors.join(", ")}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {item.year ? `${item.year} · ` : ""}
              {item.category || "General"}
              {item.isbn ? ` · ISBN ${item.isbn}` : ""}
            </p>
          </div>
        </div>

        {!!item.description && <p className="text-sm text-slate-700 mb-4">{item.description}</p>}

        <div className="text-sm text-slate-700 mb-4">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {isAvailable
              ? `${item.available_copies} of ${item.total_copies} available`
              : "All copies on loan"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleWishlist} loading={wishlistPending}>
            <Heart size={14} /> Wishlist
          </Button>
          {!isAvailable && (
            <Button variant="outline" onClick={handleHold} loading={holdPending}>
              <BookMarked size={14} /> Place Hold
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
