import type { Metadata } from "next";
import ProductClient from "./ProductClient";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.korezi.com";
const SITE_URL = "https://korezi.com";

type Product = {
  name?: string;
  slug?: string;
  description?: string;
  images?: string[];
  regularPrice?: number;
  salePrice?: number | null;
  stock?: number;
  brand?: string;
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

function imageUrl(src?: string) {
  if (!src) return "/og-image.png";
  if (src.startsWith("http")) return src;
  return `${API_BASE}${src.startsWith("/") ? "" : "/"}${src}`;
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/api/products/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product?.name) {
    return {
      title: {
        absolute: "Product - Korezi",
      },
    };
  }

  const title = `${product.name} - Korezi`;
  const description =
    product.description?.trim() ||
    `Shop ${product.name} at Korezi. Authentic Korean skincare and beauty products in Bangladesh.`;
  const url = `/product/${product.slug || slug}`;
  const image = imageUrl(product.images?.[0]);

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${url}`,
      type: "website",
      siteName: "Korezi",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function ProductPage() {
  return <ProductClient />;
}
