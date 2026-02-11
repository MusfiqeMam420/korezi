"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import ProductCard from "@/components/ProductCard";
import { useToast } from "@/app/context/ToastContext";


const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type Product = {
  _id: string;
  slug: string;
  name: string;
  brand?: string;

  // ✅ NEW pricing fields
  regularPrice: number; // MRP
  salePrice?: number | null; // selling (optional)

  stock: number;
  category?: string;
  skinType?: string[];
  concerns?: string[];
  tags?: string[];
  images?: string[];
  description?: string;
};

function toSlug(s: string) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function hasSale(p: Pick<Product, "regularPrice" | "salePrice">) {
  return (
    p.salePrice != null &&
    Number(p.salePrice) > 0 &&
    Number(p.salePrice) < Number(p.regularPrice)
  );
}

function sellingPrice(p: Pick<Product, "regularPrice" | "salePrice">) {
  return hasSale(p) ? Number(p.salePrice) : Number(p.regularPrice);
}

export default function SingleProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const { success, error } = useToast();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState<string>("");

  const canAdd = useMemo(() => {
    if (!product) return false;
    return product.stock > 0 && qty >= 1 && qty <= product.stock;
  }, [product, qty]);

  // 1) Fetch product by slug
  useEffect(() => {
    if (!slug) return;

    setLoading(true);

    fetch(`${API_BASE}/api/products/slug/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const p = data?.product || data;
        setProduct(p || null);

        const first = p?.images?.[0] || "";
        setActiveImg(first);
        setQty(1);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // 2) Fetch similar products
  useEffect(() => {
    if (!slug) return;

    fetch(`${API_BASE}/api/products/similar/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        const filtered = product ? arr.filter((x: any) => x._id !== product._id) : arr;
        setSimilar(filtered);
      })
      .catch(() => setSimilar([]));
  }, [slug, product?._id]);

  function addToCart() {
    if (!product) return;

    try {
      addItem(
        {
          _id: product._id,
          name: product.name,
          brand: product.brand || "",
          stock: product.stock ?? 0,
          image: activeImg || product.images?.[0] || "",

          // ✅ IMPORTANT
          regularPrice: Number(product.regularPrice),
          salePrice: product.salePrice == null ? null : Number(product.salePrice),
        },
        qty
      );

      success("Added to cart ✅");
    } catch (e) {
      error("Add to cart failed");
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <p className="text-gray-600 mt-2">This product may be removed or the link is wrong.</p>
        <Link href="/shop" className="inline-block mt-5 px-6 py-2.5 rounded-xl bg-black text-white">
          Back to shop
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length ? product.images : [""];
  const mainImg = activeImg || images[0];

  const sell = sellingPrice(product);
  const showMrp = hasSale(product);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <Link href="/shop" className="hover:text-black">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{product.name}</span>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-3xl  bg-gray-50 overflow-hidden flex items-center justify-center">
            {mainImg ? (
              <img src={mainImg} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm text-gray-400">No image</span>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setActiveImg(img)}
                  className={`w-20 h-20 rounded-2xl border overflow-hidden bg-gray-50 shrink-0 ${
                    (activeImg || images[0]) === img ? "border-black" : ""
                  }`}
                >
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-gray-400">No image</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-medium">{product.name}</h1>

          {/* Clickable chips */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            {product.brand && (
              <Link
                href={`/brands/${toSlug(product.brand)}`}
                className="px-3 py-1 rounded-full border border-gray-200 bg-gray-100 hover:bg-gray-300 transition"
              >
                Brand: <b>{product.brand}</b>
              </Link>
            )}

            {product.category && (
              <Link
                href={`/categories/${toSlug(product.category)}`}
                className="px-3 py-1 rounded-full border border-gray-200 bg-gray-100 hover:bg-gray-300 transition"
              >
                Category: <b>{product.category}</b>
              </Link>
            )}

            {product.skinType?.length
              ? product.skinType.map((s, i) => (
                  <Link
                    key={i}
                    href={`/skin-types/${toSlug(s)}`}
                    className="px-3 py-1 rounded-full border border-gray-200 bg-gray-100 hover:bg-gray-300 transition"
                  >
                    Skin: <b>{s}</b>
                  </Link>
                ))
              : null}
          </div>

          {/* ✅ Selling + MRP like your screenshot */}
          <div className="mt-5 flex items-end justify-between gap-4">
            <div className="leading-tight">
              <p className="text-2xl font-semibold text-[#BE171F]">৳{sell}</p>

              {showMrp && (
                <p className="text-sm text-gray-400 line-through">
                  ৳{product.regularPrice}
                </p>
              )}
            </div>

            <p className={`text-sm ${product.stock > 0 ? "text-green-700" : "text-red-600"}`}>
              {product.stock > 0 ? `In stock: ${product.stock}` : "Out of stock"}
            </p>
          </div>

          {/* Qty + add */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center border rounded-2xl overflow-hidden">
              <button
                type="button"
                className="px-4 py-2 hover:bg-gray-50"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                -
              </button>

              <div className="px-1 py-2 text-sm font-medium">{qty}</div>

              <button
                type="button"
                className="px-4 py-2 hover:bg-gray-50"
                onClick={() => setQty((q) => Math.min(product.stock || 999, q + 1))}
                disabled={product.stock <= 0}
              >
                +
              </button>
            </div>

            <button
              disabled={!canAdd}
              onClick={addToCart}
              className="px-6 py-3 rounded-2xl bg-black text-white hover:bg-[#BE171F] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to cart
            </button>

            <Link href="/cart" className="px-6 py-3 rounded-2xl border  hover:bg-gray-200">
              View cart
            </Link>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-8">
              <h2 className="font-semibold">Description</h2>
              <p className="text-gray-700 mt-2 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Concerns + tags */}
          <div className="mt-8 grid sm:grid-cols-2 gap-6">
            <div className="bg-gray-200  rounded-2xl p-4">
              <h3 className="font-semibold text-sm">Concerns</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.concerns?.length ? (
                  product.concerns.map((c, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-gray-400 bg-gray-50">
                      {c}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">—</p>
                )}
              </div>
            </div>

            <div className="bg-gray-200   rounded-2xl p-4">
              <h3 className="font-semibold text-sm">Tags</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.tags?.length ? (
                  product.tags.map((t, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-gray-400 bg-gray-50">
                      {t}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">—</p>
                )}
              </div>
            </div>
          </div>

          <p className="mt-8 text-xs text-gray-500">
            Tip: Patch test skincare products before full use.
          </p>
        </div>
      </div>

      {/* Similar Products */}
      {similar.length > 0 && (
        <div className="mt-14">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold">Similar Products</h2>
            <Link href="/shop" className="text-sm text-gray-600 hover:text-black">
              View all
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {similar.map((p) => (
              <ProductCard key={p._id} product={p as any} />
            ))}
          </div>
        </div>
      )}


    </div>
  );
}
