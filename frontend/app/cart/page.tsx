"use client";

import Link from "next/link";
import { useCart } from "@/app/context/CartContext";

export default function CartPage() {
  const {
    items,
    subtotal,
    count,
    updateQty,
    removeFromCart,
    clearCart,
    getSellingPrice,
    hasSale,
  } = useCart();

  // ✅ Safety: if any legacy item is missing regularPrice, avoid NaN in UI
  const safeSellingPrice = (item: any) => {
    if (typeof item?.regularPrice === "number") return getSellingPrice(item);
    if (typeof item?.price === "number") return item.price; // legacy fallback
    return 0;
  };

  const safeMrp = (item: any) => {
    if (typeof item?.regularPrice === "number") return item.regularPrice;
    if (typeof item?.price === "number") return item.price; // legacy fallback
    return 0;
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Cart</h1>
          <p className="text-sm text-gray-500 mt-1 ml-1">
            {count > 0 ? `${count} items in your cart` : "Your cart is empty."}
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-sm px-4 py-2 rounded-xl text-gray-50 bg-[#BE171F] hover:bg-gray-900 transition cursor-pointer"
          >
            Clear cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 p-10 text-center">
          <p className="text-gray-600">No items yet.</p>
          <Link
            href="/shop"
            className="inline-block mt-5 px-6 py-2.5 rounded-xl transition bg-[#BE171F] hover:bg-black text-white"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-7 grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold">Items</h2>
            </div>

            <div className="divide-y">
              {items.map((item: any) => {
                const selling = safeSellingPrice(item);
                const mrp = safeMrp(item);

                // ✅ show mrp only if sale is valid
                const showMrp =
                  typeof item?.regularPrice === "number"
                    ? hasSale(item)
                    : typeof item?.salePrice === "number" && item.salePrice > 0 && item.salePrice < mrp;

                const lineTotal = selling * (Number(item.quantity) || 1);

                return (
                  <div
                    key={item._id}
                    className="p-5 border-t border-gray-100 flex gap-4 mx-2"
                  >
                    {/* Image */}
                    <div className="w-20 h-20 rounded-xl bg-gray-50 overflow-hidden flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No image</span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">
                            {item.brand || ""}
                          </p>

                          <p className="font-medium text-gray-900 truncate">
                            {item.name}
                          </p>

                          {/* ✅ Selling + MRP */}
                          <div className="mt-1 leading-tight">
                            <p className="text-md font-semibold text-[#BE171F]">
                              ৳{Number.isFinite(selling) ? selling : 0}
                            </p>

                            {showMrp && (
                              <p className="text-xs text-gray-400 line-through">
                                ৳{Number.isFinite(mrp) ? mrp : 0}
                              </p>
                            )}
                          </div>

                          {/* ✅ Line total */}
                          <p className="text-xs text-gray-600 mt-1">
                            Total: <b>৳{Number.isFinite(lineTotal) ? lineTotal : 0}</b>
                          </p>
                        </div>

                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="text-sm text-gray-500 hover:text-[#BE171F] cursor-pointer transition"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Quantity */}
                      <div className="mt-2 flex justify-between items-center gap-1">
                        <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-100">
                          <QtyButton
                            label="−"
                            onClick={() => updateQty(item._id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          />

                          <div className="w-5 text-center text-sm font-medium">
                            {item.quantity}
                          </div>

                          <QtyButton
                            label="+"
                            onClick={() => updateQty(item._id, item.quantity + 1)}
                            disabled={
                              item.stock > 0 ? item.quantity >= item.stock : false
                            }
                          />
                        </div>

                        {item.stock > 0 && (
                          <span className="text-xs text-gray-500">
                            Stock: {item.stock}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white shadow-sm rounded-2xl p-6 h-fit">
            <h2 className="font-semibold">Summary</h2>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  ৳{Number.isFinite(subtotal) ? subtotal : 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-500">Calculated at checkout</span>
              </div>

              <div className="border-t border-gray-300 pt-3 mt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">
                  ৳{Number.isFinite(subtotal) ? subtotal : 0}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 block text-center px-5 py-3 rounded-xl bg-[#BE171F] hover:bg-black transition text-white"
            >
              Checkout
            </Link>

            <Link
              href="/shop"
              className="mt-3 block text-center px-5 py-3 rounded-xl border transition hover:bg-black hover:text-white"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function QtyButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-5 h-8 mx-1 hover:text-[#BE171F] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={`qty-${label}`}
      type="button"
    >
      {label}
    </button>
  );
}
