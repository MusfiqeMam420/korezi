import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({ tags: [], products: [] });
    }

    // call your backend products search
    const res = await fetch(
      `${API_BASE}/api/products?search=${encodeURIComponent(q)}&limit=6&page=1`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ tags: [], products: [] });
    }

    const data = await res.json();

    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

    // Build suggestions
    const products = items.slice(0, 6).map((p: any) => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      regularPrice: p.regularPrice ?? 0,
      salePrice: p.salePrice ?? null,
      image: p.images?.[0] ?? null,
      brand: p.brand ?? "",
      category: p.category ?? "",
    }));

    // Basic tags from brand/category + product.tags
    const tagSet = new Set<string>();
    for (const p of items) {
      if (p.brand) tagSet.add(p.brand);
      if (p.category) tagSet.add(p.category);
      if (Array.isArray(p.tags)) p.tags.forEach((t: string) => tagSet.add(t));
    }

    const tags = Array.from(tagSet).slice(0, 6);

    return NextResponse.json({ tags, products });
  } catch {
    return NextResponse.json({ tags: [], products: [] });
  }
}
