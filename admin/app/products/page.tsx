"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "@/app/context/ToastContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type Product = {
  _id: string;
  name: string;
  slug?: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  regularPrice?: number;
  salePrice?: number | null;
  price?: number;
  mrp?: number;
  stock: number;
  images?: string[];
  createdAt?: string;
};

type ApiResponse =
  | Product[]
  | {
      items: Product[];
      total: number;
      page: number;
      pages: number;
    };

export default function AdminProductsPage() {
  const { success, error } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/products?limit=200`, {
        cache: "no-store",
      });

      const data: ApiResponse = await res.json();

      // ✅ support both API shapes (array OR {items})
      const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];

      setProducts(items);
    } catch (e) {
      console.error(e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteProduct(product: Product) {
    const ok = window.confirm(
      `Delete "${product.name}"?\n\nThis action cannot be undone.`
    );
    if (!ok) return;

    setDeletingId(product._id);
    try {
      const res = await fetch(`${API_BASE}/api/products/${product._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Delete failed");

      setProducts((prev) => prev.filter((item) => item._id !== product._id));
      success("Product deleted.");
    } catch (err: any) {
      error(err?.message || "Product delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;

    return products.filter((p) => {
      return (
        (p.name || "").toLowerCase().includes(s) ||
        (p.brand || "").toLowerCase().includes(s) ||
        (p.category || "").toLowerCase().includes(s) ||
        (p.subCategory || "").toLowerCase().includes(s)
      );
    });
  }, [q, products]);

  return (
    <div className="bg-white border mx-20 mt-10 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-gray-500">Manage your Korezi product catalog.</p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/brands"
            className="px-4 py-2 rounded-xl border bg-white text-sm hover:bg-gray-50"
          >
            Brands
          </Link>
          <Link
            href="/categories"
            className="px-4 py-2 rounded-xl border bg-white text-sm hover:bg-gray-50"
          >
            Categories
          </Link>
          <Link
            href="/products/new"
            className="px-4 py-2 rounded-xl bg-black text-white text-sm"
          >
            + Upload Product
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="w-full md:w-96">
          <input
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Search by name, brand, category..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <button
          onClick={load}
          className="w-fit px-4 py-2 rounded-xl border text-sm hover:bg-gray-50"
          disabled={loading}
          type="button"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="text-left">
              <th className="py-3 px-6">Product</th>
              <th className="py-3 px-6">Category</th>
              <th className="py-3 px-6">Price</th>
              <th className="py-3 px-6">Stock</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="py-10 px-6 text-gray-500" colSpan={6}>
                  Loading products...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="py-10 px-6 text-gray-500" colSpan={6}>
                  No products found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const img = p.images?.[0];
                const inStock = (p.stock ?? 0) > 0;
                const regular = Number(p.regularPrice ?? p.mrp ?? p.price ?? 0);
                const sale =
                  p.salePrice != null && Number(p.salePrice) > 0 && Number(p.salePrice) < regular
                    ? Number(p.salePrice)
                    : null;

                return (
                  <tr key={p._id} className="border-t">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl border overflow-hidden bg-gray-50 flex items-center justify-center">
                          {img ? (
                            <img
                              src={img}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">No image</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 line-clamp-1">
                            {p.name}
                          </div>
                          <div className="text-gray-500 text-xs line-clamp-1">{p.brand || "-"}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div>{p.category || "-"}</div>
                      {p.subCategory && (
                        <div className="text-xs text-gray-500">{p.subCategory}</div>
                      )}
                    </td>

                    <td className="py-4 px-6 font-medium">
                      <div>৳{sale ?? regular}</div>
                      {sale != null && (
                        <div className="text-xs text-gray-400 line-through">৳{regular}</div>
                      )}
                    </td>

                    <td className="py-4 px-6">{p.stock ?? 0}</td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${
                          inStock
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {inStock ? "In stock" : "Out of stock"}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/products/${p._id}/edit`}
                          className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => deleteProduct(p)}
                          disabled={deletingId === p._id}
                          className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === p._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-6 border-t text-xs text-gray-500 flex justify-between">
        <span>Total: {filtered.length}</span>
        <span>API: {API_BASE}</span>
      </div>
    </div>
  );
}
