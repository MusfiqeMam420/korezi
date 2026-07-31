"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "@/app/context/ToastContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.korezi.com";

type Brand = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
};

export default function BrandsPage() {
  const { success, error } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [bulkSheetUrl, setBulkSheetUrl] = useState("");
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkUpsert, setBulkUpsert] = useState(true);
  const [bulkLoading, setBulkLoading] = useState<"preview" | "import" | null>(null);
  const [bulkPreview, setBulkPreview] = useState<any | null>(null);
  const [bulkResult, setBulkResult] = useState<any | null>(null);

  async function loadBrands() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/brands`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch {
      setBrands([]);
      error("Failed to load brands.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return brands;
    return brands.filter((brand) => {
      return (
        brand.name.toLowerCase().includes(term) ||
        (brand.description || "").toLowerCase().includes(term)
      );
    });
  }, [brands, q]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setLogo("");
  }

  function editBrand(brand: Brand) {
    setEditingId(brand._id);
    setName(brand.name);
    setDescription(brand.description || "");
    setLogo(brand.logo || "");
  }

  async function uploadBrandLogo(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      error("Please select an image file.");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE}/api/uploads/brands`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Brand icon upload failed.");

      setLogo(String(data.url || ""));
      success("Brand icon uploaded.");
    } catch (err: any) {
      error(err?.message || "Brand icon upload failed.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function saveBrand(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      error("Brand name is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/brands${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          logo: logo.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Save failed.");

      success(editingId ? "Brand updated." : "Brand created.");
      resetForm();
      await loadBrands();
    } catch (err: any) {
      error(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBrand(brand: Brand) {
    const ok = window.confirm(`Delete "${brand.name}"? Existing products will keep their brand text.`);
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/brands/${brand._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Delete failed.");

      success("Brand deleted.");
      if (editingId === brand._id) resetForm();
      await loadBrands();
    } catch (err: any) {
      error(err?.message || "Delete failed.");
    }
  }

  async function loadBulkCsvFile(file: File | null) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      error("Please upload a CSV file. For XLSX, open it in Google Sheets and export as CSV.");
      return;
    }

    try {
      setBulkCsvText(await file.text());
      success("CSV loaded.");
    } catch {
      error("Could not read CSV file.");
    }
  }

  async function runBulkImport(dryRun: boolean) {
    if (!bulkSheetUrl.trim() && !bulkCsvText.trim()) {
      error("Add a Google Sheet link or upload/paste CSV first.");
      return;
    }

    setBulkLoading(dryRun ? "preview" : "import");
    setBulkResult(null);
    if (dryRun) setBulkPreview(null);

    try {
      const res = await fetch(`${API_BASE}/api/brands/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sheetUrl: bulkSheetUrl.trim(),
          csvText: bulkCsvText.trim(),
          dryRun,
          mode: bulkUpsert ? "upsert" : "create",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Brand bulk import failed.");

      if (dryRun) {
        setBulkPreview(data);
        success(`${data.brands || 0} brands ready.`);
      } else {
        setBulkResult(data);
        if (Array.isArray(data.brands)) setBrands(data.brands);
        else await loadBrands();
        success(`Imported: ${data.created || 0} created, ${data.updated || 0} updated.`);
      }
    } catch (err: any) {
      error(err?.message || "Brand bulk import failed.");
    } finally {
      setBulkLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Catalog</p>
            <h1 className="text-2xl font-semibold tracking-tight">Brands</h1>
          </div>

          <div className="flex gap-2">
            <Link href="/products" className="px-4 py-2 rounded-lg border bg-white text-sm hover:bg-gray-100">
              Products
            </Link>
            <Link href="/products/new" className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:bg-[#BE171F]">
              Upload Product
            </Link>
          </div>
        </div>
 <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <form onSubmit={saveBrand} className="rounded-xl border bg-white p-5 shadow-sm h-fit">
            <h2 className="text-lg font-semibold">{editingId ? "Edit Brand" : "New Brand"}</h2>
            <p className="mt-1 text-sm text-gray-500">Create reusable brand names for product uploads.</p>

            <div className="mt-5 grid gap-4">
              <label>
                <span className="text-sm font-medium text-gray-700">Brand Name</span>
                <input
                  className="input mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="COSRX"
                />
              </label>

              <div>
                <span className="text-sm font-medium text-gray-700">Brand Icon</span>
                <div className="mt-2 rounded-2xl border bg-gray-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-white">
                      {logo ? (
                        <img src={logo} alt="" className="h-full w-full object-contain p-1" />
                      ) : (
                        <span className="text-xl font-bold text-[#BE171F]">{name.trim().charAt(0).toUpperCase() || "B"}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingLogo}
                        onChange={(e) => uploadBrandLogo(e.target.files?.[0])}
                        className="block w-full rounded-xl border bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white disabled:opacity-60"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {uploadingLogo ? "Uploading and converting to WebP..." : "Upload a square brand icon. It auto-converts to WebP."}
                      </p>
                    </div>
                  </div>
                </div>

                <label className="mt-3 block">
                  <span className="text-sm font-medium text-gray-700">Logo URL</span>
                  <input
                    className="input mt-1"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="Optional image URL"
                  />
                </label>
              </div>

              <label>
                <span className="text-sm font-medium text-gray-700">Description</span>
                <textarea
                  className="input mt-1 min-h-28 resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional brand note"
                />
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-black text-white hover:bg-[#BE171F] disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update Brand" : "Create Brand"}
              </button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-lg border hover:bg-gray-50">
                Clear
              </button>
            </div>
          </form>

          <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Brand List</h2>
                <p className="text-sm text-gray-500">{brands.length} total brands</p>
              </div>
              <input
                className="input max-w-sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search brands..."
              />
            </div>

            {loading ? (
              <div className="p-6 text-gray-500">Loading brands...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-gray-500">No brands found.</div>
            ) : (
              <div className="divide-y">
                {filtered.map((brand) => (
                  <div key={brand._id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-xl border bg-gray-50 overflow-hidden flex items-center justify-center">
                          {brand.logo ? (
                            <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-semibold text-[#BE171F]">{brand.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{brand.name}</h3>
                          <p className="text-xs text-gray-500">/{brand.slug}</p>
                          {brand.description && (
                            <p className="mt-2 text-sm text-gray-600">{brand.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button type="button" onClick={() => editBrand(brand)} className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50">
                          Edit
                        </button>
                        <button type="button" onClick={() => deleteBrand(brand)} className="px-3 py-2 rounded-lg border text-sm text-red-700 hover:bg-red-50">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Bulk Brand Upload</h2>
              <p className="text-sm text-gray-500">Import brand names, icons, and descriptions from Google Sheets or CSV.</p>
            </div>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-[#BE171F]">
              Brand, Logo, Description
            </span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="grid gap-3">
              <label>
                <span className="text-sm font-medium text-gray-700">Google Sheet link</span>
                <input
                  className="input mt-1"
                  value={bulkSheetUrl}
                  onChange={(e) => setBulkSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
              </label>

              <label>
                <span className="text-sm font-medium text-gray-700">Upload CSV file</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => loadBulkCsvFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full rounded-xl border bg-white px-3 py-2 text-sm"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
                <span>
                  <strong>Update existing brands</strong>
                  <small className="block text-gray-500">Match by brand name or slug and update logo/description.</small>
                </span>
                <input
                  type="checkbox"
                  checked={bulkUpsert}
                  onChange={(e) => setBulkUpsert(e.target.checked)}
                  className="h-5 w-5 accent-[#BE171F]"
                />
              </label>
            </div>

            <label>
              <span className="text-sm font-medium text-gray-700">Or paste CSV</span>
              <textarea
                className="input mt-1 min-h-40"
                value={bulkCsvText}
                onChange={(e) => setBulkCsvText(e.target.value)}
                placeholder="Brand,Logo,Description&#10;COSRX,https://example.com/cosrx.png,Korean skincare brand"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!!bulkLoading}
              onClick={() => runBulkImport(true)}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
            >
              {bulkLoading === "preview" ? "Checking..." : "Preview Import"}
            </button>
            <button
              type="button"
              disabled={!!bulkLoading}
              onClick={() => runBulkImport(false)}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-[#BE171F] disabled:opacity-50"
            >
              {bulkLoading === "import" ? "Importing..." : "Import Brands"}
            </button>
          </div>

          {bulkPreview && (
            <div className="mt-5 rounded-xl border bg-gray-50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard label="Rows" value={bulkPreview.totalRows || 0} />
                <StatCard label="Brands" value={bulkPreview.brands || 0} />
              </div>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {(bulkPreview.preview || []).map((item: any) => (
                  <div key={item.name} className="flex items-center gap-3 rounded-xl border bg-white p-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border bg-gray-50">
                      {item.logo ? (
                        <img src={item.logo} alt="" className="h-full w-full object-contain p-1" />
                      ) : (
                        <span className="font-bold text-[#BE171F]">{String(item.name || "B").charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold">{item.name}</div>
                      <div className="truncate text-xs text-gray-500">{item.description || item.logo || "No extra info"}</div>
                    </div>
                  </div>
                ))}
              </div>
              {bulkPreview.errors?.length ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {bulkPreview.errors.slice(0, 8).map((issue: any, index: number) => (
                    <p key={`${issue.row}-${index}`}>Row {issue.row}: {issue.message}</p>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {bulkResult && (
            <div className="mt-5 rounded-xl border bg-gray-50 p-4 text-sm">
              <strong>Import complete:</strong> {bulkResult.created || 0} created, {bulkResult.updated || 0} updated, {bulkResult.skipped || 0} skipped, {bulkResult.failed || 0} failed.
            </div>
          )}
        </section>

       
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
