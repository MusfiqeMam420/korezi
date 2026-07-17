"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import ProductImagePlaceholder from "@/components/ProductImagePlaceholder";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type Product = {
  _id: string;
  slug: string;
  name: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  thirdCategory?: string;
  skinType?: string[];
  regularPrice: number;
  salePrice?: number | null;
  price: number;
  stock: number;
  images?: string[];
};

type Brand = {
  _id: string;
  name: string;
};

type Category = {
  _id: string;
  name: string;
  subcategories?: { _id: string; name: string; children?: { _id?: string; name: string }[] }[];
};

type ApiResponse = {
  items: Product[];
  total: number;
  page: number;
  pages: number;
};

const skinOptions = ["All Skin Types", "Dry Skin", "Oily Skin", "Combination Skin", "Sensitive Skin"];
const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "priceLow", label: "Price: Low to High" },
  { value: "priceHigh", label: "Price: High to Low" },
  { value: "name", label: "Name A-Z" },
];
const selectClass = "h-11 w-full rounded-2xl border border-[#DBD9D9] bg-[#FAFBFF] px-4 text-sm outline-none focus:border-[#BE171F]";

export default function ShopClient() {
  const params = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(params.get("search") || "");
  const [brand, setBrand] = useState(params.get("brand") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [subCategory, setSubCategory] = useState(params.get("subCategory") || "");
  const [thirdCategory, setThirdCategory] = useState(params.get("thirdCategory") || "");
  const [skinType, setSkinType] = useState(params.get("skinType") || "");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") || "");
  const [inStock, setInStock] = useState(params.get("inStock") === "true");
  const [sort, setSort] = useState(params.get("sort") || "newest");
  const [page, setPage] = useState(Number(params.get("page") || 1));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse>({ items: [], total: 0, page: 1, pages: 1 });

  const selectedCategory = categories.find((item) => item.name === category);
  const subcategories = selectedCategory?.subcategories || [];
  const selectedSubcategory = subcategories.find((item) => item.name === subCategory);
  const thirdCategories = selectedSubcategory?.children || [];

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/brands`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE}/api/categories`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([brandData, categoryData]) => {
        setBrands(Array.isArray(brandData) ? brandData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      })
      .catch(() => {
        setBrands([]);
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, brand, category, subCategory, thirdCategory, skinType, minPrice, maxPrice, inStock, sort]);

  useEffect(() => {
    if (!subcategories.some((item) => item.name === subCategory)) {
      setSubCategory("");
      setThirdCategory("");
    }
  }, [subCategory, subcategories]);

  useEffect(() => {
    if (thirdCategory && !thirdCategories.some((item) => item.name === thirdCategory)) setThirdCategory("");
  }, [thirdCategory, thirdCategories]);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (search.trim()) sp.set("search", search.trim());
    if (brand) sp.set("brand", brand);
    if (category) sp.set("category", category);
    if (subCategory) sp.set("subCategory", subCategory);
    if (thirdCategory) sp.set("thirdCategory", thirdCategory);
    if (skinType) sp.set("skinType", skinType);
    if (minPrice) sp.set("minPrice", minPrice);
    if (maxPrice) sp.set("maxPrice", maxPrice);
    if (inStock) sp.set("inStock", "true");
    if (sort !== "newest") sp.set("sort", sort);
    if (page > 1) sp.set("page", String(page));

    const query = sp.toString();
    router.replace(query ? `/shop?${query}` : "/shop", { scroll: false });
  }, [search, brand, category, subCategory, thirdCategory, skinType, minPrice, maxPrice, inStock, sort, page, router]);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("search", search.trim());
    if (brand) p.set("brand", brand);
    if (category) p.set("category", category);
    if (subCategory) p.set("subCategory", subCategory);
    if (thirdCategory) p.set("thirdCategory", thirdCategory);
    if (skinType) p.set("skinType", skinType);
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    if (inStock) p.set("inStock", "true");
    p.set("sort", sort);
    p.set("page", String(page));
    p.set("limit", "16");
    return p.toString();
  }, [search, brand, category, subCategory, thirdCategory, skinType, minPrice, maxPrice, inStock, sort, page]);

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
      .catch(() => setData({ items: [], total: 0, page: 1, pages: 1 }))
      .finally(() => setLoading(false));
  }, [qs]);

  const activeFilters = [
    search.trim() ? { label: `Search: ${search.trim()}`, clear: () => setSearch("") } : null,
    brand ? { label: `Brand: ${brand}`, clear: () => setBrand("") } : null,
    category ? { label: `Category: ${category}`, clear: () => setCategory("") } : null,
    subCategory ? { label: `Type: ${subCategory}`, clear: () => setSubCategory("") } : null,
    thirdCategory ? { label: `3rd: ${thirdCategory}`, clear: () => setThirdCategory("") } : null,
    skinType ? { label: `Skin: ${skinType}`, clear: () => setSkinType("") } : null,
    minPrice ? { label: `Min ৳${minPrice}`, clear: () => setMinPrice("") } : null,
    maxPrice ? { label: `Max ৳${maxPrice}`, clear: () => setMaxPrice("") } : null,
    inStock ? { label: "In stock", clear: () => setInStock(false) } : null,
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const hasFilters = activeFilters.length > 0;
  const firstResult = data.total === 0 ? 0 : (data.page - 1) * 16 + 1;
  const lastResult = Math.min(data.total, data.page * 16);

  function clearFilters() {
    setSearch("");
    setBrand("");
    setCategory("");
    setSubCategory("");
    setThirdCategory("");
    setSkinType("");
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    setSort("newest");
    setPage(1);
  }

  const filters = (
    <FilterPanel
      search={search}
      setSearch={setSearch}
      brand={brand}
      setBrand={setBrand}
      brands={brands}
      category={category}
      setCategory={setCategory}
      categories={categories}
      subCategory={subCategory}
      setSubCategory={setSubCategory}
      subcategories={subcategories}
      thirdCategory={thirdCategory}
      setThirdCategory={setThirdCategory}
      thirdCategories={thirdCategories}
      skinType={skinType}
      setSkinType={setSkinType}
      minPrice={minPrice}
      setMinPrice={setMinPrice}
      maxPrice={maxPrice}
      setMaxPrice={setMaxPrice}
      inStock={inStock}
      setInStock={setInStock}
      clearFilters={clearFilters}
      hasFilters={hasFilters}
    />
  );

  return (
    <main className="min-h-screen bg-[#F7F8FB]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <section className="rounded-[30px] bg-[#111111] p-5 text-white  sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#ffb3b8]">Korezi shop</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Find skincare faster</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                Search by product, brand, category, skin type, price, and availability.
              </p>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-3xl border border-white/10 text-center text-sm">
              <Metric label="Products" value={String(data.total)} />
              <Metric label="Brands" value={String(brands.length)} />
              <Metric label="Categories" value={String(categories.length)} />
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden lg:block">{filters}</aside>

          <section>
            <div className="rounded-[28px] border border-black/5 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {loading ? "Loading products..." : `Showing ${firstResult}-${lastResult} of ${data.total} products`}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-gray-950">
                    {hasFilters ? "Filtered products" : "All products"}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className="rounded-2xl border border-[#DBD9D9] px-4 py-2 text-sm font-semibold lg:hidden"
                  >
                    Filters
                  </button>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="h-11 rounded-2xl border border-[#DBD9D9] bg-white px-4 text-sm outline-none focus:border-[#BE171F]"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeFilters.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeFilters.map((filter) => (
                    <button
                      key={filter.label}
                      type="button"
                      onClick={filter.clear}
                      className="rounded-full border bg-[#FAFBFF] px-3 py-1.5 text-xs transition hover:border-[#BE171F] hover:text-[#BE171F]"
                    >
                      {filter.label} ×
                    </button>
                  ))}
                  <button type="button" onClick={clearFilters} className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#BE171F]">
                    Clear all
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5">
              {loading ? (
                <ProductGridSkeleton />
              ) : data.items.length === 0 ? (
                <EmptyState clearFilters={clearFilters} />
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {data.items.map((p) => (
                    <ProductCard key={p._id} product={p as any} />
                  ))}
                </div>
              )}
            </div>

            {data.pages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="rounded-2xl border border-[#DBD9D9] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Prev
                </button>
                {Array.from({ length: data.pages }).slice(0, 7).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={[
                        "h-10 w-10 rounded-2xl border border-[#DBD9D9] text-sm font-semibold",
                        pageNum === data.page ? "border-[#BE171F] bg-[#BE171F] text-white" : "bg-white",
                      ].join(" ")}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={page >= data.pages}
                  onClick={() => setPage((value) => Math.min(data.pages, value + 1))}
                  className="rounded-2xl border border-[#DBD9D9] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      <AnimatePresence>
        {mobileFiltersOpen && (
        <motion.div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileFiltersOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="absolute bottom-0 left-0 right-0 max-h-[86vh] overflow-auto rounded-t-[28px] bg-white p-4 shadow-[0_-24px_80px_rgba(15,23,42,0.22)]"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.8 }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="rounded-full border px-3 py-1 text-sm">
                Close
              </button>
            </div>
            {filters}
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function FilterPanel(props: {
  search: string;
  setSearch: (value: string) => void;
  brand: string;
  setBrand: (value: string) => void;
  brands: Brand[];
  category: string;
  setCategory: (value: string) => void;
  categories: Category[];
  subCategory: string;
  setSubCategory: (value: string) => void;
  subcategories: { _id: string; name: string; children?: { _id?: string; name: string }[] }[];
  thirdCategory: string;
  setThirdCategory: (value: string) => void;
  thirdCategories: { _id?: string; name: string }[];
  skinType: string;
  setSkinType: (value: string) => void;
  minPrice: string;
  setMinPrice: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;
  inStock: boolean;
  setInStock: (value: boolean) => void;
  clearFilters: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="rounded-[28px] border border-black/5 bg-white p-4 shadow-sm lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {props.hasFilters && (
          <button type="button" onClick={props.clearFilters} className="text-xs font-semibold text-[#BE171F]">
            Reset
          </button>
        )}
      </div>

      <div className="mt-5 space-y-5">
        <Field label="Search">
          <input
            value={props.search}
            onChange={(e) => props.setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-11 w-full rounded-2xl border border-[#DBD9D9] bg-[#FAFBFF] px-4 text-sm outline-none focus:border-[#BE171F]"
          />
        </Field>

        <Field label="Brand">
          <select value={props.brand} onChange={(e) => props.setBrand(e.target.value)} className={selectClass}>
            <option value="">All brands</option>
            {props.brands.map((item) => (
              <option key={item._id} value={item.name}>{item.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Category">
          <select value={props.category} onChange={(e) => { props.setCategory(e.target.value); props.setSubCategory(""); props.setThirdCategory(""); }} className={selectClass}>
            <option value="">All categories</option>
            {props.categories.map((item) => (
              <option key={item._id} value={item.name}>{item.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Subcategory">
          <select
            value={props.subCategory}
            onChange={(e) => { props.setSubCategory(e.target.value); props.setThirdCategory(""); }}
            disabled={!props.category}
            className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <option value="">All subcategories</option>
            {props.subcategories.map((item) => (
              <option key={item._id} value={item.name}>{item.name}</option>
            ))}
          </select>
        </Field>

        <Field label="3rd Category">
          <select
            value={props.thirdCategory}
            onChange={(e) => props.setThirdCategory(e.target.value)}
            disabled={!props.subCategory || props.thirdCategories.length === 0}
            className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <option value="">All 3rd categories</option>
            {props.thirdCategories.map((item) => (
              <option key={item._id || item.name} value={item.name}>{item.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Skin Type">
          <div className="flex flex-wrap gap-2">
            {skinOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => props.setSkinType(props.skinType === option ? "" : option)}
                className={[
                  "rounded-full border border-[#DBD9D9] px-3 py-1.5 text-xs transition",
                  props.skinType === option ? "border-[#BE171F] bg-[#BE171F] text-white" : "bg-white hover:border-[#BE171F]",
                ].join(" ")}
              >
                {option}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Price">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={props.minPrice}
              onChange={(e) => props.setMinPrice(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Min"
              className="h-11 rounded-2xl border border-[#DBD9D9] bg-[#FAFBFF] px-4 text-sm outline-none focus:border-[#BE171F]"
            />
            <input
              value={props.maxPrice}
              onChange={(e) => props.setMaxPrice(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Max"
              className="h-11 rounded-2xl border border-[#DBD9D9] bg-[#FAFBFF] px-4 text-sm outline-none focus:border-[#BE171F]"
            />
          </div>
        </Field>

        <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#DBD9D9] bg-[#FAFBFF] p-3 text-sm">
          <span>
            <b className="block">In stock only</b>
            <span className="text-xs text-gray-500">Hide sold out items</span>
          </span>
          <input type="checkbox" checked={props.inStock} onChange={(e) => props.setInStock(e.target.checked)} className="h-5 w-5 rounded-full accent-[#BE171F]" />
        </label>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-white/10 p-4 last:border-r-0">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-white/55">{label}</p>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
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

function EmptyState({ clearFilters }: { clearFilters: () => void }) {
  return (
    <div className="rounded-[28px] border border-dashed bg-white p-10 text-center">
      <h3 className="text-xl font-semibold">No products found</h3>
      <p className="mt-2 text-sm text-gray-500">Try removing a filter or searching for another product.</p>
      <button type="button" onClick={clearFilters} className="mt-5 rounded-2xl bg-[#BE171F] px-5 py-3 text-sm font-semibold text-white hover:bg-black">
        Clear filters
      </button>
    </div>
  );
}
