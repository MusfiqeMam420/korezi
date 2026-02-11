"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

export default function ShopPage() {
  const params = useSearchParams();
  const router = useRouter();

  // ✅ initial from URL
  const [search, setSearch] = useState(params.get("search") || "");
  const [brand, setBrand] = useState(params.get("brand") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [skinType, setSkinType] = useState(params.get("skinType") || "");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse>({
    items: [],
    total: 0,
    page: 1,
    pages: 1,
  });

  // ✅ Sync filters to URL
  useEffect(() => {
    const sp = new URLSearchParams();
    if (search.trim()) sp.set("search", search.trim());
    if (brand) sp.set("brand", brand);
    if (category) sp.set("category", category);
    if (skinType) sp.set("skinType", skinType);

    const query = sp.toString();
    router.replace(query ? `/shop?${query}` : "/shop");
  }, [search, brand, category, skinType, router]);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("search", search.trim());
    if (brand) p.set("brand", brand);
    if (category) p.set("category", category);
    if (skinType) p.set("skinType", skinType);
    p.set("page", "1");
    p.set("limit", "12");
    return p.toString();
  }, [search, brand, category, skinType]);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/products?${qs}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => {
        setData({
          items: Array.isArray(res.items) ? res.items : [],
          total: Number(res.total || 0),
          page: Number(res.page || 1),
          pages: Number(res.pages || 1),
        });
      })
      .catch(() =>
        setData({
          items: [],
          total: 0,
          page: 1,
          pages: 1,
        })
      )
      .finally(() => setLoading(false));
  }, [qs]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold">Shop</h1>

      {/* Search + filters */}
      {/* <div className="mt-5 grid gap-3 md:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, brand, category..."
          className="md:col-span-2 w-full border rounded-2xl px-4 py-3"
        />

        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Brand (e.g. COSRX)"
          className="w-full border rounded-2xl px-4 py-3"
        />

        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (e.g. Lotion)"
          className="w-full border rounded-2xl px-4 py-3"
        />

        <input
          value={skinType}
          onChange={(e) => setSkinType(e.target.value)}
          placeholder="Skin type (e.g. Dry)"
          className="w-full border rounded-2xl px-4 py-3"
        />

        <button
          onClick={() => {
            setSearch("");
            setBrand("");
            setCategory("");
            setSkinType("");
          }}
          className="md:col-span-4 w-fit px-4 py-2 rounded-xl border hover:bg-gray-50"
        >
          Clear filters
        </button>
      </div> */}

      {/* Results */}
      <div className="mt-8">
        {loading ? (
          <p className="text-gray-500">Loading products...</p>
        ) : data.items.length === 0 ? (
          <p className="text-gray-500">No products found.</p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Showing {data.items.length} / {data.total}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.items.map((p) => (
                <ProductCard key={p._id} product={p as any} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
