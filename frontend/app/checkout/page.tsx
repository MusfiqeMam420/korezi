"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

function CashIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7h18v10H3V7Zm2 0V5h14v2M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"
      />
    </svg>
  );
}

export default function CheckoutPage() {
  const { items, clearCart, getSellingPrice, hasSale } = useCart();
  const { user, loading: authLoading } = useAuth();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [deliveryZone, setDeliveryZone] = useState<"dhaka" | "outside">("dhaka");
  const deliveryCharge = deliveryZone === "dhaka" ? 70 : 130;

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneOrderId, setDoneOrderId] = useState<string | null>(null);

  // ✅ reliable subtotal (always from cart items)
  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => sum + getSellingPrice(i) * i.quantity, 0);
  }, [items, getSellingPrice]);

  const total = subtotal + deliveryCharge;

  // ✅ Require login
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent("/checkout")}`;
      return;
    }

    if (user?.name && !customerName) setCustomerName(user.name);
  }, [authLoading, user, customerName]);

  const canPlace = useMemo(() => {
    return (
      !!user &&
      items.length > 0 &&
      customerName.trim().length >= 2 &&
      phone.trim().length >= 7 &&
      address.trim().length >= 8 &&
      !placing
    );
  }, [user, items.length, customerName, phone, address, placing]);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canPlace) return;

    setPlacing(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        email: user?.email || "", // ✅ send email (backend supports it)
        phone: phone.trim(),
        address: address.trim(),
        paymentMethod: "COD",
        deliveryZone,
        deliveryCharge,
        subtotal,
        total,
        items: items.map((i) => {
          const selling = getSellingPrice(i);
          return {
            productId: i._id,
            name: i.name,
            price: selling, // ✅ important: store final selling price
            quantity: i.quantity,
            image: i.image || "",
          };
        }),
      };

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Order failed");

      setDoneOrderId(data?.orderId || "DONE");
      clearCart();
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setPlacing(false);
    }
  }

  // ✅ Success screen
  if (doneOrderId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-white shadow-sm rounded-2xl p-10 text-center">
          <h1 className="text-2xl font-semibold">✅ Order placed!</h1>
          <p className="mt-2 text-gray-600">Cash on Delivery selected. We’ll contact you soon.</p>

          <div className="mt-4 text-sm text-gray-500">
            Order ID: <span className="font-medium">{String(doneOrderId).slice(-8)}</span>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/orders"
              className="px-5 py-2.5 rounded-xl transition bg-black text-white hover:bg-[#BE171F]"
            >
              View Orders
            </Link>
            <Link href="/shop" className="px-5 py-2.5 rounded-xl border hover:bg-gray-50">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return <div className="max-w-6xl mx-auto px-6 py-16">Loading...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-white border rounded-2xl p-10 text-center">
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <p className="text-gray-600 mt-2">Your cart is empty.</p>
          <Link href="/shop" className="inline-block mt-6 px-6 py-2.5 rounded-xl bg-black text-white">
            Go to shop
          </Link>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Checkout</h1>
          <p className="text-sm text-gray-500 ml-1 mt-2">
            Confirm delivery details and place your order.
          </p>
        </div>

        <Link
          href="/cart"
          className="text-sm px-4 py-2 rounded-xl text-gray-50 bg-[#BE171F] hover:bg-gray-900 transition"
        >
          Back to cart
        </Link>
      </div>

      <div className="mt-10 grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 bg-white shadow-md rounded-2xl p-6">
          <h2 className="font-semibold text-lg">Delivery Information</h2>

          {error && (
            <div className="mt-4 border border-red-200 bg-red-50 text-red-700 rounded-2xl p-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={placeOrder} className="mt-6 grid gap-4">
            <Field label="Name" required>
              <input
                className="w-full text-sm bg-gray-100 rounded-xl px-3 py-3 outline-none"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your full name"
              />
            </Field>

            <Field label="Phone Number" required>
              <input
                className="w-full text-sm bg-gray-100 rounded-xl px-3 py-3 outline-none"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </Field>

            <Field label="Address" required>
              <textarea
                className="w-full text-sm bg-gray-100 rounded-xl px-3 py-3 min-h-[120px] outline-none"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House, road, area, thana, district..."
              />
            </Field>

            {/* Delivery Zone */}
            <div className="bg-gray-100 rounded-2xl p-4">
              <p className="text-sm font-medium text-gray-700">Delivery Area</p>

              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryZone("dhaka")}
                  className={`p-3 rounded-xl border-2 text-left hover:bg-gray-200 ${
                    deliveryZone === "dhaka" ? "border-black bg-gray-200" : "border-gray-200"
                  }`}
                >
                  <p className="font-medium">Inside Dhaka</p>
                  <p className="text-xs text-gray-500">Delivery charge ৳70</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryZone("outside")}
                  className={`p-3 rounded-xl border-2 text-left hover:bg-gray-200 ${
                    deliveryZone === "outside" ? "border-black bg-gray-200" : "border-gray-200"
                  }`}
                >
                  <p className="font-medium">Outside Dhaka</p>
                  <p className="text-xs text-gray-500">Delivery charge ৳130</p>
                </button>
              </div>
            </div>

            {/* Payment */}
            <div className="border rounded-2xl border-gray-200 bg-gray-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border flex items-center justify-center">
                <CashIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Cash on Delivery</p>
                <p className="text-sm text-gray-500">Pay when you receive the product.</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full border bg-green-50 text-green-900 border-green-400">
                Selected
              </span>
            </div>

            <button
              disabled={!canPlace}
              className="mt-2 w-full py-3 rounded-xl transition bg-[#BE171F] text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {placing ? "Placing order..." : `Place Order (৳${total})`}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By placing this order, you confirm your delivery information is correct.
            </p>
          </form>
        </div>

        {/* Summary */}
        <div className="bg-white shadow-sm rounded-2xl p-6 h-fit">
          <h2 className="font-semibold">Order Summary</h2>

          <div className="mt-4 space-y-3">
            {items.map((i) => {
              const selling = getSellingPrice(i);
              const showMrp = hasSale(i);

              return (
                <div key={i._id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden flex items-center justify-center">
                    {i.image ? (
                      <img src={i.image} alt={i.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-gray-400">No image</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{i.name}</p>

                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>Qty: {i.quantity}</span>
                      <span>•</span>
                      <span className="font-semibold text-[#BE171F]">৳{selling}</span>
                      {showMrp && <span className="line-through text-gray-400">৳{i.regularPrice}</span>}
                    </div>
                  </div>

                  <p className="text-sm font-semibold">৳{selling * i.quantity}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-gray-300 pt-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">৳{subtotal}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Delivery</span>
              <span className="font-medium">৳{deliveryCharge}</span>
            </div>

            <div className="flex justify-between pt-2 border-t border-gray-500">
              <span className="font-semibold text-lg">Total</span>
              <span className="font-semibold text-lg">৳{total}</span>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            You are ordering as:{" "}
            <span className="font-medium text-gray-700">{user.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="ml-1 text-sm text-gray-600 font-medium">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
