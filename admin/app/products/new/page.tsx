"use client";

import { useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

function toListComma(input: string) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function UploadProductPage() {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");

  // ✅ NEW: MRP + Selling Price
  const [regularPrice, setRegularPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number | null>(null);

  const [stock, setStock] = useState<number>(0);
  const [category, setCategory] = useState("");

  const [skinType, setSkinType] = useState("");
  const [concerns, setConcerns] = useState("");
  const [tags, setTags] = useState("");

  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const previews = useMemo(() => {
    if (!files) return [];
    return Array.from(files).map((f) => URL.createObjectURL(f));
  }, [files]);

  const discountPercent = useMemo(() => {
    if (!salePrice || salePrice <= 0 || regularPrice <= 0) return null;
    if (salePrice >= regularPrice) return null;
    const pct = Math.round(((regularPrice - salePrice) / regularPrice) * 100);
    return pct > 0 ? pct : null;
  }, [regularPrice, salePrice]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !brand.trim() || !category.trim()) {
      alert("Name, Brand, and Category are required.");
      return;
    }

    if (!regularPrice || regularPrice <= 0) {
      alert("MRP (Regular Price) must be greater than 0.");
      return;
    }

    if (salePrice !== null) {
      if (salePrice <= 0) {
        alert("Selling Price must be greater than 0 (or leave empty).");
        return;
      }
      if (salePrice >= regularPrice) {
        alert("Selling Price must be less than MRP.");
        return;
      }
    }

    if (!files || files.length === 0) {
      alert("Please select images.");
      return;
    }

    setLoading(true);

    try {
      // 1) Upload images
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("images", f));

      const uploadRes = await fetch(`${API_BASE}/api/uploads/products`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const uploadData = await uploadRes.json().catch(() => ({}));

      if (!uploadRes.ok) {
        alert(uploadData?.message || `Image upload failed (${uploadRes.status})`);
        return;
      }

      const urls =
        uploadData?.urls ||
        uploadData?.files ||
        uploadData?.data?.urls ||
        [];

      if (!Array.isArray(urls) || urls.length === 0) {
        alert("Upload succeeded but no image URLs returned.");
        return;
      }

      // 2) Create product
      const payload = {
        name: name.trim(),
        brand: brand.trim(),

        // ✅ send new fields
        regularPrice: Number(regularPrice),
        salePrice: salePrice === null ? null : Number(salePrice),

        stock: Number(stock),
        category: category.trim(),

        skinType: toListComma(skinType),
        concerns: toListComma(concerns),
        tags: toListComma(tags),

        images: urls,
        description: description.trim(),
      };

      const res = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.message || `Product create failed (${res.status})`);
        return;
      }

      alert("✅ Product uploaded!");

      // reset
      setName("");
      setBrand("");
      setRegularPrice(0);
      setSalePrice(null);
      setStock(0);
      setCategory("");
      setSkinType("");
      setConcerns("");
      setTags("");
      setDescription("");
      setFiles(null);
    } catch (err: any) {
      alert(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-semibold">Upload Product</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add a new product to Korezi (MRP + Selling Price supported).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid gap-6">
          {/* Top grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Product Name" required>
              <input
                className="w-full border rounded-xl px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="COSRX Salicylic Acid Daily Gentle Cleanser"
              />
            </Field>

            <Field label="Brand" required>
              <input
                className="w-full border rounded-xl px-3 py-2"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="COSRX"
              />
            </Field>

            {/* ✅ MRP + Selling */}
            <Field label="MRP (Regular Price) ৳" required>
              <input
                type="number"
                className="w-full border rounded-xl px-3 py-2"
                value={regularPrice}
                onChange={(e) => setRegularPrice(Number(e.target.value))}
                placeholder="850"
                min={0}
              />
            </Field>

            <Field label="Selling Price (optional) ৳">
              <input
                type="number"
                className="w-full border rounded-xl px-3 py-2"
                value={salePrice === null ? "" : salePrice}
                onChange={(e) => {
                  const v = e.target.value;
                  setSalePrice(v === "" ? null : Number(v));
                }}
                placeholder="498"
                min={0}
              />
              <div className="mt-2 text-xs text-gray-500">
                {discountPercent ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full border bg-green-50 text-green-700">
                      {discountPercent}% OFF
                    </span>
                    <span>
                      MRP <span className="line-through">৳{regularPrice}</span> →{" "}
                      <b className="text-gray-900">৳{salePrice}</b>
                    </span>
                  </span>
                ) : (
                  "Leave empty if no discount."
                )}
              </div>
            </Field>

            <Field label="Stock">
              <input
                type="number"
                className="w-full border rounded-xl px-3 py-2"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                placeholder="20"
                min={0}
              />
            </Field>

            <Field label="Category" required>
              <input
                className="w-full border rounded-xl px-3 py-2"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Cleanser / Lotion / Serum"
              />
            </Field>

            <Field label="Skin Type (comma)">
              <input
                className="w-full border rounded-xl px-3 py-2"
                value={skinType}
                onChange={(e) => setSkinType(e.target.value)}
                placeholder="Dry, Sensitive"
              />
            </Field>

            <Field label="Concerns (comma)">
              <input
                className="w-full border rounded-xl px-3 py-2"
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                placeholder="Acne, Brightening, Repair"
              />
            </Field>

            <Field label="Tags (comma)">
              <input
                className="w-full border rounded-xl px-3 py-2"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="kbeauty, bestseller, new"
              />
            </Field>
          </div>

          {/* Description */}
          <Field label="Description">
            <textarea
              className="w-full border rounded-xl px-3 py-2 min-h-[140px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write product details, how to use, benefits..."
            />
          </Field>

          {/* Images */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 font-medium">
                Images (multiple)
              </label>
              <span className="text-xs text-gray-400">PNG/JPG recommended</span>
            </div>

            <input
              className="mt-2 block"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(e.target.files)}
            />

            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {previews.map((src) => (
                  <img
                    key={src}
                    src={src}
                    className="rounded-xl border object-cover aspect-square"
                    alt="preview"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-black text-white disabled:opacity-60"
            >
              {loading ? "Uploading..." : "Upload Product"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setName("");
                setBrand("");
                setRegularPrice(0);
                setSalePrice(null);
                setStock(0);
                setCategory("");
                setSkinType("");
                setConcerns("");
                setTags("");
                setDescription("");
                setFiles(null);
              }}
              className="px-6 py-2.5 rounded-xl border hover:bg-gray-50 disabled:opacity-60"
            >
              Reset
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Note: Slug is generated automatically by backend for SEO URLs.
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm text-gray-600 font-medium">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
