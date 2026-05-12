"use client";

import { useParams } from "next/navigation";
import { BookOpen, MapPin, Bookmark, QrCode } from "lucide-react";
import { useCatalogItem, useAddToWishlist, usePlaceHold } from "@/hooks/useLibrary";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import toast from "react-hot-toast";
import Link from "next/link";

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

  const handleBorrow = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to borrow");
      return;
    }
    toast.success("Borrow request submitted");
  };

  if (isLoading) {
    return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-sm text-[#8B7355] font-serif animate-pulse">Retrieving catalog records...</div>;
  }

  if (!item) {
    return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-sm text-[#8C3232] font-serif">Catalog record not located.</div>;
  }

  const isAvailable = item.available_copies > 0;
  const mockShelf = item.catalog_id ? item.catalog_id.substring(0, 3).toUpperCase() : "A1X";

  return (
    <div className="page-container py-10">
      <PageHeader
        title="Volume Details"
        subtitle="Library Catalog Reference"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Library", href: "/library" }, { label: "Details" }]}
      />

      <div className="max-w-5xl mx-auto mt-6">
        {/* Library Card Aesthetics */}
        <div className="bg-[#FFF8E7] rounded-sm border border-[#D4C4B7] shadow-[0_8px_30px_rgba(122,40,40,0.08),0_4px_10px_rgba(0,0,0,0.04)] relative overflow-hidden">
          
          {/* Card alignment guides (vintage index card styling) */}
          <div className="absolute top-0 bottom-0 left-12 w-[1px] bg-[#D94E4E]/30 z-0"></div>
          <div className="absolute top-12 left-0 right-0 h-[1px] bg-[#D4C4B7]/40 z-0"></div>
          <div className="absolute top-24 left-0 right-0 h-[1px] bg-[#D4C4B7]/40 z-0"></div>
          
          {/* Hole punch for vintage card rod */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#EAE0D5] border border-[#D4C4B7] shadow-inner z-0"></div>

          <div className="flex flex-col md:flex-row gap-8 p-10 md:p-14 relative z-10">
            {/* Left: Book Cover (2:3 aspect ratio) */}
            <div className="md:w-64 flex-shrink-0">
              <div className="aspect-[2/3] bg-[#EAE0D5] border border-[#A89689] shadow-md flex items-center justify-center relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/20 to-transparent z-10" />
                <BookOpen size={48} className="text-[#8B7355] opacity-30 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/40 to-transparent flex flex-col justify-end min-h-[40%]">
                  <p className="text-[#FFF8E7]/80 font-serif text-[10px] uppercase tracking-widest text-center mt-auto" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                    Vol. {mockShelf}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Metadata */}
            <div className="flex-1 flex flex-col">
              <div className="mb-6 flex justify-between items-start gap-4">
                <div>
                  <h1 className="font-heading text-[36px] font-medium text-[#2c1e16] leading-tight mb-2">
                    {item.title}
                  </h1>
                  {!!item.authors?.length && (
                    <p className="text-sm font-serif uppercase tracking-widest text-[#8B7355]">
                      By {item.authors.join(", ")}
                    </p>
                  )}
                </div>
                
                {/* Availability Badge */}
                <div className="flex-shrink-0 text-right">
                  <div className={`inline-flex flex-col items-end`}>
                    <span className="text-[10px] font-serif uppercase tracking-wider text-[#A89689] mb-1">Status</span>
                    <span className={`px-3 py-1 text-xs font-medium uppercase tracking-wider border ${isAvailable ? 'bg-[#5E7A64]/10 border-[#5E7A64]/30 text-[#43624A]' : 'bg-[#8B7355]/10 border-[#8B7355]/30 text-[#8B7355]'}`}>
                      {isAvailable ? `${item.available_copies} of ${item.total_copies} Available` : 'On Loan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid Data */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 font-serif text-sm border-b border-[#D4C4B7]/40 pb-6">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-[#A89689]">ISBN</span>
                  <span className="text-[#2c1e16]">{item.isbn || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-[#A89689]">Publication Year</span>
                  <span className="text-[#2c1e16]">{item.year || "Unknown"}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-[#A89689]">Category</span>
                  <span className="text-[#2c1e16]">{item.category || "General Library"}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-[#A89689]">Publisher</span>
                  <span className="text-[#2c1e16]">Archival Press (Mock)</span>
                </div>
              </div>

              {/* Synopsis / Description */}
              {!!item.description && (
                <div className="mb-8">
                  <span className="block text-[10px] font-serif uppercase tracking-wider text-[#A89689] mb-2">Synopsis</span>
                  <p className="text-sm font-serif text-[#5a4634] leading-relaxed relative before:content-[''] before:absolute before:-left-3 before:top-1 before:bottom-1 before:w-0.5 before:bg-[#D4C4B7]/50 pl-3">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Shelf Location and Tracking */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-auto pt-6 gap-6">
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E69900]/10 flex items-center justify-center text-[#B37700]">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-serif uppercase tracking-wider text-[#A89689]">Shelf Location</span>
                    <span className="font-serif text-[#2c1e16] font-medium">Stack {mockShelf}, Row 4</span>
                  </div>
                </div>

                {/* Mock Barcode */}
                <div className="flex items-end gap-3 opacity-60">
                  <div className="text-right">
                    <span className="block text-[8px] font-mono uppercase tracking-widest text-[#5a4634]">Ref Card: {itemId.substring(0, 8)}</span>
                    <div className="h-6 w-32 border-l border-r border-[#5a4634] relative overflow-hidden mt-1">
                      {/* Fake barcode lines */}
                      <div className="absolute inset-0 flex justify-between bg-repeating-linear-gradient-to-r" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #5a4634 0, #5a4634 1px, transparent 1px, transparent 3px, #5a4634 3px, #5a4634 5px, transparent 5px, transparent 7px)' }}></div>
                    </div>
                  </div>
                  <QrCode size={24} className="text-[#5a4634]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button 
            className="bg-[#7A2828] hover:bg-[#5E1F1F] text-[#FFF8E7] rounded-sm font-serif px-8 py-2.5 h-auto transition-transform hover:-translate-y-1 hover:shadow-lg shadow-md uppercase tracking-wider text-sm"
            onClick={handleBorrow}
            disabled={!isAvailable}
          >
            Borrow Now
          </Button>
          
          {!isAvailable && (
            <Button 
              variant="outline" 
              className="border-[#D4C4B7] text-[#5a4634] hover:bg-[#D4C4B7]/20 rounded-sm font-serif px-8 py-2.5 h-auto uppercase tracking-wider text-sm"
              onClick={handleHold} 
              loading={holdPending}
            >
              Place Hold
            </Button>
          )}

          <Button 
            variant="outline" 
            className="border-[#D4C4B7] text-[#5a4634] hover:bg-[#D4C4B7]/20 rounded-sm font-serif px-6 py-2.5 h-auto gap-2"
            onClick={handleWishlist} 
            loading={wishlistPending}
          >
            <Bookmark size={16} /> <span className="uppercase tracking-wider text-sm">Add to Wishlist</span>
          </Button>
        </div>

        {/* Related Carousel Preview */}
        <div className="mt-16 border-t border-[#D4C4B7] pt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading text-xl text-[#2c1e16]">Related Volumes</h3>
            <Link href={`/library?category=${item.category}`} className="text-[#8B7355] hover:text-[#7A2828] text-sm font-serif italic">View all in category &rarr;</Link>
          </div>
          
          <div className="flex overflow-x-auto pb-6 gap-6 snap-x hide-scrollbar">
            {/* Mocking a few related cards for aesthetic */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-48 snap-center">
                <div className="aspect-[2/3] bg-[#EAE0D5] border border-[#D4C4B7] shadow-sm mb-3 flex items-center justify-center group overflow-hidden relative cursor-pointer hover:shadow-md transition-shadow">
                  <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/10 to-transparent z-10" />
                  <BookOpen size={24} className="text-[#A89689] group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h4 className="font-heading text-sm text-[#2c1e16] line-clamp-1">Similar Classical Text {i}</h4>
                <p className="font-serif text-[10px] uppercase tracking-wider text-[#A89689] mt-1">Archival Press</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
