"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type Order = {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
};

export default function AccountPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setOrdersLoading(true);
    fetch(`${API_BASE}/api/orders/my`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-6 py-16">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white border rounded-2xl p-10 text-center">
          <p className="text-gray-600">You are not logged in.</p>
          <Link href="/login" className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-black text-white">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold">My Account</h1>

      <div className="mt-6 bg-white shadow-sm  rounded-2xl p-6">
        <p className="text-sm text-gray-500">Name</p>
        <p className="font-medium">{user.name}</p>

        <p className="text-sm text-gray-500 mt-4">Email</p>
        <p className="font-medium">{user.email}</p>
      </div>

      <div className="mt-8  shadow-sm  rounded-2xl overflow-hidden">
        <div className="p-6 border-b bg-gray-100 border-gray-300">
          <h2 className="text-lg font-semibold">Order History</h2>
          <p className="text-sm text-gray-500">Your recent orders</p>
        </div>

        {ordersLoading ? (
          <div className="p-6 text-gray-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-gray-500">No orders yet.</div>
        ) : (
          <div className="divide-y">
            {orders.map((o) => (
              <div key={o._id} className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Order #{o._id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(o.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">৳{o.total}</p>
                    <p className="text-xs text-gray-500 capitalize">{o.status}</p>
                  </div>
                </div>

                <div className="mt-3 text-sm text-gray-700">
                  {o.items.slice(0, 3).map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate">{it.name} × {it.quantity}</span>
                      <span>৳{it.price * it.quantity}</span>
                    </div>
                  ))}
                  {o.items.length > 3 && (
                    <p className="text-xs text-gray-500 mt-1">
                      + {o.items.length - 3} more item(s)
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
