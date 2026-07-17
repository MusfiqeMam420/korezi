"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useToast } from "@/app/context/ToastContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
const MAX_IMAGES = 8;
const MAX_VIDEO_MB = 80;

const SKIN_PRESETS = ["All Skin Types", "Dry Skin", "Oily Skin", "Sensitive Skin", "Combination Skin"];
const CONCERN_PRESETS = ["Acne", "Brightening", "Hydration", "Barrier Repair", "Redness", "Pigmentation"];

type ImageItem = {
  id: string;
  file: File;
  previewUrl: string;
};

type Category = {
  _id: string;
  name: string;
  subcategories: { _id?: string; name: string; children?: { _id?: string; name: string }[] }[];
};

type Brand = {
  _id: string;
  name: string;
};

type SubmitStage = "idle" | "uploading-images" | "uploading-video" | "creating-product";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cleanList(values: string[]) {
  return values.map((s) => s.trim()).filter(Boolean);
}

export default function UploadProductPage() {
  const { success, error, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const imagesRef = useRef<ImageItem[]>([]);
  const videoPreviewRef = useRef("");

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<SubmitStage>("idle");
  const [dragging, setDragging] = useState(false);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [regularPrice, setRegularPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number | null>(null);
  const [stock, setStock] = useState<number>(0);
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [thirdCategory, setThirdCategory] = useState("");
  const [skinType, setSkinType] = useState<string[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    videoPreviewRef.current = videoPreviewUrl;
  }, [videoPreviewUrl]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      if (videoPreviewRef.current) URL.revokeObjectURL(videoPreviewRef.current);
    };
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`, { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/brands`, { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => setBrands([]));
  }, []);

  const brandOptions = useMemo(() => {
    const names = brands.map((item) => item.name);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [brands]);

  const categoryOptions = useMemo(() => {
    const names = categories.map((item) => item.name);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const selectedCategory = useMemo(() => {
    return categories.find((item) => item.name.toLowerCase() === category.trim().toLowerCase());
  }, [categories, category]);

  const subcategoryOptions = selectedCategory?.subcategories.map((item) => item.name) || [];
  const selectedSubcategory = selectedCategory?.subcategories.find((item) => item.name.toLowerCase() === subCategory.trim().toLowerCase());
  const thirdCategoryOptions = selectedSubcategory?.children?.map((item) => item.name) || [];

  const discountPercent = useMemo(() => {
    if (!salePrice || salePrice <= 0 || regularPrice <= 0 || salePrice >= regularPrice) {
      return null;
    }
    return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
  }, [regularPrice, salePrice]);

  const validationErrors = useMemo(() => {
    const issues: string[] = [];
    if (!name.trim()) issues.push("Product name is required.");
    if (!brand.trim()) issues.push("Brand is required.");
    if (!category.trim()) issues.push("Category is required.");
    if (!regularPrice || regularPrice <= 0) issues.push("MRP must be greater than 0.");
    if (salePrice != null && (salePrice <= 0 || salePrice >= regularPrice)) {
      issues.push("Selling price must be greater than 0 and less than MRP.");
    }
    if (stock < 0) issues.push("Stock cannot be negative.");
    if (images.length === 0) issues.push("At least one product image is required.");
    if (videoFile && videoFile.size > MAX_VIDEO_MB * 1024 * 1024) {
      issues.push(`Product video must be ${MAX_VIDEO_MB}MB or smaller.`);
    }
    return issues;
  }, [name, brand, category, regularPrice, salePrice, stock, images.length, videoFile]);

  const canSubmit = validationErrors.length === 0 && !loading;

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (incoming.length === 0) {
      error("Please choose image files only.");
      return;
    }

    setImages((prev) => {
      const room = MAX_IMAGES - prev.length;
      const accepted = incoming.slice(0, Math.max(0, room));
      const next = [
        ...prev,
        ...accepted.map((file) => ({
          id: makeId(),
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ];

      if (incoming.length > accepted.length) {
        info(`Only ${MAX_IMAGES} images are allowed per product.`);
      }

      return next;
    });
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const copy = [...prev];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  }

  function chooseVideo(file: File | null) {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);

    if (!file) {
      setVideoFile(null);
      setVideoPreviewUrl("");
      return;
    }

    if (!file.type.startsWith("video/")) {
      error("Please choose a video file.");
      return;
    }

    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      error(`Product video must be ${MAX_VIDEO_MB}MB or smaller.`);
      return;
    }

    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  }

  function resetForm() {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setName("");
    setBrand("");
    setRegularPrice(0);
    setSalePrice(null);
    setStock(0);
    setCategory("");
    setSubCategory("");
    setThirdCategory("");
    setSkinType([]);
    setConcerns([]);
    setTags([]);
    setDescription("");
    setImages([]);
    chooseVideo(null);
    setStage("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canSubmit) {
      error(validationErrors[0] || "Please check the product form.");
      return;
    }

    setLoading(true);

    try {
      setStage("uploading-images");
      const fd = new FormData();
      images.forEach((img) => fd.append("images", img.file));

      const uploadRes = await fetch(`${API_BASE}/api/uploads/products`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        throw new Error(uploadData?.message || `Image upload failed (${uploadRes.status})`);
      }

      const urls = uploadData?.urls || uploadData?.files || uploadData?.data?.urls || [];
      if (!Array.isArray(urls) || urls.length === 0) {
        throw new Error("Upload succeeded but no image URLs returned.");
      }

      let videoUrl = "";
      if (videoFile) {
        setStage("uploading-video");
        const videoFd = new FormData();
        videoFd.append("video", videoFile);

        const videoRes = await fetch(`${API_BASE}/api/uploads/product-video`, {
          method: "POST",
          body: videoFd,
          credentials: "include",
        });

        const videoData = await videoRes.json().catch(() => ({}));
        if (!videoRes.ok) {
          throw new Error(videoData?.message || `Product video upload failed (${videoRes.status})`);
        }

        videoUrl = String(videoData?.url || "");
      }

      setStage("creating-product");
      const payload = {
        name: name.trim(),
        brand: brand.trim(),
        regularPrice: Number(regularPrice),
        salePrice: salePrice === null ? null : Number(salePrice),
        stock: Number(stock),
        category: category.trim(),
        subCategory: subCategory.trim(),
        thirdCategory: thirdCategory.trim(),
        skinType: cleanList(skinType),
        concerns: cleanList(concerns),
        tags: cleanList(tags),
        images: urls,
        video: videoUrl,
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
        throw new Error(data?.message || `Product create failed (${res.status})`);
      }

      success("Product uploaded successfully.");
      resetForm();
    } catch (err: any) {
      error(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setStage("idle");
    }
  }

  const stageLabel =
    stage === "uploading-images"
      ? "Uploading images..."
      : stage === "uploading-video"
      ? "Uploading video..."
      : stage === "creating-product"
      ? "Creating product..."
      : "Upload Product";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Catalog</p>
            <h1 className="text-2xl font-semibold tracking-tight">Advanced Product Upload</h1>
          </div>

          <Link href="/products" className="px-4 py-2 rounded-lg border bg-white text-sm hover:bg-gray-100">
            Back to Products
          </Link>
          <Link href="/brands" className="px-4 py-2 rounded-lg border bg-white text-sm hover:bg-gray-100">
            Brands
          </Link>
          <Link href="/categories" className="px-4 py-2 rounded-lg border bg-white text-sm hover:bg-gray-100">
            Categories
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_0.8fr]">
          <section className="grid gap-6">
            <Panel title="Product Details" subtitle="Core information shown across the storefront.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Product Name" required>
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="COSRX Salicylic Acid Daily Gentle Cleanser"
                  />
                </Field>

                <Field label="Brand" required>
                  <select
                    className="input"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  >
                    <option value="">
                      {brandOptions.length ? "Select brand" : "Create a brand first"}
                    </option>
                    {brandOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Category" required>
                  <select
                    className="input"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSubCategory("");
                      setThirdCategory("");
                    }}
                  >
                    <option value="">
                      {categoryOptions.length ? "Select category" : "Create a category first"}
                    </option>
                    {categoryOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Subcategory">
                  <select
                    className="input"
                    value={subCategory}
                    onChange={(e) => {
                      setSubCategory(e.target.value);
                      setThirdCategory("");
                    }}
                    disabled={!category || subcategoryOptions.length === 0}
                  >
                    <option value="">
                      {!category
                        ? "Select category first"
                        : subcategoryOptions.length
                        ? "Select subcategory"
                        : "No subcategories"}
                    </option>
                    {subcategoryOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="3rd Category">
                  <select
                    className="input"
                    value={thirdCategory}
                    onChange={(e) => setThirdCategory(e.target.value)}
                    disabled={!subCategory || thirdCategoryOptions.length === 0}
                  >
                    <option value="">
                      {!subCategory
                        ? "Select 2nd category first"
                        : thirdCategoryOptions.length
                        ? "Select 3rd category"
                        : "No 3rd categories"}
                    </option>
                    {thirdCategoryOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Stock">
                  <input
                    type="number"
                    className="input"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    min={0}
                    placeholder="20"
                  />
                </Field>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {categoryOptions.slice(0, 8).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setCategory(item);
                      setSubCategory("");
                      setThirdCategory("");
                    }}
                    className="chip-button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Pricing" subtitle="MRP is required. Selling price is optional for discounts.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="MRP (৳)" required>
                  <input
                    type="number"
                    className="input"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(Number(e.target.value))}
                    min={0}
                    placeholder="850"
                  />
                </Field>

                <Field label="Selling Price (৳)">
                  <input
                    type="number"
                    className="input"
                    value={salePrice === null ? "" : salePrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSalePrice(value === "" ? null : Number(value));
                    }}
                    min={0}
                    placeholder="650"
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <SummaryTile label="Store Price" value={`৳${salePrice ?? (regularPrice || 0)}`} />
                <SummaryTile label="Discount" value={discountPercent ? `${discountPercent}% OFF` : "No discount"} />
                <SummaryTile
                  label="Profit Helper"
                  value={salePrice ? `৳${Math.max(0, regularPrice - salePrice)} below MRP` : "MRP price"}
                />
              </div>
            </Panel>

            <Panel title="Images" subtitle={`Add up to ${MAX_IMAGES} images. First image becomes the product cover.`}>
              <div
                className={[
                  "rounded-xl border-2 border-dashed bg-gray-50 p-6 text-center transition",
                  dragging ? "border-black bg-white" : "border-gray-300",
                ].join(" ")}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addFiles(e.dataTransfer.files);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files);
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:bg-[#BE171F]"
                >
                  Choose Images
                </button>
                <p className="mt-2 text-sm text-gray-500">Drop product photos here or browse from your device.</p>
              </div>

              {images.length > 0 && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {images.map((img, index) => (
                    <div key={img.id} className="overflow-hidden rounded-xl border bg-white">
                      <div className="aspect-square bg-gray-100">
                        <img src={img.previewUrl} alt={img.file.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{img.file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(img.file.size)}</p>
                          </div>
                          {index === 0 && (
                            <span className="rounded-full bg-green-50 px-2 py-1 text-[11px] text-green-700">
                              Cover
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveImage(index, -1)}
                            className="mini-button"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            disabled={index === images.length - 1}
                            onClick={() => moveImage(index, 1)}
                            className="mini-button"
                          >
                            Down
                          </button>
                          <button type="button" onClick={() => removeImage(img.id)} className="mini-button-danger">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Product Video" subtitle={`Optional. Add one short MP4/WebM/MOV video up to ${MAX_VIDEO_MB}MB.`}>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                className="input"
                onChange={(e) => chooseVideo(e.target.files?.[0] || null)}
              />

              {videoPreviewUrl && (
                <div className="mt-4 overflow-hidden rounded-xl border bg-black">
                  <video src={videoPreviewUrl} controls muted className="max-h-80 w-full object-contain" />
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{videoFile?.name}</p>
                      <p className="text-xs text-gray-500">{videoFile ? formatFileSize(videoFile.size) : ""}</p>
                    </div>
                    <button type="button" onClick={() => chooseVideo(null)} className="mini-button-danger">
                      Remove Video
                    </button>
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Classification" subtitle="Use chips for better product filtering and search.">
              <div className="grid gap-4">
                <ChipInput label="Skin Type" values={skinType} onChange={setSkinType} suggestions={SKIN_PRESETS} />
                <ChipInput label="Concerns" values={concerns} onChange={setConcerns} suggestions={CONCERN_PRESETS} />
                <ChipInput label="Tags" values={tags} onChange={setTags} suggestions={[]} placeholder="kbeauty, new, bestseller" />
              </div>
            </Panel>

            <Panel title="Description" subtitle="Add product benefits, usage notes, ingredients, or warnings.">
              <textarea
                className="input min-h-40 resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write product details, how to use, benefits..."
              />
            </Panel>
          </section>

          <aside className="lg:sticky lg:top-6 h-fit">
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Ready Check</h2>
              <p className="mt-1 text-sm text-gray-500">Resolve required items before upload.</p>

              <div className="mt-5 space-y-2">
                {validationErrors.length === 0 ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    Product is ready to upload.
                  </div>
                ) : (
                  validationErrors.map((issue) => (
                    <div key={issue} className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                      {issue}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Preview</p>
                <p className="mt-2 font-semibold">{name || "Product name"}</p>
                <p className="text-sm text-gray-500">
                  {brand || "Brand"} / {category || "Category"}
                  {subCategory ? ` / ${subCategory}` : ""}
                  {thirdCategory ? ` / ${thirdCategory}` : ""}
                </p>
                <p className="mt-3 text-xl font-semibold text-[#BE171F]">৳{salePrice ?? (regularPrice || 0)}</p>
                {discountPercent && (
                  <p className="text-sm text-gray-500">
                    <span className="line-through">৳{regularPrice}</span> {discountPercent}% off
                  </p>
                )}
                <p className="mt-3 text-sm text-gray-600">{images.length} image(s) selected</p>
                <p className="mt-1 text-sm text-gray-600">{videoFile ? "1 video selected" : "No product video"}</p>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-lg bg-black px-5 py-3 text-white hover:bg-[#BE171F] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {stageLabel}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={resetForm}
                  className="w-full rounded-lg border px-5 py-3 hover:bg-gray-50 disabled:opacity-50"
                >
                  Reset Form
                </button>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
      {children}
    </section>
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
    <label className="block">
      <span className="text-sm font-medium text-gray-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function ChipInput({
  label,
  values,
  onChange,
  suggestions,
  placeholder = "Type and press Enter",
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add(value: string) {
    const clean = value.trim();
    if (!clean) return;
    if (values.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, clean]);
    setDraft("");
  }

  function remove(value: string) {
    onChange(values.filter((item) => item !== value));
  }

  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-2 rounded-xl border bg-white p-2">
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => remove(value)}
              className="rounded-full border bg-gray-100 px-3 py-1 text-sm hover:bg-red-50 hover:text-red-700"
            >
              {value} x
            </button>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add(draft);
              }
              if (e.key === "Backspace" && !draft && values.length > 0) {
                remove(values[values.length - 1]);
              }
            }}
            onBlur={() => add(draft)}
            className="min-w-44 flex-1 px-2 py-1 text-sm outline-none"
            placeholder={placeholder}
          />
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((item) => (
            <button key={item} type="button" onClick={() => add(item)} className="chip-button">
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
