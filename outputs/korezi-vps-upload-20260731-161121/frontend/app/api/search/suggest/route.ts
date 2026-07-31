import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.korezi.com";

type ProductSuggestionSource = {
  _id?: string;
  name?: string;
  slug?: string;
  regularPrice?: number;
  salePrice?: number | null;
  images?: string[];
  brand?: string;
  category?: string;
  subCategory?: string;
  thirdCategory?: string;
  skinType?: string[];
  concerns?: string[];
  tags?: string[];
};

function imageUrl(src?: string | null) {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  return `${API_BASE}${src.startsWith("/") ? "" : "/"}${src}`;
}

async function fetchProducts(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
}

function buildProducts(items: ProductSuggestionSource[]) {
  return items.filter((p) => p._id && p.name).slice(0, 6).map((p) => ({
    _id: p._id,
    name: p.name,
    slug: p.slug,
    regularPrice: p.regularPrice ?? 0,
    salePrice: p.salePrice ?? null,
    image: imageUrl(p.images?.[0] ?? null),
    brand: p.brand ?? "",
    category: p.category ?? "",
  }));
}

function buildTags(items: ProductSuggestionSource[], q: string) {
  const query = q.toLowerCase();
  const tagSet = new Set<string>();
  const popular = [
    "Korean skincare",
    "K-Beauty",
    "Cleanser",
    "Sunscreen",
    "Serum",
    "Moisturizer",
    "Hydration",
    "Acne",
    "Snail",
    "Glow",
  ];

  for (const p of items) {
    if (p.brand) tagSet.add(p.brand);
    if (p.category) tagSet.add(p.category);
    if (p.subCategory) tagSet.add(p.subCategory);
    if (p.thirdCategory) tagSet.add(p.thirdCategory);
    if (Array.isArray(p.skinType)) p.skinType.forEach((item) => tagSet.add(item));
    if (Array.isArray(p.concerns)) p.concerns.forEach((item) => tagSet.add(item));
    if (Array.isArray(p.tags)) p.tags.forEach((item) => tagSet.add(item));
  }

  popular.forEach((item) => tagSet.add(item));

  const tags = Array.from(tagSet).filter((item) => {
    const text = item.toLowerCase();
    return text.includes(query) || text.replace(/[^a-z0-9]/g, "").includes(query.replace(/[^a-z0-9]/g, ""));
  });

  return (tags.length ? tags : popular).slice(0, 6);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({ tags: [], products: [] });
    }

    let items = await fetchProducts(`/api/products?search=${encodeURIComponent(q)}&limit=8&page=1`);
    if (items.length === 0) {
      items = await fetchProducts("/api/products?limit=6&page=1&sort=newest");
    }

    const products = buildProducts(items);
    const tags = buildTags(items, q);

    return NextResponse.json({ tags, products });
  } catch {
    return NextResponse.json({
      tags: ["Korean skincare", "K-Beauty", "Cleanser", "Sunscreen", "Serum", "Moisturizer"],
      products: [],
    });
  }
}
