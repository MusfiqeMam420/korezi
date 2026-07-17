"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/app/context/ToastContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
const MAX_IMAGES = 8;
const MAX_VIDEO_MB = 80;

type Product = {
  _id: string;
  name: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  thirdCategory?: string;
  regularPrice?: number;
  salePrice?: number | null;
  mrp?: number;
  price?: number;
  stock?: number;
  skinType?: string[];
  concerns?: string[];
  tags?: string[];
  images?: string[];
  video?: string;
  description?: string;
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

function listToText(values?: string[]) {
  return (values || []).join(", ");
}

function textToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function imageTextToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error } = useToast();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [regularPrice, setRegularPrice] = useState(0);
  const [salePrice, setSalePrice] = useState<number | null>(null);
  const [stock, setStock] = useState(0);
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [thirdCategory, setThirdCategory] = useState("");
  const [skinType, setSkinType] = useState("");
  const [concerns, setConcerns] = useState("");
  const [tags, setTags] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [video, setVideo] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [saveStep, setSaveStep] = useState("");

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [videoPreview]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/categories`, { credentials: "include", cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE}/api/brands`, { credentials: "include", cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([categoryData, brandData]) => {
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        setBrands(Array.isArray(brandData) ? brandData : []);
      })
      .catch(() => {
        setCategories([]);
        setBrands([]);
      });
  }, []);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    fetch(`${API_BASE}/api/products/${id}`, { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((product: Product) => {
        const regular = Number(product.regularPrice ?? product.mrp ?? product.price ?? 0);
        const sale =
          product.salePrice != null && Number(product.salePrice) > 0 && Number(product.salePrice) < regular
            ? Number(product.salePrice)
            : null;

        setName(product.name || "");
        setBrand(product.brand || "");
        setRegularPrice(regular);
        setSalePrice(sale);
        setStock(Number(product.stock || 0));
        setCategory(product.category || "");
        setSubCategory(product.subCategory || "");
        setThirdCategory(product.thirdCategory || "");
        setSkinType(listToText(product.skinType));
        setConcerns(listToText(product.concerns));
        setTags(listToText(product.tags));
        setImagesText((product.images || []).join("\n"));
        setVideo(product.video || "");
        setDescription(product.description || "");
      })
      .catch(() => error("Failed to load product."))
      .finally(() => setLoading(false));
  }, [id, error]);

  const brandOptions = useMemo(() => brands.map((item) => item.name).sort((a, b) => a.localeCompare(b)), [brands]);
  const categoryOptions = useMemo(() => categories.map((item) => item.name).sort((a, b) => a.localeCompare(b)), [categories]);
  const selectedCategory = categories.find((item) => item.name.toLowerCase() === category.toLowerCase());
  const subcategoryOptions = selectedCategory?.subcategories.map((item) => item.name) || [];
  const selectedSubcategory = selectedCategory?.subcategories.find((item) => item.name.toLowerCase() === subCategory.toLowerCase());
  const thirdCategoryOptions = selectedSubcategory?.children?.map((item) => item.name) || [];

  const images = imageTextToList(imagesText);
  const videoPreviewSrc = videoPreview || video.trim();

  function selectImages(files: FileList | null) {
    if (!files?.length) return;

    const selected = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, MAX_IMAGES);

    if (!selected.length) {
      error("Please choose image files only.");
      return;
    }

    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setImageFiles(selected);
    setImagePreviews(selected.map((file) => URL.createObjectURL(file)));
  }

  function clearSelectedImages() {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setImageFiles([]);
    setImagePreviews([]);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function selectVideo(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      error("Please choose a video file.");
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      error(`Video must be under ${MAX_VIDEO_MB}MB.`);
      return;
    }

    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }

  function clearVideo() {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview("");
    setVideo("");
    if (videoInputRef.current) videoInputRef.current.value = "";
  }

  async function uploadImages() {
    if (!imageFiles.length) return images;

    setSaveStep("Uploading images...");
    const formData = new FormData();
    imageFiles.forEach((file) => formData.append("images", file));

    const res = await fetch(`${API_BASE}/api/uploads/products`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !Array.isArray(data?.urls) || data.urls.length === 0) {
      throw new Error(data?.message || "Image upload failed");
    }

    return data.urls as string[];
  }

  async function uploadVideo() {
    if (!videoFile) return video.trim();

    setSaveStep("Uploading video...");
    const formData = new FormData();
    formData.append("video", videoFile);

    const res = await fetch(`${API_BASE}/api/uploads/product-video`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.url) {
      throw new Error(data?.message || "Video upload failed");
    }

    return String(data.url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      error("Product name is required.");
      return;
    }
    if (!regularPrice || regularPrice <= 0) {
      error("MRP must be greater than 0.");
      return;
    }
    if (salePrice != null && (salePrice <= 0 || salePrice >= regularPrice)) {
      error("Selling price must be less than MRP.");
      return;
    }

    setSaving(true);
    setSaveStep("Preparing update...");
    try {
      const nextImages = await uploadImages();
      const nextVideo = await uploadVideo();

      setSaveStep("Saving product...");
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim(),
          regularPrice: Number(regularPrice),
          salePrice: salePrice == null ? null : Number(salePrice),
          stock: Number(stock || 0),
          category: category.trim(),
          subCategory: subCategory.trim(),
          thirdCategory: thirdCategory.trim(),
          skinType: textToList(skinType),
          concerns: textToList(concerns),
          tags: textToList(tags),
          images: nextImages,
          video: nextVideo,
          description: description.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Product update failed");

      success("Product updated.");
      router.push("/products");
    } catch (err: any) {
      error(err?.message || "Product update failed.");
    } finally {
      setSaving(false);
      setSaveStep("");
    }
  }

  if (loading) {
    return <main className="p-8 text-gray-500">Loading product...</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Catalog</p>
          <h1 className="text-2xl font-semibold">Edit Product</h1>
          <p className="mt-1 text-sm text-gray-500">Update product details, media, tags, and pricing.</p>
        </div>
        <Link href="/products" className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-gray-50">
          Back to Products
        </Link>
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="grid gap-6">
          <Panel title="Product Details">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Product Name">
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Brand">
                <select className="input" value={brand} onChange={(e) => setBrand(e.target.value)}>
                  <option value="">Select brand</option>
                  {brandOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Category">
                <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory(""); setThirdCategory(""); }}>
                  <option value="">Select category</option>
                  {categoryOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Subcategory">
                <select className="input" value={subCategory} onChange={(e) => { setSubCategory(e.target.value); setThirdCategory(""); }}>
                  <option value="">No subcategory</option>
                  {subcategoryOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="3rd Category">
                <select className="input" value={thirdCategory} onChange={(e) => setThirdCategory(e.target.value)} disabled={!subCategory || thirdCategoryOptions.length === 0}>
                  <option value="">
                    {!subCategory ? "Select subcategory first" : thirdCategoryOptions.length ? "Select 3rd category" : "No 3rd categories"}
                  </option>
                  {thirdCategoryOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Stock">
                <input type="number" className="input" value={stock} onChange={(e) => setStock(Number(e.target.value))} min={0} />
              </Field>
            </div>
          </Panel>

          <Panel title="Pricing">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="MRP">
                <input type="number" className="input" value={regularPrice} onChange={(e) => setRegularPrice(Number(e.target.value))} min={0} />
              </Field>
              <Field label="Selling Price">
                <input
                  type="number"
                  className="input"
                  value={salePrice == null ? "" : salePrice}
                  onChange={(e) => setSalePrice(e.target.value === "" ? null : Number(e.target.value))}
                  min={0}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Media">
            <Field label="Image URLs (one per line)">
              <textarea className="input min-h-36 resize-y" value={imagesText} onChange={(e) => setImagesText(e.target.value)} />
            </Field>
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Re-upload Images</p>
                  <p className="text-xs text-gray-500">
                    Choose up to {MAX_IMAGES} images. Selected files replace current product images when you save.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="mini-button" onClick={() => imageInputRef.current?.click()}>
                    Choose Images
                  </button>
                  {imageFiles.length > 0 && (
                    <button type="button" className="mini-button-danger" onClick={clearSelectedImages}>
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => selectImages(e.target.files)}
              />
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {imagePreviews.map((src, index) => (
                    <div key={src} className="overflow-hidden rounded-xl border bg-white">
                      <img src={src} alt="" className="aspect-square w-full object-cover" />
                      <p className="truncate px-3 py-2 text-xs text-gray-500">{imageFiles[index]?.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {images.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Current Images</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {images.map((src) => (
                  <img key={src} src={src} alt="" className="aspect-square rounded-xl border object-cover" />
                ))}
                </div>
              </div>
            )}
            <div className="mt-4">
              <Field label="Product Video URL">
                <input className="input" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://..." />
              </Field>
              <div className="mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Video File</p>
                    <p className="text-xs text-gray-500">Upload MP4, WebM, or MOV. A file upload will replace the URL above on save.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="mini-button" onClick={() => videoInputRef.current?.click()}>
                      Choose Video
                    </button>
                    {(video || videoFile) && (
                      <button type="button" className="mini-button-danger" onClick={clearVideo}>
                        Remove Video
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/*"
                  className="hidden"
                  onChange={(e) => selectVideo(e.target.files?.[0])}
                />
                {videoFile && <p className="mt-3 text-xs text-gray-500">Selected: {videoFile.name}</p>}
              </div>
              {videoPreviewSrc && <video src={videoPreviewSrc} controls muted className="mt-3 max-h-72 w-full rounded-xl bg-black object-contain" />}
            </div>
          </Panel>

          <Panel title="Tags and Description">
            <div className="grid gap-4">
              <Field label="Skin Types (comma separated)">
                <input className="input" value={skinType} onChange={(e) => setSkinType(e.target.value)} />
              </Field>
              <Field label="Concerns (comma separated)">
                <input className="input" value={concerns} onChange={(e) => setConcerns(e.target.value)} />
              </Field>
              <Field label="Tags (comma separated)">
                <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
              </Field>
              <Field label="Description">
                <textarea className="input min-h-40 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
            </div>
          </Panel>
        </section>

        <aside className="h-fit rounded-xl border bg-white p-5 shadow-sm lg:sticky lg:top-6">
          <h2 className="text-lg font-semibold">Preview</h2>
          <p className="mt-2 font-medium">{name || "Product name"}</p>
          <p className="text-sm text-gray-500">
            {brand || "Brand"} / {category || "Category"}
            {subCategory ? ` / ${subCategory}` : ""}
            {thirdCategory ? ` / ${thirdCategory}` : ""}
          </p>
          <p className="mt-3 text-xl font-semibold text-[#BE171F]">৳{salePrice ?? regularPrice}</p>
          <p className="mt-3 text-sm text-gray-600">{images.length} image(s)</p>
          {imageFiles.length > 0 && <p className="text-sm text-[#BE171F]">{imageFiles.length} new image(s) selected</p>}
          <p className="text-sm text-gray-600">{videoPreviewSrc ? "Video attached" : "No video"}</p>
          {saveStep && <p className="mt-3 text-sm text-gray-500">{saveStep}</p>}

          <button
            disabled={saving}
            className="mt-5 w-full rounded-xl bg-black px-5 py-3 text-white hover:bg-[#BE171F] disabled:opacity-50"
          >
            {saving ? saveStep || "Saving..." : "Save Changes"}
          </button>
        </aside>
      </form>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
