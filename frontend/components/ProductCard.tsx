"use client";

import Link from "next/link";
import { useCart } from "@/app/context/CartContext";

export type Product = {
  _id: string;
  slug: string;
  name: string;
  brand: string;

  regularPrice: number;      // ✅ MRP
  salePrice?: number | null; // ✅ Selling (optional)

  stock: number;
  images?: string[];
  category?: string;
};

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  const img = product.images?.[0];
  const inStock = (product.stock ?? 0) > 0;

  const regular = Number(product.regularPrice || 0);
  const sale =
    product.salePrice === null || product.salePrice === undefined
      ? null
      : Number(product.salePrice);

  const hasSale = sale !== null && sale > 0 && sale < regular;
  const sellingPrice = hasSale ? (sale as number) : regular;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;

    // ✅ send regularPrice + salePrice to cart (NOT price)
    addToCart(
      {
        _id: product._id,
        name: product.name,
        brand: product.brand,
        regularPrice: regular,
        salePrice: hasSale ? sale : null,
        stock: product.stock ?? 0,
        image: img,
      },
      1
    );
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block rounded-2xl bg-white shadow-sm hover:shadow-md transition overflow-hidden"
    >
      {/* Image */}
      <div className="aspect-square bg-gray-50 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
            No image
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{product.brand}</p>
            <h3 className="text-sm lg:text-lg mt-3 font-medium text-gray-900 line-clamp-3 w-30 lg:w-58">
              {product.name}
            </h3>
          </div>

          <span
            className={`shrink-0 text-[11px] px-2 py-1 rounded-full border ${
              inStock
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {inStock ? "In stock" : "Out"}
          </span>
        </div>

        {/* Price block */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="leading-tight">
            <p className="font-semibold text-red-600">৳{sellingPrice}</p>

            {hasSale && (
              <p className="text-xs text-gray-400 line-through">৳{regular}</p>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={!inStock}
            className="px-1 py-1 md:px-3 md:py-2 text-sm rounded-lg border cursor-pointer text-white bg-[#BE171F] transition hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 17C7.28333 17 6.61667 16.825 6 16.475C5.38333 16.1083 4.89167 15.6167 4.525 15C4.175 14.3833 4 13.7167 4 13V4.55C4 4.2 3.94167 3.90833 3.825 3.675C3.725 3.44167 3.55833 3.275 3.325 3.175C3.09167 3.05833 2.8 3 2.45 3H2C1.58333 3 1.29167 2.83333 1.125 2.5C0.974997 2.16667 0.974997 1.83333 1.125 1.5C1.29167 1.16667 1.58333 1 2 1H2.45C3.35 1 4.125 1.275 4.775 1.825C5.425 2.35833 5.81667 3.05 5.95 3.9V4H17.4C18.2167 4 18.95 4.225 19.6 4.675C20.2667 5.10833 20.7583 5.69167 21.075 6.425C21.3917 7.15833 21.475 7.925 21.325 8.725L20.425 13.725C20.275 14.6583 19.825 15.4417 19.075 16.075C18.3417 16.6917 17.4833 17 16.5 17H8ZM7 22C6.45 22 5.975 21.8083 5.575 21.425C5.19167 21.025 5 20.55 5 20C5 19.4333 5.19167 18.9583 5.575 18.575C5.975 18.1917 6.45 18 7 18C7.56667 18 8.04167 18.1917 8.425 18.575C8.80833 18.9583 9 19.4333 9 20C9 20.55 8.80833 21.025 8.425 21.425C8.04167 21.8083 7.56667 22 7 22ZM17 22C16.45 22 15.975 21.8083 15.575 21.425C15.1917 21.025 15 20.55 15 20C15 19.4333 15.1917 18.9583 15.575 18.575C15.975 18.1917 16.45 18 17 18C17.5667 18 18.0417 18.1917 18.425 18.575C18.8083 18.9583 19 19.4333 19 20C19 20.55 18.8083 21.025 18.425 21.425C18.0417 21.8083 17.5667 22 17 22ZM16.5 15C17.05 15 17.4917 14.8583 17.825 14.575C18.1583 14.2917 18.375 13.8917 18.475 13.375L19.375 8.35C19.4417 7.9 19.4083 7.5 19.275 7.15C19.1417 6.78333 18.9083 6.5 18.575 6.3C18.2417 6.1 17.85 6 17.4 6H6V13C6 13.4 6.075 13.7583 6.225 14.075C6.39167 14.375 6.625 14.6083 6.925 14.775C7.24167 14.925 7.6 15 8 15H16.5Z"
                fill="white"
              />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
