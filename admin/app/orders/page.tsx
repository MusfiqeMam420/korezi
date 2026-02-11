"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/app/context/ToastContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type OrderItem = {
  productId: string;
  name?: string;
  quantity: number;
  price: number;
  image?: string;
};

type Order = {
  _id: string;
  userId?: string | null;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod?: string;
  deliveryZone?: string;
  deliveryCharge?: number;
  subtotal?: number;
  total?: number;
  items: OrderItem[];
  status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
};

const STATUSES: Order["status"][] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function money(n: any) {
  const num = Number(n || 0);
  return `৳${num}`;
}

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

export default function AdminOrdersPage() {
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // store per-order pending status selection
  const [draftStatus, setDraftStatus] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  function loadOrders() {
    setLoading(true);
    fetch(`${API_BASE}/api/orders`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setOrders(arr);
        // init draft
        const init: Record<string, string> = {};
        arr.forEach((o: Order) => (init[o._id] = o.status || "pending"));
        setDraftStatus(init);
      })
      .catch(() => error("Failed to load orders"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders.filter((o) => {
      const matchText =
        !term ||
        o.customerName?.toLowerCase().includes(term) ||
        o.phone?.toLowerCase().includes(term) ||
        o._id.toLowerCase().includes(term);

      const matchStatus = !statusFilter || (o.status || "pending") === statusFilter;
      return matchText && matchStatus;
    });
  }, [orders, q, statusFilter]);

  async function updateStatus(orderId: string) {
    const next = draftStatus[orderId];
    if (!next) return;

    setSavingId(orderId);

    // optimistic UI
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status: next as any } : o))
    );

    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) throw new Error("Update failed");
      success("Order status updated ✅");
    } catch (e) {
      error("Status update failed");
      // reload to revert if needed
      loadOrders();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage Korezi orders and update status.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="px-4 py-2 rounded-xl border hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, phone, order id..."
          className="w-full border rounded-2xl px-4 py-3"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full border rounded-2xl px-4 py-3 bg-white"
        >
          <option value="">All status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="text-sm text-gray-500 flex items-center">
          Showing <b className="mx-1 text-gray-900">{filtered.length}</b> orders
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 bg-white border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-gray-500">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr className="text-left">
                  <th className="p-4">Order</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((o) => (
                  <tr key={o._id} className="border-t">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{o._id}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {fmtDate(o.createdAt)}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-xs text-gray-600 mt-1">{o.phone}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {o.address}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-gray-900">
                        {o.items?.length || 0} items
                      </div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {(o.items || [])
                          .slice(0, 2)
                          .map((it) => `${it.quantity}× ${it.name || "Item"}`)
                          .join(", ")}
                        {(o.items || []).length > 2 ? "..." : ""}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{money(o.total)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        COD: {o.paymentMethod || "COD"}
                      </div>
                    </td>

                    <td className="p-4">
                      <select
                        value={draftStatus[o._id] || o.status || "pending"}
                        onChange={(e) =>
                          setDraftStatus((prev) => ({ ...prev, [o._id]: e.target.value }))
                        }
                        className="border rounded-xl px-3 py-2 bg-white"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      <div className="text-xs text-gray-500 mt-2">
                        Current: <b className="text-gray-900">{o.status || "pending"}</b>
                      </div>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => updateStatus(o._id)}
                        disabled={savingId === o._id}
                        className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
                      >
                        {savingId === o._id ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Small help */}
      <p className="mt-4 text-xs text-gray-500">
        Tip: Later we’ll add “Order Details” modal + printing invoice + shipping tracking.
      </p>
    </div>
  );
}
