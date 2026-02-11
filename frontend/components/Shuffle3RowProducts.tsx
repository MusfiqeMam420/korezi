// components/BestSellerGrid.tsx
"use client";

import { useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { shuffleArray } from "@/utils/shuffle";

type Product = {
  _id: string;
  slug: string;
  name: string;
  brand?: string;
  stock: number;
  images?: string[];
  category?: string;
  regularPrice: number;
  salePrice?: number | null;
};

export default function BestSellerGrid({ items }: { items: Product[] }) {
  // ✅ shuffle ONCE per page load
  const shuffled = useMemo(() => shuffleArray(items), [items]);

  return (
    <div className="mt-6">
      <div
        className="
          grid
          grid-cols-2
          md:grid-cols-4
          gap-4
        "
      >
        {shuffled.map((p) => (
          <ProductCard
            key={p._id}
            product={{
              _id: p._id,
              slug: p.slug,
              name: p.name,
              brand: p.brand || "",
              stock: p.stock,
              images: p.images || [],
              category: p.category || "",
              regularPrice: p.regularPrice,
              salePrice: p.salePrice ?? null,
            } as any}
          />
        ))}
      </div>
    </div>
  );
}
