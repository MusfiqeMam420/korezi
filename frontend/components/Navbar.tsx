"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";

/* Icons */
function IconSearch(props: any) {
  return (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11 19.5C9.46667 19.5 8.04167 19.125 6.725 18.375C5.425 17.6083 4.39167 16.575 3.625 15.275C2.875 13.9583 2.5 12.5333 2.5 11C2.5 9.46667 2.875 8.05 3.625 6.75C4.39167 5.43333 5.425 4.4 6.725 3.65C8.04167 2.88333 9.46667 2.5 11 2.5C12.5333 2.5 13.95 2.88333 15.25 3.65C16.5667 4.4 17.6 5.43333 18.35 6.75C19.1167 8.05 19.5 9.46667 19.5 11C19.5 12.5333 19.1167 13.9583 18.35 15.275C17.6 16.575 16.5667 17.6083 15.25 18.375C13.95 19.125 12.5333 19.5 11 19.5ZM11 17.5C12.2333 17.5 13.3417 17.225 14.325 16.675C15.325 16.1083 16.1 15.3333 16.65 14.35C17.2167 13.35 17.5 12.2333 17.5 11C17.5 9.76667 17.2167 8.65833 16.65 7.675C16.1 6.675 15.325 5.9 14.325 5.35C13.3417 4.78333 12.2333 4.5 11 4.5C9.76667 4.5 8.65 4.78333 7.65 5.35C6.66667 5.9 5.89167 6.675 5.325 7.675C4.775 8.65833 4.5 9.76667 4.5 11C4.5 12.2333 4.775 13.35 5.325 14.35C5.89167 15.3333 6.66667 16.1083 7.65 16.675C8.65 17.225 9.76667 17.5 11 17.5ZM15.075 16.5L16.5 15.075L20.7 19.3C20.9833 19.5833 21.0667 19.9 20.95 20.25C20.8333 20.6 20.6 20.8417 20.25 20.975C19.9167 21.0917 19.6 21 19.3 20.7L15.075 16.5Z" fill="#3D3D40"/>
</svg>

  );
}
function IconUser(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6 22C4.75 22 3.76667 21.65 3.05 20.95C2.35 20.2333 2 19.25 2 18V17.9C2 16.9167 2.45833 16.0583 3.375 15.325C4.29167 14.575 5.50833 14 7.025 13.6C8.54167 13.2 10.2 13 12 13C13.8 13 15.4583 13.2 16.975 13.6C18.4917 14 19.7083 14.575 20.625 15.325C21.5417 16.0583 22 16.9167 22 17.9V18C22 19.25 21.6417 20.2333 20.925 20.95C20.225 21.65 19.25 22 18 22H6ZM4 18C4 18.7667 4.14167 19.2917 4.425 19.575C4.70833 19.8583 5.23333 20 6 20H18C18.7667 20 19.2917 19.8583 19.575 19.575C19.8583 19.2917 20 18.7667 20 18V17.9C20 17.3833 19.6583 16.9 18.975 16.45C18.2917 16 17.3417 15.65 16.125 15.4C14.925 15.1333 13.55 15 12 15C10.4667 15 9.09167 15.1333 7.875 15.4C6.65833 15.65 5.70833 16 5.025 16.45C4.34167 16.9 4 17.3833 4 17.9V18ZM12 12C11.0833 12 10.2417 11.775 9.475 11.325C8.725 10.875 8.125 10.275 7.675 9.525C7.225 8.75833 7 7.91667 7 7C7 6.08333 7.225 5.24167 7.675 4.475C8.125 3.70833 8.725 3.10833 9.475 2.675C10.2417 2.225 11.0833 2 12 2C12.9167 2 13.7583 2.225 14.525 2.675C15.2917 3.10833 15.8917 3.70833 16.325 4.475C16.775 5.24167 17 6.08333 17 7C17 7.91667 16.775 8.75833 16.325 9.525C15.8917 10.275 15.2917 10.875 14.525 11.325C13.7583 11.775 12.9167 12 12 12ZM12 10C12.6 10 13.125 9.875 13.575 9.625C14.025 9.375 14.375 9.025 14.625 8.575C14.875 8.125 15 7.6 15 7C15 6.4 14.875 5.875 14.625 5.425C14.375 4.975 14.025 4.625 13.575 4.375C13.125 4.125 12.6 4 12 4C11.4 4 10.875 4.125 10.425 4.375C9.975 4.625 9.625 4.975 9.375 5.425C9.125 5.875 9 6.4 9 7C9 7.6 9.125 8.125 9.375 8.575C9.625 9.025 9.975 9.375 10.425 9.625C10.875 9.875 11.4 10 12 10Z" fill="#3D3D40"/>
</svg>

  );
}
function IconCart(props: any) {
  return (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.99922 17C7.28255 17 6.61589 16.825 5.99922 16.475C5.38255 16.1083 4.89089 15.6167 4.52422 15C4.17422 14.3833 3.99922 13.7167 3.99922 13V4.55C3.99922 4.2 3.94089 3.90833 3.82422 3.675C3.72422 3.44167 3.55755 3.275 3.32422 3.175C3.09089 3.05833 2.79922 3 2.44922 3H1.99922C1.58255 3 1.29089 2.83333 1.12422 2.5C0.974219 2.16667 0.974219 1.83333 1.12422 1.5C1.29089 1.16667 1.58255 1 1.99922 1H2.44922C3.34922 1 4.12422 1.275 4.77422 1.825C5.42422 2.35833 5.81589 3.05 5.94922 3.9V4H17.3992C18.2159 4 18.9492 4.225 19.5992 4.675C20.2659 5.10833 20.7575 5.69167 21.0742 6.425C21.3909 7.15833 21.4742 7.925 21.3242 8.725L20.4242 13.725C20.2742 14.6583 19.8242 15.4417 19.0742 16.075C18.3409 16.6917 17.4825 17 16.4992 17H7.99922ZM6.99922 22C6.44922 22 5.97422 21.8083 5.57422 21.425C5.19089 21.025 4.99922 20.55 4.99922 20C4.99922 19.4333 5.19089 18.9583 5.57422 18.575C5.97422 18.1917 6.44922 18 6.99922 18C7.56589 18 8.04089 18.1917 8.42422 18.575C8.80755 18.9583 8.99922 19.4333 8.99922 20C8.99922 20.55 8.80755 21.025 8.42422 21.425C8.04089 21.8083 7.56589 22 6.99922 22ZM16.9992 22C16.4492 22 15.9742 21.8083 15.5742 21.425C15.1909 21.025 14.9992 20.55 14.9992 20C14.9992 19.4333 15.1909 18.9583 15.5742 18.575C15.9742 18.1917 16.4492 18 16.9992 18C17.5659 18 18.0409 18.1917 18.4242 18.575C18.8075 18.9583 18.9992 19.4333 18.9992 20C18.9992 20.55 18.8075 21.025 18.4242 21.425C18.0409 21.8083 17.5659 22 16.9992 22ZM16.4992 15C17.0492 15 17.4909 14.8583 17.8242 14.575C18.1575 14.2917 18.3742 13.8917 18.4742 13.375L19.3742 8.35C19.4409 7.9 19.4075 7.5 19.2742 7.15C19.1409 6.78333 18.9075 6.5 18.5742 6.3C18.2409 6.1 17.8492 6 17.3992 6H5.99922V13C5.99922 13.4 6.07422 13.7583 6.22422 14.075C6.39089 14.375 6.62422 14.6083 6.92422 14.775C7.24089 14.925 7.59922 15 7.99922 15H16.4992Z" fill="#3D3D40"/>
</svg>

  );
}

/* Types */
type SuggestProduct = {
  _id: string;
  name: string;
  slug?: string | null;
  image?: string | null;

  regularPrice?: number;
  salePrice?: number | null;

  brand?: string;
  category?: string;
};

type SuggestResponse = {
  tags: string[];
  products: SuggestProduct[];
};

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Navbar() {
  const { count } = useCart();
  const { user, logout } = useAuth();

  const [openSearch, setOpenSearch] = useState(false);
  const [q, setQ] = useState("");
  const [openMenu, setOpenMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const overlayPanelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [loadingSug, setLoadingSug] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [products, setProducts] = useState<SuggestProduct[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const dq = useDebouncedValue(q, 250);

  // account menu outside click close
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // ESC closes overlay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // lock scroll + focus
  useEffect(() => {
    if (!openSearch) return;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, [openSearch]);

  function openSearchOverlay() {
    setOpenMenu(false);
    setOpenSearch(true);
  }

  function closeSearch() {
    setOpenSearch(false);
    // small delay not needed because AnimatePresence handles unmount,
    // but we still reset so next open starts clean.
    setTimeout(() => {
      setQ("");
      setTags([]);
      setProducts([]);
      setActiveIndex(-1);
      setLoadingSug(false);
    }, 50);
  }

  // Suggestions fetch
  useEffect(() => {
    const query = dq.trim();
    if (!openSearch) return;

    if (!query) {
      setTags(["Cleanser", "Sunscreen", "Serum", "Moisturizer", "Toner", "Snail"]);
      setProducts([]);
      setActiveIndex(-1);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingSug(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Suggest API failed");
        const data = (await res.json()) as SuggestResponse;

        if (cancelled) return;
        setTags(Array.isArray(data.tags) ? data.tags.slice(0, 6) : []);
        setProducts(Array.isArray(data.products) ? data.products.slice(0, 6) : []);
        setActiveIndex(-1);
      } catch {
        if (cancelled) return;
        const fallbackTags = ["Korean", "Hydrating", "Acne", "Vitamin C", "SPF", "Snail"]
          .filter((t) => t.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 6);
        setTags(fallbackTags);
        setProducts([]);
        setActiveIndex(-1);
      } finally {
        if (!cancelled) setLoadingSug(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dq, openSearch]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    closeSearch();
    window.location.href = `/shop?search=${encodeURIComponent(query)}`;
  }

  async function handleLogout() {
    await logout();
    setOpenMenu(false);
    window.location.href = "/";
  }

  const flatItems = useMemo(() => {
    const tagItems = tags.map((t) => ({ type: "tag" as const, label: t }));
    const prodItems = products.map((p) => ({ type: "product" as const, product: p }));
    return [...tagItems, ...prodItems];
  }, [tags, products]);

  function goToItem(i: number) {
    const item = flatItems[i];
    if (!item) return;

    closeSearch();

    if (item.type === "tag") {
      window.location.href = `/shop?tag=${encodeURIComponent(item.label)}`;
      return;
    }

    const p = item.product;
    window.location.href = p.slug
      ? `/product/${encodeURIComponent(p.slug)}`
      : `/product/${encodeURIComponent(p._id)}`;
  }

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!openSearch) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
      return;
    }
    if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        goToItem(activeIndex);
      }
    }
  }

  // Lively animation variants
  const overlayFade = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.18 } },
    exit: { opacity: 0, transition: { duration: 0.14 } },
  };

  const panelPop = {
    hidden: { opacity: 0, y: -18, scale: 0.94, filter: "blur(6px)" },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 520,
        damping: 32,
        mass: 0.9,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.97,
      filter: "blur(4px)",
      transition: { duration: 0.16 },
    },
  };

  const listStagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.035, delayChildren: 0.03 } },
    exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
  };

  const itemSlide = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
    exit: { opacity: 0, y: 6, transition: { duration: 0.12 } },
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/kz-logo.svg"
              alt="Korezi"
              width={120}
              height={32}
              priority
              className="h-8 w-auto"
            />
          </Link>

          {/* <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link className="hover:text-black" href="/shop">
              Shop
            </Link>
          </nav> */}

          <div className="relative flex items-center gap-2">
            {/* Search Icon */}
            <button
              onClick={openSearchOverlay}
              className="p-2 rounded-xl hover:bg-gray-100"
              aria-label="Search"
              type="button"
            >
              <IconSearch className="w-5 h-5" />
            </button>

              {/* Cart */}
            <Link href="/cart" className="p-2 rounded-xl hover:bg-gray-100 relative" aria-label="Cart">
              <IconCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-[#BE171F] text-white px-2 py-1 rounded-full">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>

            {/* Account */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpenMenu((v) => !v)}
                className="p-2 rounded-xl "
                aria-label="Account menu"
                type="button"
              >
                {user?.name ? (
                  <div className="w-8 h-8 rounded-full bg-black border-2 hover:border-gray-500 transition cursor-pointer  text-white flex items-center justify-center text-sm font-semibold">
                    {user.name.trim().charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <Link
                        href="/login"
                        onClick={() => setOpenMenu(false)}
                      >
                  <IconUser className="w-5 h-5" />
                  </Link>
                )}
              </button>

              {openMenu && (
                <div className="absolute right-0 top-12 w-52 bg-white  rounded-2xl shadow-lg overflow-hidden">
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-300 bg-gray-100">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>

                      <Link
                        href="/account"
                        onClick={() => setOpenMenu(false)}
                        className="block px-4 py-3 text-sm hover:bg-gray-50"
                      >
                        My Account
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setOpenMenu(false)}
                        className="block px-4 py-3 text-sm hover:bg-gray-50"
                      >
                        Orders
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                        type="button"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      {/* <Link
                        href="/signup"
                        onClick={() => setOpenMenu(false)}
                        className="block px-4 py-3 text-sm hover:bg-gray-50"
                      >
                        Sign up
                      </Link>
                      <Link
                        href="/login"
                        onClick={() => setOpenMenu(false)}
                        className="block px-4 py-3 text-sm hover:bg-gray-50"
                      >
                        Login
                      </Link> */}
                    </>
                  )}
                </div>
              )}
            </div>

          
          </div>
        </div>
      </header>

      {/* SEARCH OVERLAY (LIVELY + OUTSIDE CLICK CLOSE) */}
      <AnimatePresence>
        {openSearch && (
          <motion.div
            className="fixed inset-0 z-[60]"
            role="dialog"
            aria-modal="true"
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {/* backdrop (outside click closes) */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              variants={overlayFade}
              onClick={closeSearch}
            />

            {/* center panel */}
            <div className="absolute inset-0 flex items-start justify-center pt-24 px-4">
              <motion.div
                ref={overlayPanelRef}
                variants={panelPop}
                className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl  overflow-hidden"
                // stop clicks inside panel from closing
                onClick={(e) => e.stopPropagation()}
              >
                {/* top bar */}
                <div className="p-4 border-b border-gray-300 flex items-center gap-3">
                  <form onSubmit={submitSearch} className="flex-1 flex gap-2">
                    <input
                      ref={inputRef}
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onKeyDown={onSearchKeyDown}
                      placeholder="Search products, brands, tags..."
                      className="w-full border border-gray-200 bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    />
                    <button type="submit" className="px-4 py-3 rounded-2xl bg-black hover:bg-[#BE171F] cursor-pointer transition text-white text-sm">
                      Search
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={closeSearch}
                    className="px-3 py-3 rounded-2xl cursor-pointer transition hover:bg-gray-100 text-sm"
                    aria-label="Close search"
                  >
                    ✕
                  </button>
                </div>

                {/* content */}
                <div className="p-4 max-h-[60vh] overflow-auto">
                  {loadingSug && <div className="text-xs text-gray-500 pb-2">Searching…</div>}

                  <motion.div variants={listStagger} initial="hidden" animate="show" exit="exit">
                    {/* Tags */}
                    {tags.length > 0 && (
                      <motion.div variants={itemSlide} className="mb-4">
                        <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">
                          Suggested tags
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {tags.map((t, idx) => {
                            const active = activeIndex === idx;
                            return (
                              <motion.button
                                variants={itemSlide}
                                key={t}
                                type="button"
                                onMouseEnter={() => setActiveIndex(idx)}
                                onClick={() => {
                                  closeSearch();
                                  window.location.href = `/shop?tag=${encodeURIComponent(t)}`;
                                }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.98 }}
                                className={[
                                  "text-xs px-3 py-2 rounded-full border transition-colors",
                                  active ? "bg-black text-white border-black" : "hover:bg-gray-50",
                                ].join(" ")}
                              >
                                {t}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Products */}
                    {products.length > 0 && (
                      <motion.div variants={itemSlide}>
                        <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Products</div>

                        <div className="space-y-2">
                          {products.map((p, pIdx) => {
                            const globalIndex = tags.length + pIdx;
                            const active = activeIndex === globalIndex;

                            return (
                              <motion.button
                                key={p._id}
                                type="button"
                                variants={itemSlide}
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.99 }}
                                onMouseEnter={() => setActiveIndex(globalIndex)}
                                onClick={() => {
                                  closeSearch();
                                  window.location.href = p.slug
                                    ? `/product/${encodeURIComponent(p.slug)}`
                                    : `/product/${encodeURIComponent(p._id)}`;
                                }}
                                className={[
                                  "w-full flex items-center gap-3 p-3 rounded-2xl text-left border transition-all",
                                  active
                                    ? "bg-gray-50 border-gray-200"
                                    : "hover:bg-gray-50 hover:border-gray-200",
                                ].join(" ")}
                              >
                                <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
                                  {p.image ? (
                                    <img src={p.image} alt={p.name} className="w-12 h-12 object-cover" />
                                  ) : (
                                    <span className="text-[10px] text-gray-400">IMG</span>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium truncate">{p.name}</div>
                                  {typeof p.regularPrice === "number" && (
  <div className="text-xs text-gray-500">
    {p.salePrice != null && p.salePrice > 0 && p.salePrice < p.regularPrice ? (
      <>
        <span className="text-[#BE171F] font-semibold">৳ {p.salePrice}</span>{" "}
        <span className="line-through text-gray-400">৳ {p.regularPrice}</span>
      </>
    ) : (
      <span className="text-[#BE171F] font-semibold">৳ {p.regularPrice}</span>
    )}
  </div>
)}

                                </div>

                                <div className="text-xs text-gray-400">↵</div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {!loadingSug && tags.length === 0 && products.length === 0 && (
                      <motion.div variants={itemSlide} className="text-sm text-gray-500">
                        No suggestions found.
                      </motion.div>
                    )}

                    <motion.div variants={itemSlide} className="pt-4 text-xs text-gray-400">
                      Tip: use ↑ ↓ then Enter • Esc to close • click outside to close
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/*
✅ Install if you haven't:
npm i framer-motion
*/
