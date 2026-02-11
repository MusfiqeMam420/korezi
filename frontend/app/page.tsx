"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import HeroCarousel from "@/components/HeroCarousel";
import Shuffle3RowProducts from "@/components/Shuffle3RowProducts";
import KoreziAboutSection from "@/components/KoreziAboutSection";
import Footer from "@/components/Footer";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type Product = {
  _id: string;
  slug: string;
  name: string;
  brand?: string;
  category?: string;
  stock: number;
  images?: string[];

  regularPrice: number;
  salePrice?: number | null;

  createdAt?: string;
};

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Product[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await fetch(`${API_BASE}/api/products?page=1&limit=16`, {
          cache: "no-store",
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load products");

        const list = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];

        if (!ignore) setItems(list);
      } catch (e: any) {
        if (!ignore) setErrorMsg(e?.message || "Something went wrong");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  const newArrivals = useMemo(() => items.slice(0, 8), [items]);

  const bestSellers = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const aSale = a.salePrice != null && a.salePrice > 0 && a.salePrice < a.regularPrice;
      const bSale = b.salePrice != null && b.salePrice > 0 && b.salePrice < b.regularPrice;
      return Number(bSale) - Number(aSale);
    });
    return sorted.slice(0, 8);
  }, [items]);

  const categoryChips = ["Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen", "Mask", "Eye cream", "Lip care", "Body care", "Hair care", "Baby care", "Makeup"];
  const brandChips = ["COSRX", "The Ordinary", "AXIS-Y", "Christian Dean", "Beaute", "DADO" , "Missha","Anua","Medicube","Raip","Farmstay","iUNIK","Laneige"];

  return (
    <div className="bg-[#FAFBFF]">
       <HeroCarousel />
      

      {/* BRANDS */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold">Popular brands</h2>
          <Link href="/shop" className="text-sm text-gray-600 hover:text-black">
            View all →
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {brandChips.map((b) => (
            <Link
              key={b}
              href={`/shop?brand=${encodeURIComponent(b)}`}
              className="text-sm px-4 py-2 rounded-2xl border border-gray-300 bg-gray-200  hover:bg-gray-50 transition"
            >
              {b}
            </Link>
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">New arrivals</h2>
            <p className="text-sm text-gray-500 mt-1">Fresh drops you’ll love</p>
          </div>
          <Link href="/shop" className="text-sm text-gray-600 hover:text-black">
            View all →
          </Link>
        </div>

        <div className="mt-6">
          {loading ? (
            <p className="text-gray-500">Loading products...</p>
          ) : errorMsg ? (
            <p className="text-red-600">{errorMsg}</p>
          ) : newArrivals.length === 0 ? (
            <p className="text-gray-500">No products yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {newArrivals.map((p) => (
                <ProductCard
                  key={p._id}
                  product={{
                    _id: p._id,
                    slug: p.slug,
                    name: p.name,
                    brand: p.brand || "",
                    regularPrice: Number(p.regularPrice || 0),
                    salePrice: p.salePrice == null ? null : Number(p.salePrice),
                    stock: Number(p.stock || 0),
                    images: p.images || [],
                    category: p.category || "",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PROMO */}
      {/* <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="rounded-3xl border bg-gradient-to-br from-gray-50 to-white p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h3 className="text-xl font-semibold">Up to 30% off selected skincare</h3>
            <p className="text-sm text-gray-600 mt-1">
              Limited time deals on best sellers. Grab before it’s gone.
            </p>
          </div>

          <Link
            href="/shop"
            className="w-fit px-6 py-3 rounded-2xl bg-black hover:bg-[#BE171F] transition text-white"
          >
            Shop Deals
          </Link>
        </div>
      </section> */}

      

      {/* BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Best sellers</h2>
            <p className="text-sm text-gray-500 mt-1">Most loved by customers</p>
          </div>
          <Link href="/shop" className="text-sm text-gray-600 hover:text-black">
            View all →
          </Link>
        </div>

        <div className="mt-6">
          {loading ? (
            <p className="text-gray-500">Loading products...</p>
          ) : bestSellers.length === 0 ? (
            <p className="text-gray-500">No products yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {bestSellers.map((p) => (
                <ProductCard
                  key={p._id}
                  product={{
                    _id: p._id,
                    slug: p.slug,
                    name: p.name,
                    brand: p.brand || "",
                    regularPrice: Number(p.regularPrice || 0),
                    salePrice: p.salePrice == null ? null : Number(p.salePrice),
                    stock: Number(p.stock || 0),
                    images: p.images || [],
                    category: p.category || "",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold">Popular Categories</h2>
          <Link href="/shop" className="text-sm text-gray-600 hover:text-black">
            View all →
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categoryChips.map((b) => (
            <Link
              key={b}
              href={`/shop?brand=${encodeURIComponent(b)}`}
              className="text-sm px-4 py-2 rounded-2xl border border-gray-300 bg-gray-200  hover:bg-gray-50 transition"
            >
              {b}
            </Link>
          ))}
        </div>
      </section>

<section className="max-w-7xl mx-auto px-6 py-10">
  <div className="flex items-end justify-between">
    <div>
     <h2 className="text-2xl font-semibold">Products</h2>
            <p className="text-sm text-gray-500 mt-1">Some glimps of our beatuy</p>
    </div>
  </div>

  {loading ? (
    <p className="text-gray-500 mt-6">Loading products...</p>
  ) : items.length === 0 ? (
    <p className="text-gray-500 mt-6">No products yet.</p>
  ) : (
    <Shuffle3RowProducts items={items} />
  )}
</section>

<section id="about">
<KoreziAboutSection />
</section>

<Footer />
     
    </div>
  );
}

function MiniStat({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
    </div>
  );
}
