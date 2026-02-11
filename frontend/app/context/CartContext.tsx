"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  _id: string;
  name: string;
  brand: string;

  // ✅ MRP + Selling
  regularPrice: number; // MRP
  salePrice?: number | null; // selling price (optional)

  image?: string;
  quantity: number;
  stock: number;

  // ✅ (optional) old field support (if you previously saved `price`)
  price?: number;
};

type CartContextType = {
  items: CartItem[];
  count: number;
  subtotal: number;

  addToCart: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;

  removeFromCart: (_id: string) => void;
  updateQty: (_id: string, qty: number) => void;
  clearCart: () => void;

  getSellingPrice: (
    item: Pick<CartItem, "regularPrice" | "salePrice" | "price">
  ) => number;

  hasSale: (
    item: Pick<CartItem, "regularPrice" | "salePrice" | "price">
  ) => boolean;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "korezi_cart_v1";

function safeNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ✅ get regular price even if old cart stored `price`
function getRegular(item: any) {
  const rp = safeNumber(item?.regularPrice, 0);
  if (rp > 0) return rp;

  const old = safeNumber(item?.price, 0);
  return old > 0 ? old : 0;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // ✅ Load from localStorage (with migration from old cart)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const migrated: CartItem[] = parsed.map((it: any) => {
        const regularPrice = getRegular(it);
        const salePrice =
          it?.salePrice == null || it?.salePrice === ""
            ? null
            : safeNumber(it.salePrice, null as any);

        return {
          _id: String(it?._id || ""),
          name: String(it?.name || ""),
          brand: String(it?.brand || ""),
          image: it?.image ? String(it.image) : undefined,

          regularPrice,
          salePrice,

          quantity: Math.max(1, safeNumber(it?.quantity, 1)),
          stock: Math.max(0, safeNumber(it?.stock, 0)),

          // keep old if exists
          price: typeof it?.price === "number" ? it.price : undefined,
        };
      });

      setItems(migrated);
    } catch {}
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  // ✅ Helpers
  const hasSale: CartContextType["hasSale"] = (item) => {
    const regular = getRegular(item);
    const sale = safeNumber((item as any)?.salePrice, 0);
    return sale > 0 && regular > 0 && sale < regular;
  };

  const getSellingPrice: CartContextType["getSellingPrice"] = (item) => {
    const regular = getRegular(item);
    if (hasSale(item)) return safeNumber((item as any).salePrice, regular);
    return regular;
  };

  const addToCart: CartContextType["addToCart"] = (item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p._id === item._id);

      const regularPrice = getRegular(item);
      const salePrice =
        item.salePrice == null || item.salePrice === ""
          ? null
          : safeNumber(item.salePrice, null as any);

      if (existing) {
        const nextQty = Math.min(existing.quantity + qty, item.stock ?? 9999);
        return prev.map((p) =>
          p._id === item._id
            ? {
                ...p,
                ...item,
                regularPrice,
                salePrice,
                quantity: nextQty,
              }
            : p
        );
      }

      return [
        ...prev,
        {
          ...item,
          regularPrice,
          salePrice,
          quantity: Math.min(qty, item.stock ?? qty),
        },
      ];
    });
  };

  const addItem: CartContextType["addItem"] = (item, qty = 1) =>
    addToCart(item, qty);

  const removeFromCart = (_id: string) => {
    setItems((prev) => prev.filter((p) => p._id !== _id));
  };

  const updateQty = (_id: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((p) => {
          if (p._id !== _id) return p;
          const safeQty = Math.max(1, Math.min(qty, p.stock ?? qty));
          return { ...p, quantity: safeQty };
        })
        .filter((p) => p.quantity > 0)
    );
  };

  const clearCart = () => setItems([]);

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  // ✅ Subtotal always uses SELLING price
  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => {
      const selling = getSellingPrice(i);
      return sum + selling * i.quantity;
    }, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        addToCart,
        addItem,
        removeFromCart,
        updateQty,
        clearCart,
        getSellingPrice,
        hasSale,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
