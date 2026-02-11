// app/skin-types/[skin]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type Product = {
  _id: string;
  slug: string;
  name: string;
  brand?: string;
  category?: string;
  skinType?: string[];
  price: number;
  stock: number;
  images?: string[];
};

type ApiResponse = {
  items: Product[];
  total: number;
  page: number;
  pages: number;
};

function titleCase(s: string) {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function SkinTypePage() {
  const params = useParams<{ skin: string }>();
  const skinParam = params?.skin || "";

  const skinValue = useMemo(() => {
    const decoded = decodeURIComponent(skinParam);
    return decoded.replace(/-/g, " ").trim();
  }, [skinParam]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse>({ items: [], total: 0, page: 1, pages: 1 });

  useEffect(() => {
    setLoading(true);

    const qs = new URLSearchParams();
    qs.set("skinType", skinValue);
    qs.set("page", "1");
    qs.set("limit", "24");

    fetch(`${API_BASE}/api/products?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) =>
        setData({
          items: Array.isArray(res.items) ? res.items : [],
          total: Number(res.total || 0),
          page: Number(res.page || 1),
          pages: Number(res.pages || 1),
        })
      )
      .catch(() => setData({ items: [], total: 0, page: 1, pages: 1 }))
      .finally(() => setLoading(false));
  }, [skinValue]);

  const title = titleCase(skinValue);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="text-sm text-gray-500">
        <Link href="/shop" className="hover:text-black">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{title}</span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title} Skin</h1>
          <p className="text-sm text-gray-500 mt-1">{data.total} products</p>
        </div>

        <Link href="/shop" className="px-4 py-2 rounded-xl cursor pointer transition text-white bg-[#BE171F] hover:bg-black">
          Back to shop
        </Link>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-gray-500">Loading products...</p>
        ) : data.items.length === 0 ? (
          <p className="text-gray-500">No products found for this skin type.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.items.map((p) => (
              <ProductCard key={p._id} product={p as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
