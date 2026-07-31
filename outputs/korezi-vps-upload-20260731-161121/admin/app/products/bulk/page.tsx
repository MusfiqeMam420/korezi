"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "@/app/context/ToastContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.korezi.com";

type PreviewRow = {
  row: number;
  name: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  thirdCategory?: string;
  regularPrice: number;
  salePrice?: number | null;
  stock: number;
  images: number;
};

type ImportIssue = {
  row?: number;
  field?: string;
  message: string;
};

type PreviewResult = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ImportIssue[];
  warnings: ImportIssue[];
  preview: PreviewRow[];
};

type ImportResult = {
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: ImportIssue[];
  warnings: ImportIssue[];
};

const sampleHeaders = [
  "PRODUCT",
  "MRP",
  "PRICE",
  "Stock",
  "BRAND",
  "CATEGORY",
  "SUBCATEGORY",
  "3RD CATEGORY",
  "SKIN",
  "Concerns",
  "Tags",
  "DES",
  "Image 1",
  "Image 2",
];

export default function BulkProductUploadPage() {
  const { success, error, info } = useToast();
  const [sheetUrl, setSheetUrl] = useState("");
  const [csvText, setCsvText] = useState("");
  const [importImages, setImportImages] = useState(true);
  const [upsert, setUpsert] = useState(true);
  const [loading, setLoading] = useState<"preview" | "import" | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const hasSource = useMemo(() => sheetUrl.trim() || csvText.trim(), [sheetUrl, csvText]);

  async function runBulkImport(dryRun: boolean) {
    if (!hasSource) {
      error("Add a Google Sheet link or paste CSV first.");
      return;
    }

    setLoading(dryRun ? "preview" : "import");
    setResult(null);
    if (dryRun) setPreview(null);

    try {
      const res = await fetch(`${API_BASE}/api/products/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sheetUrl: sheetUrl.trim(),
          csvText: csvText.trim(),
          importImages,
          dryRun,
          mode: upsert ? "upsert" : "create",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Bulk upload failed.");

      if (dryRun) {
        setPreview(data);
        info(`${data.validRows || 0} rows ready, ${data.invalidRows || 0} need fixes.`);
      } else {
        setResult(data);
        success(`Imported: ${data.created || 0} created, ${data.updated || 0} updated.`);
      }
    } catch (err: any) {
      error(err?.message || "Bulk upload failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="mx-auto w-[min(1180px,calc(100%-32px))] py-8">
      <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-red-600">Catalog</p>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Product Upload</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Import products from Google Sheets. Public image URLs are downloaded and converted to WebP automatically.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/products" className="rounded-xl border border-black px-4 py-2 text-sm hover:bg-white">
            Products
          </Link>
          <Link href="/products/new" className="rounded-xl bg-black px-4 py-2 text-sm text-white">
            Single Upload
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-black bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Sheet Source</h2>
          <p className="mt-1 text-sm text-gray-600">
            Share the Google Sheet as anyone with link can view, then paste the sheet URL here.
          </p>

          <label className="mt-5 block text-sm font-semibold" htmlFor="sheet-url">
            Google Sheet link
          </label>
          <input
            id="sheet-url"
            value={sheetUrl}
            onChange={(event) => setSheetUrl(event.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-red-500"
          />

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-bold uppercase text-gray-400">or</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <label className="block text-sm font-semibold" htmlFor="csv-text">
            Paste CSV
          </label>
          <textarea
            id="csv-text"
            value={csvText}
            onChange={(event) => setCsvText(event.target.value)}
            placeholder="PRODUCT,MRP,PRICE,Stock,BRAND,CATEGORY..."
            rows={8}
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-red-500"
          />

          <div className="mt-5 grid gap-3 rounded-2xl bg-gray-50 p-4">
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                <strong>Auto import images</strong>
                <small className="block text-gray-500">Image URLs become WebP files on your server.</small>
              </span>
              <input
                type="checkbox"
                checked={importImages}
                onChange={(event) => setImportImages(event.target.checked)}
                className="h-5 w-5 accent-red-600"
              />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                <strong>Update existing products</strong>
                <small className="block text-gray-500">Match by product name or slug and update it.</small>
              </span>
              <input
                type="checkbox"
                checked={upsert}
                onChange={(event) => setUpsert(event.target.checked)}
                className="h-5 w-5 accent-red-600"
              />
            </label>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => runBulkImport(true)}
              disabled={!!loading}
              className="rounded-xl border border-black px-4 py-3 font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              {loading === "preview" ? "Checking..." : "Preview"}
            </button>
            <button
              type="button"
              onClick={() => runBulkImport(false)}
              disabled={!!loading}
              className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white shadow-lg shadow-red-600/20 disabled:opacity-50"
            >
              {loading === "import" ? "Importing..." : "Import Products"}
            </button>
          </div>
        </div>

        <div className="grid gap-6">
          <section className="rounded-2xl border border-black bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">Sheet Format</h2>
                <p className="text-sm text-gray-600">Use these headers. Extra columns are ignored.</p>
              </div>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                Images: URL only
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {sampleHeaders.map((header) => (
                <span key={header} className="rounded-full border bg-gray-50 px-3 py-1 text-xs font-semibold">
                  {header}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              For Google Drive images, share each image publicly and paste the file link into an image column.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Category values are matched against your category database. If you put a 3rd category like Serum in CATEGORY, preview can resolve it to its main/sub category path.
            </p>
          </section>

          <section className="rounded-2xl border border-black bg-white shadow-sm">
            <div className="border-b border-black p-5">
              <h2 className="text-xl font-bold">Preview & Result</h2>
              <p className="text-sm text-gray-600">
                Preview checks required fields before touching your product database.
              </p>
            </div>

            {!preview && !result ? (
              <div className="p-8 text-sm text-gray-500">No preview yet.</div>
            ) : null}

            {preview ? (
              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Stat label="Rows" value={preview.totalRows} />
                  <Stat label="Ready" value={preview.validRows} />
                  <Stat label="Needs Fix" value={preview.invalidRows} />
                </div>

                <div className="mt-5 overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-3">Row</th>
                        <th className="px-3 py-3">Product</th>
                        <th className="px-3 py-3">Brand</th>
                        <th className="px-3 py-3">Category</th>
                        <th className="px-3 py-3">Price</th>
                        <th className="px-3 py-3">Stock</th>
                        <th className="px-3 py-3">Images</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.map((row) => (
                        <tr key={`${row.row}-${row.name}`} className="border-t">
                          <td className="px-3 py-3">{row.row}</td>
                          <td className="px-3 py-3 font-semibold">{row.name}</td>
                          <td className="px-3 py-3">{row.brand || "-"}</td>
                          <td className="px-3 py-3">
                            {[row.category, row.subCategory, row.thirdCategory].filter(Boolean).join(" / ") || "-"}
                          </td>
                          <td className="px-3 py-3">৳{row.salePrice || row.regularPrice}</td>
                          <td className="px-3 py-3">{row.stock}</td>
                          <td className="px-3 py-3">{row.images}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <IssueList title="Preview Warnings" issues={preview.warnings || []} />
                <IssueList title="Preview Errors" issues={preview.errors} />
              </div>
            ) : null}

            {result ? (
              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-5">
                  <Stat label="Created" value={result.created} />
                  <Stat label="Updated" value={result.updated} />
                  <Stat label="Skipped" value={result.skipped} />
                  <Stat label="Failed" value={result.failed} />
                  <Stat label="Rows" value={result.totalRows} />
                </div>
                <IssueList title="Warnings" issues={result.warnings} />
                <IssueList title="Errors" issues={result.errors} />
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-4">
      <div className="text-xs font-bold uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function IssueList({ title, issues }: { title: string; issues: ImportIssue[] }) {
  if (!issues?.length) return null;

  return (
    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
      <h3 className="font-bold text-red-700">{title}</h3>
      <div className="mt-2 grid gap-2 text-sm text-red-700">
        {issues.slice(0, 12).map((issue, index) => (
          <p key={`${issue.row || "all"}-${index}`}>
            {issue.row ? `Row ${issue.row}: ` : ""}
            {issue.message}
          </p>
        ))}
      </div>
      {issues.length > 12 ? (
        <p className="mt-2 text-xs text-red-600">Showing first 12 of {issues.length} issues.</p>
      ) : null}
    </div>
  );
}
