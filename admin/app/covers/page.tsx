"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/app/context/ToastContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type Cover = {
  _id: string;
  title?: string;
  subtitle?: string;
  image: string;
  href?: string;
  isActive: boolean;
  sortOrder: number;
};

export default function CoversPage() {
  const { success, error } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [covers, setCovers] = useState<Cover[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [href, setHref] = useState("/shop");
  const [sortOrder, setSortOrder] = useState(0);

  function load() {
    setLoading(true);
    fetch(`${API_BASE}/api/covers?all=true`, { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setCovers(Array.isArray(data) ? data : []))
      .catch(() => error("Failed to load covers"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseFile(nextFile: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(nextFile ? URL.createObjectURL(nextFile) : "");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      error("Choose a cover image first.");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("image", file);

      const uploadRes = await fetch(`${API_BASE}/api/uploads/covers`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) throw new Error(uploadData?.message || `Cover upload failed (${uploadRes.status})`);

      const res = await fetch(`${API_BASE}/api/covers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          subtitle,
          href,
          sortOrder,
          image: uploadData.url,
          isActive: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Cover create failed (${res.status})`);

      success("Cover added.");
      setTitle("");
      setSubtitle("");
      setHref("/shop");
      setSortOrder(0);
      chooseFile(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err: any) {
      error(err?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function updateCover(cover: Cover, patch: Partial<Cover>) {
    const next = { ...cover, ...patch };
    setCovers((prev) => prev.map((item) => (item._id === cover._id ? next : item)));
    try {
      const res = await fetch(`${API_BASE}/api/covers/${cover._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("Update failed");
      success("Cover updated.");
    } catch {
      error("Cover update failed.");
      load();
    }
  }

  async function deleteCover(id: string) {
    if (!confirm("Delete this cover image?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/covers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      success("Cover deleted.");
      setCovers((prev) => prev.filter((item) => item._id !== id));
    } catch {
      error("Cover delete failed.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Storefront</p>
          <h1 className="text-2xl font-semibold">Cover Carousel</h1>
          <p className="mt-1 text-sm text-gray-500">Upload homepage cover images. They auto-convert to WebP.</p>
        </div>
        <button onClick={load} className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-gray-50">
          Refresh
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
        <form onSubmit={submit} className="h-fit rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Add Cover</h2>
          <p className="mt-1 text-sm text-gray-500">Best size: wide image around 2200 x 900.</p>

          <div className="mt-5 space-y-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => chooseFile(e.target.files?.[0] || null)}
              className="input"
            />
            {preview && (
              <div className="overflow-hidden rounded-2xl border bg-gray-50">
                <img src={preview} alt="" className="h-48 w-full object-cover" />
              </div>
            )}
            <input className="input" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="input" placeholder="Subtitle (optional)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            <input className="input" placeholder="/shop or promo link" value={href} onChange={(e) => setHref(e.target.value)} />
            <input className="input" type="number" placeholder="Sort order" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
            <button disabled={saving} className="w-full rounded-xl bg-black px-5 py-3 text-white hover:bg-[var(--admin-red)] disabled:opacity-50">
              {saving ? "Uploading..." : "Add Cover"}
            </button>
          </div>
        </form>

        <section className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">Carousel Images</h2>
            <p className="mt-1 text-sm text-gray-500">{covers.length} cover image(s)</p>
          </div>

          {loading ? (
            <div className="p-6 text-gray-500">Loading covers...</div>
          ) : covers.length === 0 ? (
            <div className="p-6 text-gray-500">No cover images yet.</div>
          ) : (
            <div className="grid gap-4 p-5">
              {covers.map((cover) => (
                <div key={cover._id} className="grid gap-4 rounded-2xl border p-4 xl:grid-cols-[260px_1fr_auto]">
                  <img src={cover.image} alt="" className="h-36 w-full rounded-xl object-cover" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input className="input" value={cover.title || ""} onChange={(e) => updateCover(cover, { title: e.target.value })} placeholder="Title" />
                    <input className="input" value={cover.href || ""} onChange={(e) => updateCover(cover, { href: e.target.value })} placeholder="Link" />
                    <input className="input md:col-span-2" value={cover.subtitle || ""} onChange={(e) => updateCover(cover, { subtitle: e.target.value })} placeholder="Subtitle" />
                    <input className="input" type="number" value={cover.sortOrder || 0} onChange={(e) => updateCover(cover, { sortOrder: Number(e.target.value) })} />
                    <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                      <input type="checkbox" checked={cover.isActive} onChange={(e) => updateCover(cover, { isActive: e.target.checked })} />
                      Active
                    </label>
                  </div>
                  <button onClick={() => deleteCover(cover._id)} className="h-fit rounded-xl border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
