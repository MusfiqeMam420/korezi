"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/app/context/ToastContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type OrderStatus = "pending" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled";

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
  email?: string;
  phone: string;
  address: string;
  paymentMethod?: string;
  deliveryZone?: "dhaka" | "outside";
  deliveryCharge?: number;
  subtotal?: number;
  total?: number;
  items: OrderItem[];
  status?: OrderStatus;
  createdAt: string;
  updatedAt?: string;
};

const STATUSES: { value: OrderStatus; label: string; tone: string }[] = [
  { value: "pending", label: "Pending", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "processing", label: "Processing", tone: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "confirmed", label: "Confirmed", tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "shipped", label: "Shipped", tone: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "delivered", label: "Delivered", tone: "bg-green-50 text-green-700 border-green-200" },
  { value: "cancelled", label: "Cancelled", tone: "bg-red-50 text-red-700 border-red-200" },
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "high", label: "Highest total" },
  { value: "low", label: "Lowest total" },
];

const FULFILLMENT_FLOW: OrderStatus[] = ["pending", "processing", "confirmed", "shipped", "delivered"];

function statusMeta(status?: string) {
  return STATUSES.find((s) => s.value === status) || STATUSES[0];
}

function money(n: any) {
  return `৳${Number(n || 0).toLocaleString("en-BD")}`;
}

function shortId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleString("en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return d;
  }
}

function itemCount(order: Order) {
  return (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function nextStatus(status: OrderStatus): OrderStatus | null {
  if (status === "cancelled" || status === "delivered") return null;
  const currentIndex = FULFILLMENT_FLOW.indexOf(status);
  return FULFILLMENT_FLOW[currentIndex + 1] || null;
}

export default function AdminOrdersPage() {
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<Record<string, OrderStatus>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  function loadOrders() {
    setLoading(true);
    fetch(`${API_BASE}/api/orders`, { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setOrders(arr);
        const init: Record<string, OrderStatus> = {};
        arr.forEach((o: Order) => (init[o._id] = o.status || "pending"));
        setDraftStatus(init);
        setSelectedId((current) => current && arr.some((o: Order) => o._id === current) ? current : null);
      })
      .catch(() => error("Failed to load orders"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const totalRevenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    return {
      total: orders.length,
      today: orders.filter((o) => new Date(o.createdAt).toDateString() === today).length,
      pending: orders.filter((o) => (o.status || "pending") === "pending").length,
      revenue: totalRevenue,
    };
  }, [orders]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = orders.filter((o) => {
      const products = (o.items || []).map((item) => item.name || "").join(" ");
      const matchText =
        !term ||
        o.customerName?.toLowerCase().includes(term) ||
        o.email?.toLowerCase().includes(term) ||
        o.phone?.toLowerCase().includes(term) ||
        o.address?.toLowerCase().includes(term) ||
        products.toLowerCase().includes(term) ||
        o._id.toLowerCase().includes(term);

      const matchStatus = !statusFilter || (o.status || "pending") === statusFilter;
      const matchZone = !zoneFilter || o.deliveryZone === zoneFilter;
      return matchText && matchStatus && matchZone;
    });

    return [...list].sort((a, b) => {
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "high") return Number(b.total || 0) - Number(a.total || 0);
      if (sort === "low") return Number(a.total || 0) - Number(b.total || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders, q, statusFilter, zoneFilter, sort]);

  const selectedOrder = orders.find((o) => o._id === selectedId) || null;

  async function updateStatus(orderId: string) {
    const next = draftStatus[orderId];
    if (!next) return;

    setSavingId(orderId);
    const previous = orders;
    setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: next } : o)));

    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) throw new Error("Update failed");
      success(`Order ${shortId(orderId)} moved to ${statusMeta(next).label}`);
    } catch {
      setOrders(previous);
      error("Status update failed");
    } finally {
      setSavingId(null);
    }
  }

  function clearFilters() {
    setQ("");
    setStatusFilter("");
    setZoneFilter("");
    setSort("newest");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="rounded-[28px] bg-[var(--admin-ink)] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-200">Operations</p>
            <h1 className="mt-2 text-3xl font-bold">Order Control Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              Track new orders, verify payment and delivery details, then move each order through fulfillment.
            </p>
          </div>

          <button
            onClick={loadOrders}
            disabled={loading}
            className="rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold transition hover:bg-[var(--admin-red)] disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh orders"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total orders" value={stats.total} />
          <Metric label="Today" value={stats.today} />
          <Metric label="Pending" value={stats.pending} />
          <Metric label="Revenue" value={money(stats.revenue)} />
        </div>
      </section>

      <section className="mt-6 rounded-[24px] border border-[var(--admin-line)] bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_170px_170px_180px_auto]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order id, customer, phone, product..."
            className="input"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="input">
            <option value="">All status</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="input">
            <option value="">All zones</option>
            <option value="dhaka">Dhaka</option>
            <option value="outside">Outside Dhaka</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button onClick={clearFilters} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50">
            Clear
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(statusFilter === s.value ? "" : s.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === s.value ? "border-[var(--admin-red)] bg-red-50 text-[var(--admin-crimson)]" : "border-gray-200 bg-white text-gray-600 hover:border-[var(--admin-red)]"
              }`}
            >
              {s.label} {orders.filter((o) => (o.status || "pending") === s.value).length}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="overflow-hidden rounded-[24px] border border-[var(--admin-line)] bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Orders</h2>
            <p className="mt-1 text-sm text-gray-500">Showing {filtered.length} of {orders.length}</p>
          </div>

          {loading ? (
            <OrderSkeleton />
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No orders match your filters.</div>
          ) : (
            <div className="divide-y">
              {filtered.map((order) => {
                const status = statusMeta(order.status);
                const selected = selectedOrder?._id === order._id;
                return (
                  <button
                    key={order._id}
                    onClick={() => setSelectedId(order._id)}
                    className={`block w-full p-4 text-left transition hover:bg-gray-50 ${selected ? "bg-red-50/50 ring-1 ring-inset ring-[var(--admin-red)]" : "bg-white"}`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-950">{shortId(order._id)}</span>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${status.tone}`}>{status.label}</span>
                          <span className="rounded-full border bg-gray-50 px-2.5 py-1 text-xs text-gray-500">{order.paymentMethod || "COD"}</span>
                        </div>
                        <p className="mt-2 font-medium">{order.customerName}</p>
                        <p className="mt-1 text-sm text-gray-500">{order.phone} {order.email ? `· ${order.email}` : ""}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-gray-500">{order.address}</p>
                        <p className="mt-2 text-xs font-semibold text-[var(--admin-crimson)]">
                          {selected ? "Popup open" : "Click to view details"}
                        </p>
                      </div>

                      <div className="text-left lg:text-right">
                        <p className="font-semibold text-gray-950">{money(order.total)}</p>
                        <p className="mt-1 text-xs text-gray-500">{itemCount(order)} item{itemCount(order) === 1 ? "" : "s"} · {fmtDate(order.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedOrder && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onClick={() => setSelectedId(null)}
          >
            <div
              className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
            <OrderDetails
              order={selectedOrder}
              draftStatus={draftStatus[selectedOrder._id] || selectedOrder.status || "pending"}
              setDraftStatus={(value) => setDraftStatus((prev) => ({ ...prev, [selectedOrder._id]: value }))}
              onSave={() => updateStatus(selectedOrder._id)}
              saving={savingId === selectedOrder._id}
              onClose={() => setSelectedId(null)}
            />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/7 p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-white/55">{label}</p>
    </div>
  );
}

function OrderDetails({
  order,
  draftStatus,
  setDraftStatus,
  onSave,
  saving,
  onClose,
}: {
  order: Order;
  draftStatus: OrderStatus;
  setDraftStatus: (value: OrderStatus) => void;
  onSave: () => void;
  saving: boolean;
  onClose: () => void;
}) {
  const currentStatus = order.status || "pending";
  const changed = draftStatus !== currentStatus;
  const next = nextStatus(currentStatus);

  return (
    <div className="flex max-h-[92vh] flex-col">
      <div className="border-b p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-crimson)]">Order Details</p>
            <h2 className="mt-1 text-xl font-semibold">{shortId(order._id)}</h2>
            <p className="mt-1 text-sm text-gray-500">{order.customerName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusMeta(currentStatus).tone}`}>
              {statusMeta(currentStatus).label}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full border bg-white text-lg leading-none hover:bg-gray-50"
              aria-label="Close order details"
            >
              ×
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">{fmtDate(order.createdAt)}</p>
      </div>

      <div className="space-y-5 overflow-y-auto p-5">
        <section>
          <h3 className="text-sm font-semibold">Fulfillment</h3>
          <p className="mt-1 text-xs text-gray-500">Click a step below or use quick actions to update this order.</p>

          <StatusTimeline active={draftStatus} onSelect={setDraftStatus} />

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value as OrderStatus)} className="input">
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button
              onClick={onSave}
              disabled={!changed || saving}
              className="rounded-xl bg-[var(--admin-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--admin-red)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {saving ? "Saving..." : changed ? "Save status" : "Saved"}
            </button>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {next && (
              <button
                type="button"
                onClick={() => setDraftStatus(next)}
                className="rounded-xl border border-[var(--admin-red)] bg-red-50 px-3 py-2 text-xs font-semibold text-[var(--admin-crimson)] hover:bg-red-100"
              >
                Mark {statusMeta(next).label}
              </button>
            )}
            {currentStatus !== "delivered" && currentStatus !== "cancelled" && (
              <button
                type="button"
                onClick={() => setDraftStatus("delivered")}
                className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100"
              >
                Complete order
              </button>
            )}
            {currentStatus !== "cancelled" && currentStatus !== "delivered" && (
              <button
                type="button"
                onClick={() => setDraftStatus("cancelled")}
                className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 sm:col-span-2"
              >
                Cancel order
              </button>
            )}
          </div>
        </section>

        <section className="grid gap-3">
          <InfoCard title="Customer">
            <p className="font-medium">{order.customerName}</p>
            <p className="mt-1 text-sm text-gray-600">{order.phone}</p>
            {order.email && <p className="mt-1 text-sm text-gray-600">{order.email}</p>}
          </InfoCard>
          <InfoCard title="Delivery">
            <p className="text-sm text-gray-700">{order.address}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-gray-500">{order.deliveryZone === "outside" ? "Outside Dhaka" : "Dhaka"}</p>
          </InfoCard>
        </section>

        <section>
          <h3 className="text-sm font-semibold">Items</h3>
          <div className="mt-3 space-y-2">
            {(order.items || []).map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="flex items-center gap-3 rounded-2xl border bg-gray-50 p-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
                  {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-gray-400">IMG</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{item.name || "Item"}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.quantity} × {money(item.price)}</p>
                </div>
                <p className="text-sm font-semibold">{money(Number(item.price || 0) * Number(item.quantity || 0))}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-gray-50 p-4">
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={money(order.subtotal)} />
            <Row label="Delivery" value={money(order.deliveryCharge)} />
            <Row label="Payment" value={order.paymentMethod || "COD"} />
            <div className="border-t pt-2">
              <Row label="Total" value={money(order.total)} strong />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusTimeline({ active, onSelect }: { active: OrderStatus; onSelect: (status: OrderStatus) => void }) {
  const activeIndex = FULFILLMENT_FLOW.indexOf(active);

  if (active === "cancelled") {
    return (
      <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-medium text-red-700">
        This order is cancelled. Select another status if you need to reopen it.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {FULFILLMENT_FLOW.map((status, idx) => {
        const meta = statusMeta(status);
        const done = idx < activeIndex;
        const current = idx === activeIndex;

        return (
          <button
            key={status}
            type="button"
            onClick={() => onSelect(status)}
            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
              current
                ? "border-[var(--admin-red)] bg-red-50"
                : done
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-white hover:border-[var(--admin-red)]"
            }`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                current
                  ? "bg-[var(--admin-red)] text-white"
                  : done
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {done ? "✓" : idx + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{meta.label}</span>
              <span className="block text-xs text-gray-500">
                {current ? "Current step" : done ? "Completed" : "Waiting"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "text-base font-bold" : ""}`}>
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-950">{value}</span>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="p-4">
          <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
          <div className="mt-3 h-5 w-48 animate-pulse rounded bg-gray-100" />
          <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
