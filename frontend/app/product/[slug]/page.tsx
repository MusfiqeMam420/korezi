"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/app/context/CartContext";
import ProductCard from "@/components/ProductCard";
import ProductImagePlaceholder from "@/components/ProductImagePlaceholder";
import { useToast } from "@/app/context/ToastContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type Product = {
  _id: string;
  slug: string;
  name: string;
  brand?: string;
  regularPrice: number;
  salePrice?: number | null;
  stock: number;
  category?: string;
  subCategory?: string;
  thirdCategory?: string;
  skinType?: string[];
  concerns?: string[];
  tags?: string[];
  images?: string[];
  video?: string;
  videoLikes?: number;
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

function resolveImage(src?: string) {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return `${API_BASE}${src.startsWith("/") ? "" : "/"}${src}`;
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

function discountPercent(p: Pick<Product, "regularPrice" | "salePrice">) {
  if (!hasSale(p)) return null;
  return Math.round(((Number(p.regularPrice) - Number(p.salePrice)) / Number(p.regularPrice)) * 100);
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
  const [activeImg, setActiveImg] = useState("");
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoVisible, setVideoVisible] = useState(true);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoLiked, setVideoLiked] = useState(false);
  const [videoLikeCount, setVideoLikeCount] = useState(0);
  const [videoLikeSaving, setVideoLikeSaving] = useState(false);

  const canAdd = useMemo(() => {
    if (!product) return false;
    return product.stock > 0 && qty >= 1 && qty <= product.stock;
  }, [product, qty]);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    fetch(`${API_BASE}/api/products/slug/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const p = data?.product || data;
        setProduct(p || null);
        setActiveImg(resolveImage(p?.images?.[0]));
        setFailedImages({});
        setVideoOpen(false);
        setVideoVisible(true);
        setVideoLikeCount(Math.max(0, Number(p?.videoLikes || 0)));
        setVideoLiked(typeof window !== "undefined" ? localStorage.getItem(`korezi-video-like:${p?._id}`) === "1" : false);
        setQty(1);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    fetch(`${API_BASE}/api/products/similar/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setSimilar(product ? arr.filter((x: any) => x._id !== product._id) : arr);
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
          image: activeImg || resolveImage(product.images?.[0]),
          regularPrice: Number(product.regularPrice),
          salePrice: product.salePrice == null ? null : Number(product.salePrice),
        },
        qty
      );

      success("Added to cart");
    } catch {
      error("Add to cart failed");
    }
  }

  async function toggleVideoLike() {
    if (!product || videoLikeSaving) return;

    const nextLiked = !videoLiked;
    const storageKey = `korezi-video-like:${product._id}`;
    const previousLiked = videoLiked;
    const previousCount = videoLikeCount;

    setVideoLiked(nextLiked);
    setVideoLikeCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    setVideoLikeSaving(true);

    try {
      const res = await fetch(`${API_BASE}/api/products/${product._id}/video-like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: nextLiked }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Like update failed");

      setVideoLikeCount(Math.max(0, Number(data.videoLikes || 0)));
      if (nextLiked) {
        localStorage.setItem(storageKey, "1");
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      setVideoLiked(previousLiked);
      setVideoLikeCount(previousCount);
      error("Video like failed");
    } finally {
      setVideoLikeSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="bg-[#F7F8FB] px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_456px]">
          <div className="aspect-square overflow-hidden rounded-[28px] bg-white shadow-sm">
            <ProductImagePlaceholder pulse />
          </div>
          <div className="space-y-4 rounded-[28px] bg-white p-6 shadow-sm">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
            <div className="h-10 w-4/5 animate-pulse rounded bg-gray-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="bg-[#F7F8FB] px-6 py-16">
        <div className="mx-auto max-w-4xl rounded-[28px] bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">Product not found</h1>
          <p className="mt-2 text-gray-600">This product may be removed or the link is wrong.</p>
          <Link href="/shop" className="mt-6 inline-block rounded-xl bg-black px-6 py-3 text-white hover:bg-[#BE171F]">
            Back to shop
          </Link>
        </div>
      </main>
    );
  }

  const images = product.images?.length ? product.images.map(resolveImage) : [""];
  const videoUrl = resolveImage(product.video);
  const showVideoRail = Boolean(videoUrl && videoVisible);
  const mainImg = activeImg || images[0];
  const mainImgFailed = mainImg ? failedImages[mainImg] : false;
  const sell = sellingPrice(product);
  const showMrp = hasSale(product);
  const off = discountPercent(product);
  const inStock = product.stock > 0;
  const savings = showMrp ? Math.max(0, Number(product.regularPrice) - sell) : 0;
  const total = sell * qty;

  const infoChips = [
    product.brand ? { label: "Brand", value: product.brand, href: `/brands/${toSlug(product.brand)}` } : null,
    product.category ? { label: "Category", value: product.category, href: `/categories/${toSlug(product.category)}` } : null,
    product.subCategory ? { label: "Type", value: product.subCategory } : null,
    product.thirdCategory ? { label: "Sub type", value: product.thirdCategory } : null,
  ].filter(Boolean) as { label: string; value: string; href?: string }[];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7F8FB] pb-24 lg:pb-0">
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 lg:py-10">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link href="/shop" className="hover:text-black">Shop</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/categories/${toSlug(product.category)}`} className="hover:text-black">
                {product.category}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="max-w-[70vw] truncate text-gray-900">{product.name}</span>
        </nav>

        <section
          className={[
            "mt-5 grid min-w-0 gap-5 sm:mt-6 sm:gap-6 xl:justify-center",
            showVideoRail
              ? "lg:grid-cols-[108px_minmax(0,1fr)_432px] xl:grid-cols-[126px_minmax(0,750px)_432px]"
              : "lg:grid-cols-[minmax(0,1fr)_432px] xl:grid-cols-[minmax(0,750px)_432px]",
          ].join(" ")}
        >
          {showVideoRail && (
            <div className="hidden lg:block">
              <div className="product-video-float sticky top-28 w-[104px] xl:w-[118px]">
                <button
                  type="button"
                  onClick={() => setVideoVisible(false)}
                  className="absolute -right-2 -top-2 z-20 grid h-7 w-7 place-items-center rounded-full bg-black/75 text-lg leading-none text-white shadow-lg transition hover:bg-[#BE171F]"
                  aria-label="Hide product video"
                >
                  ×
                </button>
                <button
                  type="button"
                  onClick={() => setVideoOpen(true)}
                  className="group block w-full overflow-hidden rounded-[22px] bg-black shadow-[0_3px_10px_rgb(0,0,0,0.2)] ring-4 ring-white transition hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.34)]"
                  aria-label="Play product video"
                >
                  <div className="relative aspect-[9/16]">
                    <video src={videoUrl} muted loop playsInline autoPlay className="h-full w-full object-cover" />
                    <span className="absolute inset-0 grid place-items-center bg-black/10">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-black shadow-lg transition group-hover:scale-110">
                        <PlayIcon className="ml-0.5 h-4 w-4 fill-current" />
                      </span>
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="min-w-0 space-y-4">
            <div className="relative overflow-hidden rounded-[24px] border border-black/5 bg-white p-2 sm:rounded-[28px] sm:p-3">
              <div className="absolute left-6 top-6 z-10 flex flex-wrap gap-2">
                {off && <span className="rounded-full bg-[#BE171F] px-3 py-1.5 text-xs font-semibold text-white">{off}% off</span>}
                {product.category && <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-900 shadow-sm">{product.category}</span>}
              </div>

              <div className="h-[360px] overflow-hidden rounded-[20px] bg-[#EEF2F7] sm:aspect-[1.05/1] sm:h-auto sm:rounded-[22px] lg:h-[min(64vh,660px)] lg:aspect-auto">
                {mainImg && !mainImgFailed ? (
                  <img
                    src={mainImg}
                    alt={product.name}
                    className="h-full w-full object-cover object-center transition duration-500 hover:scale-[1.02]"
                    onError={() => setFailedImages((prev) => ({ ...prev, [mainImg]: true }))}
                  />
                ) : (
                  <ProductImagePlaceholder />
                )}
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 rounded-2xl bg-white/92 px-3 py-2 text-xs shadow-sm backdrop-blur sm:bottom-6 sm:left-6 sm:right-6 sm:px-4 sm:py-2.5">
                <span className="min-w-0 truncate font-medium text-gray-900">{images.length} product image{images.length === 1 ? "" : "s"}</span>
                <span className={["shrink-0", inStock ? "text-green-700" : "text-red-600"].join(" ")}>{inStock ? "Ready to ship" : "Unavailable"}</span>
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-6 sm:gap-3 sm:overflow-visible sm:pb-0">
                {images.map((img, idx) => {
                  const selected = (activeImg || images[0]) === img;
                  return (
                    <button
                      type="button"
                      key={`${img}-${idx}`}
                      onClick={() => setActiveImg(img)}
                      className={[
                        "h-[82px] w-[82px] shrink-0 overflow-hidden rounded-2xl border bg-white p-1 transition sm:aspect-square sm:h-auto sm:w-auto sm:shrink",
                        selected ? "border-[#BE171F] shadow-sm ring-2 ring-[#BE171F]/15" : "border-gray-200 hover:border-gray-400",
                      ].join(" ")}
                    >
                      {img && !failedImages[img] ? (
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full rounded-xl object-cover"
                          onError={() => setFailedImages((prev) => ({ ...prev, [img]: true }))}
                        />
                      ) : (
                        <ProductImagePlaceholder />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

          </div>

          <aside className="min-w-0 h-fit rounded-[24px] border border-black/5 bg-white p-4 sm:rounded-[28px] sm:p-5 lg:sticky lg:top-20">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {product.brand && <p className="text-sm font-semibold uppercase tracking-wide text-[#BE171F]">{product.brand}</p>}
                <h1 className="mt-1.5 text-2xl font-semibold leading-tight text-gray-950 lg:text-[28px]">{product.name}</h1>
              </div>
              <span className={[
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                inStock ? "border-green-600 bg-[#00c950] text-white" : "border-red-200 bg-red-50 text-red-700",
              ].join(" ")}>
                {inStock ? `${product.stock} in stock` : "Out of stock"}
              </span>
            </div>

            {infoChips.length > 0 && (
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {infoChips.map((chip) =>
                  chip.href ? (
                    <Link key={`${chip.label}-${chip.value}`} href={chip.href} className="rounded-2xl border border-[#EAEAEA] bg-[#FFFFFF] p-2.5 text-xs transition hover:border-[#BE171F] hover:bg-white">
                      <span className="block text-gray-500">{chip.label}</span>
                      <b className="mt-1 block truncate text-gray-950">{chip.value}</b>
                    </Link>
                  ) : (
                    <span key={`${chip.label}-${chip.value}`} className="rounded-2xl border border-[#EAEAEA] bg-[#FFFFFF] p-2.5 text-xs">
                      <span className="block text-gray-500">{chip.label}</span>
                      <b className="mt-1 block truncate text-gray-950">{chip.value}</b>
                    </span>
                  )
                )}
              </div>
            )}

            <div className="mt-5 overflow-hidden rounded-3xl border bg-[#111111] text-white">
              <div className="p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/60">Today&apos;s price</p>
                    <p className="mt-1 text-3xl font-semibold">&#2547;{sell}</p>
                    {showMrp && <p className="mt-1 text-sm text-white/45 line-through">&#2547;{product.regularPrice}</p>}
                  </div>
                  {off && <span className="rounded-full bg-[#BE171F] px-3 py-1.5 text-sm font-semibold">{off}% off</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 border-t border-white/10 text-sm">
                <div className="p-3.5">
                  <p className="text-white/50">You save</p>
                  <p className="font-semibold">&#2547;{savings}</p>
                </div>
                <div className="border-l border-white/10 p-3.5">
                  <p className="text-white/50">Subtotal</p>
                  <p className="font-semibold">&#2547;{total}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-[#DBD9D9] bg-[#FAFBFF] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Quantity</p>
                  <p className="mt-1 text-xs text-gray-500">{inStock ? `Choose up to ${product.stock}` : "Unavailable right now"}</p>
                </div>
                <div className="grid h-12 w-36 grid-cols-3 overflow-hidden rounded-2xl border border-[#DBD9D9] bg-white">
                  <button type="button" className="text-lg hover:bg-gray-50 disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
                    -
                  </button>
                  <div className="flex items-center justify-center text-sm font-semibold">{qty}</div>
                  <button type="button" className="text-lg hover:bg-gray-50 disabled:opacity-30" onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))} disabled={!inStock || qty >= product.stock}>
                    +
                  </button>
                </div>
              </div>
              {inStock && product.stock <= 3 && <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">Only {product.stock} left. Order soon.</p>}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                disabled={!canAdd}
                onClick={addToCart}
                className="rounded-2xl cursor-pointer bg-[#BE171F] px-5 py-4 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to cart
              </button>
              <Link href="/cart" className="rounded-2xl bg-black text-white px-5 py-4 text-center font-semibold transition hover:bg-red-700">
                View cart
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-3xl border border-[#DBD9D9] text-center text-xs">
              <MiniPerk title="COD" text="Available" />
              <MiniPerk title="Support" text="Order help" />
              <MiniPerk title="Secure" text="Checkout" />
            </div>

          </aside>
        </section>

        <section className="mt-5 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:w-full sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:pb-0">
          <TrustItem title="Authentic stock" text="Sourced from trusted suppliers" mark="01" />
          <TrustItem title="Fast checkout" text="Cart and COD ready" mark="02" />
          <TrustItem title="Skin-first picks" text="Filter by concern or skin type" mark="03" />
        </section>

        <section className="mt-7 rounded-[24px] border border-black/5 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.05)] lg:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DBD9D9] pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#BE171F]">Product information</p>
              <h2 className="mt-1 text-xl font-semibold text-gray-950">Details</h2>
            </div>
            <span className="rounded-full bg-[#FAFBFF] px-3 py-1.5 text-xs font-medium text-gray-500">Routine-ready notes</span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
            <div className="rounded-[18px]  p-4">
              <p className="text-sm font-semibold text-gray-950">Description</p>
              {product.description ? (
                <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-line pr-2 text-sm leading-6 text-gray-700">{product.description}</p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-gray-500">No description added yet.</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-[18px]  p-4">
                <p className="text-sm font-semibold text-gray-950">Product Details</p>
                <div className="mt-3 space-y-3">
                  <TagGroup title="Skin Type" values={product.skinType} hrefFor={(value) => `/skin-types/${toSlug(value)}`} />
                  <TagGroup title="Concerns" values={product.concerns} hrefFor={(value) => `/concerns/${toSlug(value)}`} />
                  <TagGroup title="Tags" values={product.tags} hrefFor={(value) => `/tags/${toSlug(value)}`} />
                </div>
              </div>

              <div className="rounded-[18px]  p-4">
                <p className="text-sm font-semibold text-gray-950">Shipping & Care</p>
                <ul className="mt-3 space-y-2 text-sm leading-5 text-gray-700">
                  <li>Cash on delivery is available for eligible orders.</li>
                  <li>Keep products away from direct sunlight and heat.</li>
                  <li>Patch test before full use, especially for active ingredients.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
          <FeaturePanel title="Smart Filters" text="Tap skin type, concern, or tag chips to discover matching products instantly." />
          <FeaturePanel title="Transparent Pricing" text="Sale price, regular price, savings, and subtotal stay visible before checkout." />
          <FeaturePanel title="Better Buying" text="Stock status, low-stock alerts, and delivery cues help customers decide faster." />
        </section>

        {similar.length > 0 && (
          <section className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#BE171F]">Complete the routine</p>
                <h2 className="mt-1 text-2xl font-semibold">Similar Products</h2>
                <p className="mt-1 text-sm text-gray-500">More picks from nearby categories</p>
              </div>
              <Link href="/shop" className="rounded-full border border-[#DBD9D9] bg-white px-4 py-2 text-sm text-gray-700 hover:border-black hover:text-black">
                View all
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {similar.slice(0, 8).map((p) => (
                <ProductCard key={p._id} product={p as any} />
              ))}
            </div>
          </section>
        )}
      </div>

      <motion.div
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 p-3 shadow-[0_-12px_40px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-gray-500">{product.name}</p>
            <p className="font-semibold text-[#BE171F]">&#2547;{sell}</p>
          </div>
          <button
            disabled={!canAdd}
            onClick={addToCart}
            className="rounded-2xl bg-[#BE171F] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Add to cart
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {videoOpen && videoUrl && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/82 p-3 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setVideoOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="relative h-[min(88vh,780px)] w-full max-w-[390px] overflow-hidden rounded-[10px] bg-black shadow-[0_30px_100px_rgba(0,0,0,0.55)] ring-1 ring-white/20"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <button
              type="button"
              onClick={() => setVideoOpen(false)}
              className="absolute right-3 top-7 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/35 text-2xl leading-none text-white shadow-lg backdrop-blur transition hover:bg-black/55"
              aria-label="Close video"
            >
              ×
            </button>
            <video
              src={videoUrl}
              autoPlay
              loop
              playsInline
              muted={videoMuted}
              className="absolute inset-0 h-full w-full bg-black object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/40" />
            <div className="absolute left-0 right-0 top-0 z-10 h-1 bg-white/20">
              <div className="h-full w-3/4 rounded-r-full bg-white/80" />
            </div>

            <button
              type="button"
              onClick={() => setVideoMuted((value) => !value)}
              className="absolute right-16 top-7 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/35 text-white shadow-lg backdrop-blur transition hover:bg-black/55"
              aria-label={videoMuted ? "Unmute video" : "Mute video"}
            >
              {videoMuted ? <VolumeOffIcon className="h-5 w-5" /> : <VolumeOnIcon className="h-5 w-5" />}
            </button>

            <div className="absolute right-3 top-1/2 z-20 grid -translate-y-1/2 gap-4">
              <button
                type="button"
                onClick={toggleVideoLike}
                disabled={videoLikeSaving}
                className={[
                  "grid min-h-14 w-12 place-items-center rounded-full text-[0px] shadow-lg backdrop-blur transition disabled:opacity-60",
                  videoLiked ? "bg-[#BE171F] text-white" : "bg-white/80 text-gray-950 hover:bg-white",
                ].join(" ")}
                aria-label={videoLiked ? "Unlike video" : "Like video"}
              >
                <HeartIcon className={["h-5 w-5", videoLiked ? "fill-current" : ""].join(" ")} />
                <span className="text-[10px] font-bold leading-none">{videoLikeCount}</span>
                ♥
              </button>
              <button type="button" className="hidden">
                ↗
              </button>
            </div>

            <div className="absolute bottom-6 left-1/2 z-20 w-[calc(100%-48px)] -translate-x-1/2 rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur">
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {mainImg && !mainImgFailed ? (
                    <img src={mainImg} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ProductImagePlaceholder />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-semibold uppercase tracking-wide text-gray-900">{product.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-950">&#2547;{sell}</span>
                    {showMrp && <span className="text-xs text-gray-400 line-through">&#2547;{product.regularPrice}</span>}
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={!canAdd}
                onClick={addToCart}
                className="mt-3 w-full rounded-lg bg-[#111111] px-4 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#BE171F] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to cart
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function TrustItem({ title, text, mark }: { title: string; text: string; mark: string }) {
  return (
    <div className="min-w-[205px] flex-none rounded-3xl border border-black/5 bg-white p-3 shadow-sm sm:min-w-0 sm:w-full sm:p-4">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className="rounded-2xl bg-[#BE171F] px-2.5 py-1 text-xs font-semibold text-white">{mark}</span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">{text}</p>
        </div>
      </div>
    </div>
  );
}

function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M8 5.8c0-1 .98-1.62 1.84-1.1l9.08 5.5a1.3 1.3 0 0 1 0 2.22l-9.08 5.5A1.22 1.22 0 0 1 8 16.88V5.8Z" />
    </svg>
  );
}

function VolumeOnIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M16 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.8a9 9 0 0 1 0 12.4" />
    </svg>
  );
}

function VolumeOffIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="m19 9-6 6" />
      <path d="m13 9 6 6" />
    </svg>
  );
}

function HeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function MiniPerk({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-r px-2 py-2.5 border-[#DBD9D9] last:border-r-0">
      <p className="font-semibold text-gray-950">{title}</p>
      <p className="mt-1 text-gray-500">{text}</p>
    </div>
  );
}

function FeaturePanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="min-w-[255px] flex-none rounded-[28px] border border-black/5 bg-white p-5 lg:min-w-0 lg:w-full">
      <p className="text-sm font-semibold text-[#BE171F]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
    </div>
  );
}

function TagGroup({
  title,
  values,
  hrefFor,
}: {
  title: string;
  values?: string[];
  hrefFor: (value: string) => string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {values?.length ? (
          values.map((value) => (
            <Link
              key={value}
              href={hrefFor(value)}
              className="rounded-full border border-[#DBD9D9] bg-[#F2F2F2] px-2.5 py-1 text-xs transition hover:border-[#BE171F] hover:bg-[#BE171F] hover:text-white"
            >
              {value}
            </Link>
          ))
        ) : (
          <span className="text-sm text-gray-400">Not specified</span>
        )}
      </div>
    </div>
  );
}
