"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/context/CartContext";

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 17C7.283 17 6.617 16.825 6 16.475C5.383 16.108 4.892 15.617 4.525 15C4.175 14.383 4 13.717 4 13V4.55C4 4.2 3.942 3.908 3.825 3.675C3.725 3.442 3.558 3.275 3.325 3.175C3.092 3.058 2.8 3 2.45 3H2C1.583 3 1.292 2.833 1.125 2.5C.975 2.167.975 1.833 1.125 1.5C1.292 1.167 1.583 1 2 1H2.45C3.35 1 4.125 1.275 4.775 1.825C5.425 2.358 5.817 3.05 5.95 3.9V4H17.4C18.217 4 18.95 4.225 19.6 4.675C20.267 5.108 20.758 5.692 21.075 6.425C21.392 7.158 21.475 7.925 21.325 8.725L20.425 13.725C20.275 14.658 19.825 15.442 19.075 16.075C18.342 16.692 17.483 17 16.5 17H8ZM7 22C6.45 22 5.975 21.808 5.575 21.425C5.192 21.025 5 20.55 5 20C5 19.433 5.192 18.958 5.575 18.575C5.975 18.192 6.45 18 7 18C7.567 18 8.042 18.192 8.425 18.575C8.808 18.958 9 19.433 9 20C9 20.55 8.808 21.025 8.425 21.425C8.042 21.808 7.567 22 7 22ZM17 22C16.45 22 15.975 21.808 15.575 21.425C15.192 21.025 15 20.55 15 20C15 19.433 15.192 18.958 15.575 18.575C15.975 18.192 16.45 18 17 18C17.567 18 18.042 18.192 18.425 18.575C18.808 18.958 19 19.433 19 20C19 20.55 18.808 21.025 18.425 21.425C18.042 21.808 17.567 22 17 22ZM16.5 15C17.05 15 17.492 14.858 17.825 14.575C18.158 14.292 18.375 13.892 18.475 13.375L19.375 8.35C19.442 7.9 19.408 7.5 19.275 7.15C19.142 6.783 18.908 6.5 18.575 6.3C18.242 6.1 17.85 6 17.4 6H6V13C6 13.4 6.075 13.758 6.225 14.075C6.392 14.375 6.625 14.608 6.925 14.775C7.242 14.925 7.6 15 8 15H16.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function FloatingCart() {
  const pathname = usePathname();
  const { count, subtotal, items } = useCart();

  if (pathname === "/cart" || count <= 0) return null;

  const previewItems = items.slice(0, 3);

  return (
    <Link
      href="/cart"
      aria-label={`Open cart with ${count} item${count === 1 ? "" : "s"}`}
      className="group fixed bottom-24 right-4 z-40 rounded-[22px] bg-[#111111] text-white shadow-[0_18px_50px_rgba(15,23,42,0.28)] transition hover:-translate-y-1 hover:bg-[#BE171F] sm:bottom-6 sm:right-6"
    >
      <div className="flex items-center gap-3 p-3 pr-4">
        <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
          <CartIcon />
          <span className="absolute -right-1 -top-1 min-w-6 rounded-full bg-[#BE171F] px-1.5 py-0.5 text-center text-[11px] font-semibold text-white ring-2 ring-[#111111] group-hover:bg-white group-hover:text-[#BE171F]">
            {count > 99 ? "99+" : count}
          </span>
        </div>

        <div className="hidden min-w-[120px] sm:block">
          <p className="text-xs text-white/60">Your cart</p>
          <p className="text-sm font-semibold">&#2547;{subtotal}</p>
        </div>

        {previewItems.length > 0 && (
          <div className="hidden -space-x-2 md:flex">
            {previewItems.map((item) => (
              <div key={item._id} className="h-8 w-8 overflow-hidden rounded-full border-2 border-[#111111] bg-white group-hover:border-[#BE171F]">
                {item.image ? (
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
