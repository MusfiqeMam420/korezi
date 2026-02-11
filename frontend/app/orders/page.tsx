"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type OrderItem = {
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  _id: string;
  createdAt: string;
  status: string;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  customerName: string;
  phone: string;
  address: string;
  items: OrderItem[];
};

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const cls =
    s === "delivered"
      ? "bg-green-200 text-green-700 border-green-200"
      : s === "cancelled"
      ? "bg-red-200 text-red-700 border-red-200"
      : s === "shipped"
      ? "bg-blue-200 text-blue-700 border-blue-200"
      : s === "processing"
      ? "bg-yellow-200 text-yellow-800 border-yellow-200"
      : "bg-gray-200 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${cls}`}>
      {s ? s.charAt(0).toUpperCase() + s.slice(1) : "Pending"}
    </span>
  );
}

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setOrdersLoading(true);
    fetch(`${API_BASE}/api/orders/my`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.resolve([])))
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-16">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-white border rounded-2xl p-10 text-center">
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-gray-600 mt-2">Please login to view your orders.</p>

          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login" className="px-6 py-2.5 rounded-xl bg-black text-white">
              Login
            </Link>
            <Link href="/signup" className="px-6 py-2.5 rounded-xl border hover:bg-gray-50">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">My Orders</h1>
          <p className="text-sm text-gray-500 mt-2">Track your recent purchases from Korezi.</p>
        </div>

        <Link href="/shop" className="text-sm px-4 py-2 rounded-xl  text-gray-50 bg-[#BE171F] hover:bg-gray-900 transition cursor-pointer">
          Continue shopping
        </Link>
      </div>

      <div className="mt-10 shadow-sm   rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-300 bg-gray-100">
          <h2 className="font-semibold">Order List</h2>
          <p className="text-sm text-gray-500">All your orders</p>
        </div>

        {ordersLoading ? (
          <div className="p-6 text-gray-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-gray-600">
            You don’t have any orders yet.
            <div className="mt-4">
              <Link href="/shop" className="px-6 py-2.5 rounded-xl bg-black text-white">
                Shop now
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {orders.map((o) => (
              <div key={o._id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      Order #{o._id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(o.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">৳{o.total}</p>
                    <div className="mt-1">
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
                  <div className="md:col-span-2">
                    <p className="text-gray-500 text-xs">Delivery Address</p>
                    <p className="text-gray-800">{o.address}</p>
                    <p className="text-gray-500 text-xs mt-2">Phone</p>
                    <p className="text-gray-800">{o.phone}</p>
                  </div>

                  <div className=" bg-gray-100 rounded-2xl p-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">৳{o.subtotal}</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">Delivery</span>
                      <span className="font-medium">৳{o.deliveryCharge}</span>
                    </div>
                    <div className="flex justify-between mt-3 pt-3 border-t">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold">৳{o.total}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-700 space-y-1">
                  <p className="text-xs text-gray-500">Items</p>
                  {o.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between gap-4">
                      <span className="truncate">
                        {it.name} × {it.quantity}
                      </span>
                      <span className="shrink-0">৳{it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
