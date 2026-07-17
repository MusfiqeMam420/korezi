"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import ProductImagePlaceholder from "@/components/ProductImagePlaceholder";
import KoreziAboutSection from "@/components/KoreziAboutSection";
import Footer from "@/components/Footer";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type Product = {
  _id: string;
  slug: string;
  name: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  stock: number;
  images?: string[];
  regularPrice: number;
  salePrice?: number | null;
  createdAt?: string;
};

type Brand = {
  _id: string;
  name: string;
};

type Category = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  subcategories?: { _id: string; name: string }[];
};

type Cover = {
  _id: string;
  title?: string;
  subtitle?: string;
  image: string;
  href?: string;
};

function normalizeProduct(p: Product) {
  return {
    _id: p._id,
    slug: p.slug,
    name: p.name,
    brand: p.brand || "",
    regularPrice: Number(p.regularPrice || 0),
    salePrice: p.salePrice == null ? null : Number(p.salePrice),
    stock: Number(p.stock || 0),
    images: p.images || [],
    category: p.category || "",
  };
}

function hasSale(p: Product) {
  return p.salePrice != null && Number(p.salePrice) > 0 && Number(p.salePrice) < Number(p.regularPrice);
}

function price(p?: Product | null) {
  if (!p) return 0;
  return hasSale(p) ? Number(p.salePrice) : Number(p.regularPrice || 0);
}

function imageUrl(src?: string) {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return `${API_BASE}${src.startsWith("/") ? "" : "/"}${src}`;
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [covers, setCovers] = useState<Cover[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const [productsRes, brandsRes, categoriesRes, coversRes] = await Promise.all([
          fetch(`${API_BASE}/api/products?page=1&limit=24`, { cache: "no-store" }),
          fetch(`${API_BASE}/api/brands`, { cache: "no-store" }).catch(() => null),
          fetch(`${API_BASE}/api/categories`, { cache: "no-store" }).catch(() => null),
          fetch(`${API_BASE}/api/covers`, { cache: "no-store" }).catch(() => null),
        ]);

        const productsData = await productsRes.json();
        if (!productsRes.ok) throw new Error(productsData?.message || "Failed to load products");

        const productList = Array.isArray(productsData?.items)
          ? productsData.items
          : Array.isArray(productsData)
          ? productsData
          : [];

        const brandData = brandsRes && brandsRes.ok ? await brandsRes.json() : [];
        const categoryData = categoriesRes && categoriesRes.ok ? await categoriesRes.json() : [];
        const coverData = coversRes && coversRes.ok ? await coversRes.json() : [];

        if (!ignore) {
          setItems(productList);
          setBrands(Array.isArray(brandData) ? brandData : []);
          setCategories(Array.isArray(categoryData) ? categoryData : []);
          setCovers(Array.isArray(coverData) ? coverData : []);
        }
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
  const bestSellers = useMemo(() => [...items].sort((a, b) => Number(hasSale(b)) - Number(hasSale(a))).slice(0, 8), [items]);
  const heroProduct = newArrivals[0] || items[0] || null;
  const dealProduct = items.find(hasSale) || heroProduct;
  const featuredCategories = categories.length
    ? categories.slice(0, 6).map((item) => item.name)
    : ["Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen", "Mask"];
  const featuredBrands = brands.length
    ? brands.slice(0, 12).map((item) => item.name)
    : ["COSRX", "The Ordinary", "AXIS-Y", "Anua", "Medicube", "iUNIK", "Laneige", "Missha"];
  const topCategories = useMemo(() => {
    const names = categories.length
      ? categories.map((item) => item.name)
      : Array.from(new Set(items.map((item) => item.category).filter(Boolean) as string[]));
    const fallbackNames = ["Skincare", "Makeup", "Hair Care", "Bath & Body", "Mom & Baby Care", "Accessories"];
    const sourceNames = (names.length ? names : fallbackNames).slice(0, 6);
    return sourceNames.map((name) => {
      const category = categories.find((item) => item.name.toLowerCase() === name.toLowerCase());
      const categoryProducts = items.filter((item) => item.category?.toLowerCase() === name.toLowerCase());
      const image = imageUrl(category?.image);

      return {
        name,
        href: `/categories/${encodeURIComponent(name)}`,
        image,
        count: categoryProducts.length,
      };
    });
  }, [categories, items]);

  return (
    <div className="bg-[#F7F8FB] text-gray-950">
      <CoverCarousel covers={covers} />

      {/* <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="grid gap-3 md:grid-cols-4">
          <StoreSignal title="Authentic K-beauty" text="Curated trusted skincare" />
          <StoreSignal title="COD ready" text="Fast checkout in Bangladesh" />
          <StoreSignal title="Routine filters" text="Shop by skin and concern" />
          <StoreSignal title="Fresh drops" text={`${items.length || "New"} products listed`} />
        </div>
      </section> */}

      <TopCategories categories={topCategories} />

      {/* <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_420px]">
        <DiscoveryPanel categories={featuredCategories} brands={featuredBrands} />
        <DealPanel product={dealProduct} />
      </section> */}

      <ProductSection
        eyebrow="Just landed"
        title="New Arrivals"
        text="Fresh skincare picks ready for your next routine."
        products={newArrivals}
        loading={loading}
        errorMsg={errorMsg}
        href="/shop?sort=newest"
      />

      <RoutineBuilder />

      <ProductSection
        eyebrow="Customer energy"
        title="Best Sellers"
        text="Products with offers, demand, and routine value."
        products={bestSellers}
        loading={loading}
        errorMsg=""
        href="/shop?sort=priceLow"
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="overflow-hidden rounded-[32px] bg-[#111111] text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
          <div className="grid lg:grid-cols-[1fr_360px]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-wide text-red-200">Shop smarter</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
                Build a skincare routine by concern, not confusion.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
                Start with your skin goal, compare product types, and move from cleanser to sunscreen without jumping between random pages.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/shop?skinType=Oily%20Skin" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-red-50">
                  Oily Skin Picks
                </Link>
                <Link href="/shop?concern=Hydration" className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                  Hydration Routine
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 border-t border-white/10 lg:border-l lg:border-t-0">
              <DarkMetric value="01" label="Cleanse" />
              <DarkMetric value="02" label="Treat" />
              <DarkMetric value="03" label="Repair" />
              <DarkMetric value="04" label="Protect" />
            </div>
          </div>
        </div>
      </section>

      <section id="about">
        <KoreziAboutSection />
      </section>

      <Footer />
    </div>
  );
}

function CoverCarousel({ covers }: { covers: Cover[] }) {
  const fallbackCovers: Cover[] = [
    {
      _id: "fallback-1",
      title: "Korezi skincare cover",
      subtitle: "Upload your own homepage covers from the admin panel.",
      image: "/banner-1.webp",
      href: "/shop",
    },
    {
      _id: "fallback-2",
      title: "Fresh skincare drops",
      subtitle: "Feature promotions, seasonal campaigns, and hero banners.",
      image: "/banner/1.png",
      href: "/shop?inStock=true",
    },
  ];
  const slides = covers.length ? covers : fallbackCovers;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const active = slides[index] || slides[0];

  return (
    <section className="mx-auto max-w-7xl px-3 pt-4 sm:px-6 sm:pt-6">
      <div className="relative overflow-hidden rounded-[19px] bg-[#111111] shadow-[0px_4px_16px_-31px_#f0f1f2]">
        <Link href={active.href || "/shop"} className="group block">
          <div className="relative h-[210px] sm:h-[390px] lg:h-[540px]">
            {slides.map((slide, slideIndex) => (
              <img
                key={slide._id}
                src={slide.image}
                alt={slide.title || "Korezi cover"}
                className={[
                  "absolute inset-0 h-full w-full object-cover transition duration-700",
                  slideIndex === index ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]",
                ].join(" ")}
              />
            ))}
          </div>
        </Link>

        {slides.length > 1 && (
          <div className="absolute bottom-5 right-5 flex gap-2">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide._id}
                type="button"
                onClick={() => setIndex(slideIndex)}
                className={`h-2.5 rounded-full bg-white transition-all ${slideIndex === index ? "w-8" : "w-2.5 opacity-50"}`}
                aria-label={`Show cover ${slideIndex + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StoreSignal({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{text}</p>
    </div>
  );
}

function TopCategories({
  categories,
}: {
  categories: { name: string; href: string; image: string; count: number }[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#BE171F]">ALL FAV</p>
          <h2 className="mt-1 text-3xl font-semibold">Top Categoris</h2>
        </div>
        <Link href="/shop" className="inline-flex items-center gap-2 rounded-full border border-[#DBD9D9] bg-white px-4 py-2 text-sm font-medium  transition hover:border-[#BE171F] hover:text-[#BE171F]">
          See All <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="mt-7 flex gap-5 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-6">
        {categories.map((category) => (
          <Link key={category.name} href={category.href} className="group min-w-[130px] flex-none text-center sm:min-w-0">
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-[conic-gradient(from_145deg,#7b2024_0deg,#be171f_78deg,#f51d2f_148deg,#ffffff_206deg,#8d282b_282deg,#be171f_360deg)] p-[5px]  transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_65px_rgba(190,23,31,0.30)] sm:h-40 sm:w-40">
              <div className="h-full w-full overflow-hidden rounded-full bg-gradient-to-br from-white via-[#fff5f5] to-[#f6d8d9] p-1">
                {category.image ? (
                  <img src={category.image} alt={category.name} className="h-full w-full rounded-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <ProductImagePlaceholder className="rounded-full transition duration-500 group-hover:scale-105" />
                )}
              </div>
            </div>
            <p className="mt-3 text-base font-bold text-gray-950 sm:text-lg">{category.name}</p>
            {category.count > 0 && <p className="mt-0.5 text-xs font-medium text-gray-400">{category.count} item{category.count === 1 ? "" : "s"}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}

function DiscoveryPanel({ categories, brands }: { categories: string[]; brands: string[] }) {
  return (
    <div className="rounded-[32px] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#BE171F]">Discovery</p>
          <h2 className="mt-1 text-2xl font-semibold">Shop without getting lost</h2>
        </div>
        <Link href="/shop" className="rounded-full border border-[#DBD9D9] px-4 py-2 text-sm font-semibold hover:border-black">
          View all
        </Link>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ChipCloud title="Categories" values={categories} hrefFor={(value) => `/shop?category=${encodeURIComponent(value)}`} />
        <ChipCloud title="Brands" values={brands} hrefFor={(value) => `/shop?brand=${encodeURIComponent(value)}`} />
      </div>
    </div>
  );
}

function ChipCloud({ title, values, hrefFor }: { title: string; values: string[]; hrefFor: (value: string) => string }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
          <Link key={value} href={hrefFor(value)} className="rounded-full border bg-[#FAFBFF] px-3 py-2 text-xs font-semibold transition hover:border-[#BE171F] hover:bg-red-50 hover:text-[#BE171F]">
            {value}
          </Link>
        ))}
      </div>
    </div>
  );
}

function DealPanel({ product }: { product: Product | null }) {
  const img = imageUrl(product?.images?.[0]);

  return (
    <div className="overflow-hidden rounded-[32px] bg-[#BE171F] text-white shadow-sm">
      <div className="p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/65">Deal spotlight</p>
        <h2 className="mt-2 text-2xl font-semibold">{product?.name || "Fresh skincare offer"}</h2>
        <p className="mt-2 text-sm leading-6 text-white/75">A fast route to the product customers should notice first.</p>
      </div>
      <div className="mx-4 overflow-hidden rounded-[24px] bg-white/12">
        {img ? <img src={img} alt={product?.name || ""} className="h-52 w-full object-cover" /> : <img src="/banner/2.png" alt="" className="h-52 w-full object-cover" />}
      </div>
      <div className="flex items-center justify-between gap-4 p-6">
        <p className="text-3xl font-semibold">{product ? `৳${price(product)}` : "Shop"}</p>
        <Link href={product ? `/product/${product.slug}` : "/shop"} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:border-[#BE171F] hover:text-[#BE171F]">
          Open
        </Link>
      </div>
    </div>
  );
}

function ProductSection({
  eyebrow,
  title,
  text,
  products,
  loading,
  errorMsg,
  href,
}: {
  eyebrow: string;
  title: string;
  text: string;
  products: Product[];
  loading: boolean;
  errorMsg: string;
  href: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#BE171F]">{eyebrow}</p>
          <h2 className="mt-1 text-3xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-gray-500">{text}</p>
        </div>
        <Link href={href} className="rounded-full border bg-white px-4 py-2 border-[#DBD9D9] text-sm font-semibold transition hover:border-[#BE171F] hover:text-[#BE171F]">
          View all
        </Link>
      </div>

      <div className="mt-6">
        {loading ? (
          <ProductSkeleton />
        ) : errorMsg ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">{errorMsg}</div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white p-8 text-sm text-gray-500">No products yet.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={normalizeProduct(p)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="aspect-square bg-white">
            <ProductImagePlaceholder pulse />
          </div>
          <div className="space-y-3 p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-5 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RoutineBuilder() {
  const steps = [
    { title: "Cleanse", text: "Start with a gentle base.", href: "/shop?category=Cleanser" },
    { title: "Hydrate", text: "Layer toner, essence, or serum.", href: "/shop?concern=Hydration" },
    { title: "Repair", text: "Support barrier and texture.", href: "/shop?concern=Barrier%20Repair" },
    { title: "Protect", text: "Finish with sunscreen.", href: "/shop?category=Sunscreen" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
        {steps.map((step, idx) => (
          <Link key={step.title} href={step.href} className="group min-w-[220px] flex-none rounded-[28px] border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:min-w-[260px] lg:min-w-0">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#111111] text-sm font-semibold text-white group-hover:bg-[#BE171F]">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-500">{step.text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DarkMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-b border-r border-white/10 p-6 last:border-r-0">
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-white/55">{label}</p>
    </div>
  );
}
