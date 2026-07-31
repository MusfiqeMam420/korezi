import type { MetadataRoute } from "next";

const SITE_URL = "https://korezi.com";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.korezi.com";

type Product = {
  slug?: string;
  updatedAt?: string;
  createdAt?: string;
};

type NamedRoute = {
  name?: string;
  slug?: string;
  updatedAt?: string;
  createdAt?: string;
};

function dateFrom(value?: string) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function route(path: string, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"], priority: number, lastModified = new Date()) {
  return {
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  };
}

function slugFromName(value?: string) {
  return encodeURIComponent((value || "").trim());
}

async function readJson<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data?.items)) return data.items;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, brands] = await Promise.all([
    readJson<Product>("/api/products?page=1&limit=200"),
    readJson<NamedRoute>("/api/categories"),
    readJson<NamedRoute>("/api/brands"),
  ]);

  const staticRoutes = [
    route("/", "daily", 1),
    route("/shop", "daily", 0.95),
    route("/faq", "monthly", 0.4),
    route("/privacy-policy", "yearly", 0.2),
    route("/terms-conditions", "yearly", 0.2),
    route("/refund-policy", "yearly", 0.2),
    route("/shipping-policy", "yearly", 0.2),
  ];

  const productRoutes = products
    .filter((product) => product.slug)
    .map((product) => route(`/product/${product.slug}`, "weekly", 0.85, dateFrom(product.updatedAt || product.createdAt)));

  const categoryRoutes = categories
    .filter((category) => category.slug || category.name)
    .map((category) => route(`/categories/${category.slug || slugFromName(category.name)}`, "weekly", 0.75, dateFrom(category.updatedAt || category.createdAt)));

  const brandRoutes = brands
    .filter((brand) => brand.slug || brand.name)
    .map((brand) => route(`/brands/${brand.slug || slugFromName(brand.name)}`, "weekly", 0.65, dateFrom(brand.updatedAt || brand.createdAt)));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...brandRoutes];
}
