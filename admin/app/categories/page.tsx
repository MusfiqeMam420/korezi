"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "@/app/context/ToastContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type Subcategory = {
  _id?: string;
  name: string;
  slug?: string;
  children?: { _id?: string; name: string; slug?: string }[];
};

type Category = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  sortOrder?: number;
  subcategories: Subcategory[];
};

function parseLines(input: string) {
  return input
    .split("\n")
    .map((name) => ({ name: name.trim() }))
    .filter((item) => item.name);
}

function parseThirdCategories(input: string) {
  const map = new Map<string, { name: string }[]>();
  input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [parent, childrenText = ""] = line.split(":");
      const parentName = parent.trim();
      if (!parentName) return;
      const children = childrenText
        .split(",")
        .map((name) => ({ name: name.trim() }))
        .filter((item) => item.name);
      map.set(parentName.toLowerCase(), children);
    });
  return map;
}

function buildCategoryTree(subcategories: string, thirdCategories: string) {
  const thirdMap = parseThirdCategories(thirdCategories);
  return parseLines(subcategories).map((sub) => ({
    ...sub,
    children: thirdMap.get(sub.name.toLowerCase()) || [],
  }));
}

function treeToSecondText(tree: { name: string }[]) {
  return tree.map((item) => item.name).join("\n");
}

function treeToThirdText(tree: { name: string; children?: { name: string }[] }[]) {
  return tree
    .filter((item) => item.children?.length)
    .map((item) => `${item.name}: ${item.children?.map((child) => child.name).join(", ")}`)
    .join("\n");
}

export default function CategoriesPage() {
  const { success, error } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [description, setDescription] = useState("");
  const [subcategories, setSubcategories] = useState("");
  const [thirdCategories, setThirdCategories] = useState("");
  const [newSecond, setNewSecond] = useState("");
  const [selectedSecond, setSelectedSecond] = useState("");
  const [newThird, setNewThird] = useState("");
  const [quickMainId, setQuickMainId] = useState("");
  const [quickSecondName, setQuickSecondName] = useState("");
  const [quickNewSecond, setQuickNewSecond] = useState("");
  const [quickNewThird, setQuickNewThird] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/categories`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      setCategories(
        Array.isArray(data)
          ? [...data].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || a.name.localeCompare(b.name))
          : []
      );
    } catch {
      setCategories([]);
      error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(term) ||
        category.subcategories.some((sub) => sub.name.toLowerCase().includes(term))
      );
    });
  }, [categories, q]);

  const draftTree = useMemo(() => buildCategoryTree(subcategories, thirdCategories), [subcategories, thirdCategories]);
  const totalSecond = draftTree.length;
  const totalThird = draftTree.reduce((sum, item) => sum + (item.children?.length || 0), 0);
  const matchingCategory = useMemo(() => {
    const cleanName = name.trim().toLowerCase();
    if (!cleanName) return null;
    return categories.find((category) => category.name.toLowerCase() === cleanName) || null;
  }, [categories, name]);
  const willUpdateExisting = Boolean(editingId || matchingCategory);
  const quickMain = categories.find((category) => category._id === quickMainId) || null;
  const quickSecond = quickMain?.subcategories.find((sub) => sub.name === quickSecondName) || null;

  function resetForm() {
    setEditingId(null);
    setName("");
    setImage("");
    setDescription("");
    setSubcategories("");
    setThirdCategories("");
    setNewSecond("");
    setSelectedSecond("");
    setNewThird("");
  }

  function editCategory(category: Category) {
    setEditingId(category._id);
    setName(category.name);
    setImage(category.image || "");
    setDescription(category.description || "");
    setSubcategories(category.subcategories.map((sub) => sub.name).join("\n"));
    setThirdCategories(
      category.subcategories
        .filter((sub) => sub.children?.length)
        .map((sub) => `${sub.name}: ${sub.children?.map((child) => child.name).join(", ")}`)
        .join("\n")
    );
    setSelectedSecond(category.subcategories[0]?.name || "");
  }

  function chooseRootCategory(categoryId: string) {
    if (!categoryId) {
      resetForm();
      return;
    }

    const category = categories.find((item) => item._id === categoryId);
    if (category) editCategory(category);
  }

  function commitTree(tree: { name: string; children?: { name: string }[] }[]) {
    setSubcategories(treeToSecondText(tree));
    setThirdCategories(treeToThirdText(tree));
    if (selectedSecond && !tree.some((item) => item.name.toLowerCase() === selectedSecond.toLowerCase())) {
      setSelectedSecond(tree[0]?.name || "");
    }
  }

  function addSecondCategory() {
    const cleanName = newSecond.trim();
    if (!cleanName) return;
    if (draftTree.some((item) => item.name.toLowerCase() === cleanName.toLowerCase())) {
      error("2nd category already exists.");
      return;
    }
    const next = [...draftTree, { name: cleanName, children: [] }];
    commitTree(next);
    setSelectedSecond(cleanName);
    setNewSecond("");
  }

  function removeSecondCategory(nameToRemove: string) {
    commitTree(draftTree.filter((item) => item.name !== nameToRemove));
  }

  function addThirdCategory() {
    const parentName = selectedSecond || draftTree[0]?.name || "";
    const cleanName = newThird.trim();
    if (!parentName || !cleanName) return;

    const next = draftTree.map((item) => {
      if (item.name !== parentName) return item;
      const children = item.children || [];
      if (children.some((child) => child.name.toLowerCase() === cleanName.toLowerCase())) {
        error("3rd category already exists under this 2nd category.");
        return item;
      }
      return { ...item, children: [...children, { name: cleanName }] };
    });

    commitTree(next);
    setNewThird("");
  }

  function removeThirdCategory(parentName: string, childName: string) {
    commitTree(
      draftTree.map((item) =>
        item.name === parentName
          ? { ...item, children: (item.children || []).filter((child) => child.name !== childName) }
          : item
      )
    );
  }

  async function uploadCategoryImage(file: File | null) {
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${API_BASE}/api/uploads/categories`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) throw new Error(data?.message || "Image upload failed.");
      setImage(data.url);
      success("Category image uploaded.");
    } catch (err: any) {
      error(err?.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      error("Category name is required.");
      return;
    }

    setSaving(true);
    try {
      const thirdMap = parseThirdCategories(thirdCategories);
      const nestedSubcategories = parseLines(subcategories).map((sub) => ({
        ...sub,
        children: thirdMap.get(sub.name.toLowerCase()) || [],
      }));
      const existingRoot = categories.find((category) => category.name.toLowerCase() === name.trim().toLowerCase());
      const targetId = editingId || existingRoot?._id || "";
      const res = await fetch(`${API_BASE}/api/categories${targetId ? `/${targetId}` : ""}`, {
        method: targetId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          image: image.trim(),
          description: description.trim(),
          subcategories: nestedSubcategories,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Save failed.");

      success(targetId ? "Category tree updated." : "Category created.");
      resetForm();
      await loadCategories();
    } catch (err: any) {
      error(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: Category) {
    const ok = window.confirm(`Delete "${category.name}" and all its subcategories?`);
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/categories/${category._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Delete failed.");

      success("Category deleted.");
      if (editingId === category._id) resetForm();
      await loadCategories();
    } catch (err: any) {
      error(err?.message || "Delete failed.");
    }
  }

  async function moveMainCategory(categoryId: string, direction: "up" | "down") {
    const currentIndex = categories.findIndex((category) => category._id === categoryId);
    if (currentIndex < 0) return;

    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= categories.length) return;

    const nextCategories = [...categories];
    const [moved] = nextCategories.splice(currentIndex, 1);
    nextCategories.splice(nextIndex, 0, moved);
    setCategories(nextCategories);

    try {
      const res = await fetch(`${API_BASE}/api/categories/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderedIds: nextCategories.map((category) => category._id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Category order update failed.");

      if (Array.isArray(data.categories)) {
        setCategories(
          [...data.categories].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || a.name.localeCompare(b.name))
        );
      }
      success("Main category order updated.");
    } catch (err: any) {
      error(err?.message || "Category order update failed.");
      await loadCategories();
    }
  }

  async function quickSave(type: "second" | "third") {
    if (!quickMain) {
      error("Select a main category first.");
      return;
    }

    if (type === "second" && !quickNewSecond.trim()) {
      error("Enter a subcategory name.");
      return;
    }

    if (type === "third" && (!quickSecondName || !quickNewThird.trim())) {
      error("Select a subcategory and enter a 3rd category name.");
      return;
    }

    const nextSubcategories = quickMain.subcategories.map((sub) => ({
      name: sub.name,
      children: (sub.children || []).map((child) => ({ name: child.name })),
    }));

    if (type === "second") {
      const cleanName = quickNewSecond.trim();
      if (nextSubcategories.some((sub) => sub.name.toLowerCase() === cleanName.toLowerCase())) {
        error("That subcategory already exists.");
        return;
      }
      nextSubcategories.push({ name: cleanName, children: [] });
    } else {
      const cleanName = quickNewThird.trim();
      const target = nextSubcategories.find((sub) => sub.name === quickSecondName);
      if (!target) {
        error("Selected subcategory was not found.");
        return;
      }
      if (target.children.some((child) => child.name.toLowerCase() === cleanName.toLowerCase())) {
        error("That 3rd category already exists.");
        return;
      }
      target.children.push({ name: cleanName });
    }

    setQuickSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/categories/${quickMain._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: quickMain.name,
          image: quickMain.image || "",
          description: quickMain.description || "",
          subcategories: nextSubcategories,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Quick add failed.");

      success(type === "second" ? "Subcategory added." : "3rd category added.");
      setQuickNewSecond("");
      setQuickNewThird("");
      await loadCategories();
    } catch (err: any) {
      error(err?.message || "Quick add failed.");
    } finally {
      setQuickSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Catalog</p>
            <h1 className="text-2xl font-semibold tracking-tight">Categories & Subcategories</h1>
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

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <StatCard label="Main categories" value={categories.length} />
          <StatCard label="2nd categories" value={categories.reduce((sum, item) => sum + item.subcategories.length, 0)} />
          <StatCard label="3rd categories" value={categories.reduce((sum, item) => sum + item.subcategories.reduce((childSum, sub) => childSum + (sub.children?.length || 0), 0), 0)} />
          <StatCard label="With images" value={categories.filter((item) => item.image).length} />
        </div>

        <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Quick Add</h2>
              <p className="text-sm text-gray-500">Add one subcategory or one 3rd category without opening the full tree editor.</p>
            </div>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-[#BE171F]">Fast category update</span>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto_1fr_auto]">
            <select className="input" value={quickMainId} onChange={(e) => { setQuickMainId(e.target.value); setQuickSecondName(""); }}>
              <option value="">Select main category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>

            <input
              className="input"
              value={quickNewSecond}
              onChange={(e) => setQuickNewSecond(e.target.value)}
              placeholder="New subcategory under main"
            />
            <button
              type="button"
              disabled={quickSaving}
              onClick={() => quickSave("second")}
              className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:bg-[#BE171F] disabled:opacity-50"
            >
              Add Sub
            </button>

            <div className="grid gap-2 sm:grid-cols-2">
              <select className="input" value={quickSecondName} onChange={(e) => setQuickSecondName(e.target.value)} disabled={!quickMain}>
                <option value="">Select subcategory</option>
                {quickMain?.subcategories.map((sub) => (
                  <option key={sub._id || sub.name} value={sub.name}>{sub.name}</option>
                ))}
              </select>
              <input
                className="input"
                value={quickNewThird}
                onChange={(e) => setQuickNewThird(e.target.value)}
                placeholder="New 3rd category"
                disabled={!quickSecond}
              />
            </div>
            <button
              type="button"
              disabled={quickSaving}
              onClick={() => quickSave("third")}
              className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
            >
              Add 3rd
            </button>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <form onSubmit={saveCategory} className="rounded-xl border bg-white p-5 shadow-sm h-fit">
            <h2 className="text-lg font-semibold">{editingId ? "Edit Category" : "New Category"}</h2>
            <p className="mt-1 text-sm text-gray-500">Create a main category, upload its image, then add second and third-level categories.</p>

            <div className="mt-5 grid gap-4">
              <label>
                <span className="text-sm font-medium text-gray-700">Select Existing Main Category</span>
                <select
                  className="input mt-1"
                  value={editingId || ""}
                  onChange={(e) => chooseRootCategory(e.target.value)}
                >
                  <option value="">Create new main category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-sm font-medium text-gray-700">Main Category Name</span>
                <input
                  className="input mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Skincare"
                />
              </label>
              {!editingId && matchingCategory && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                  This main category already exists. Saving will update its subcategories instead of creating a duplicate.
                </div>
              )}

              <label>
                <span className="text-sm font-medium text-gray-700">Main Category Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="input mt-1"
                  disabled={uploadingImage}
                  onChange={(e) => uploadCategoryImage(e.target.files?.[0] || null)}
                />
              </label>

              {image && (
                <div className="overflow-hidden rounded-xl border bg-gray-50">
                  <img src={image} alt="" className="h-40 w-full object-cover" />
                  <input className="input rounded-none border-0 border-t" value={image} onChange={(e) => setImage(e.target.value)} />
                </div>
              )}

              <label>
                <span className="text-sm font-medium text-gray-700">Description</span>
                <textarea
                  className="input mt-1 min-h-24 resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional internal note"
                />
              </label>

              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Hierarchy Builder</p>
                    <p className="text-xs text-gray-500">Build 2nd and 3rd categories without formatting text by hand.</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-500">
                    {totalSecond} second / {totalThird} third
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      className="input"
                      value={newSecond}
                      onChange={(e) => setNewSecond(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSecondCategory();
                        }
                      }}
                      placeholder="Add 2nd category, e.g. Cleanser"
                    />
                    <button type="button" onClick={addSecondCategory} className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:bg-[#BE171F]">
                      Add 2nd
                    </button>
                  </div>

                  {draftTree.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {draftTree.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setSelectedSecond(item.name)}
                          className={[
                            "rounded-full border px-3 py-1.5 text-xs font-medium",
                            selectedSecond === item.name ? "border-[#BE171F] bg-red-50 text-[#BE171F]" : "bg-white text-gray-600",
                          ].join(" ")}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                    <select className="input" value={selectedSecond} onChange={(e) => setSelectedSecond(e.target.value)}>
                      <option value="">Select 2nd</option>
                      {draftTree.map((item) => (
                        <option key={item.name} value={item.name}>{item.name}</option>
                      ))}
                    </select>
                    <input
                      className="input"
                      value={newThird}
                      onChange={(e) => setNewThird(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addThirdCategory();
                        }
                      }}
                      placeholder="Add 3rd category, e.g. Foam Cleanser"
                    />
                    <button type="button" onClick={addThirdCategory} className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-gray-100">
                      Add 3rd
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {draftTree.length === 0 ? (
                      <div className="rounded-xl border border-dashed bg-white p-4 text-sm text-gray-400">No category levels added yet.</div>
                    ) : (
                      draftTree.map((item) => (
                        <div key={item.name} className="rounded-xl border bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <button type="button" onClick={() => setSelectedSecond(item.name)} className="text-sm font-semibold text-gray-950 hover:text-[#BE171F]">
                              {item.name}
                            </button>
                            <button type="button" onClick={() => removeSecondCategory(item.name)} className="text-xs text-red-600 hover:underline">
                              Remove
                            </button>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.children?.length ? (
                              item.children.map((child) => (
                                <span key={child.name} className="inline-flex items-center gap-2 rounded-full border bg-gray-50 px-3 py-1 text-xs">
                                  {child.name}
                                  <button type="button" onClick={() => removeThirdCategory(item.name, child.name)} className="text-red-500">
                                    x
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">No 3rd categories</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <details className="rounded-2xl border bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700">Advanced raw editor</summary>
                <div className="mt-4 grid gap-4">
                  <label>
                    <span className="text-sm font-medium text-gray-700">2nd Categories (one per line)</span>
                    <textarea
                      className="input mt-1 min-h-24 resize-y"
                      value={subcategories}
                      onChange={(e) => setSubcategories(e.target.value)}
                      placeholder={"Cleanser\nToner\nSerum\nSunscreen"}
                    />
                  </label>

                  <label>
                    <span className="text-sm font-medium text-gray-700">3rd Categories</span>
                    <textarea
                      className="input mt-1 min-h-24 resize-y"
                      value={thirdCategories}
                      onChange={(e) => setThirdCategories(e.target.value)}
                      placeholder={"Cleanser: Oil Cleanser, Foam Cleanser\nSerum: Vitamin C, Snail Serum"}
                    />
                  </label>
                </div>
              </details>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-black text-white hover:bg-[#BE171F] disabled:opacity-50"
              >
                {saving ? "Saving..." : willUpdateExisting ? "Update Category Tree" : "Create Category"}
              </button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-lg border hover:bg-gray-50">
                Clear
              </button>
            </div>
          </form>

          <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Category List</h2>
                <p className="text-sm text-gray-500">{categories.length} total categories. Use arrows to control storefront order.</p>
              </div>
              <input
                className="input max-w-sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search categories..."
              />
            </div>

            {loading ? (
              <div className="p-6 text-gray-500">Loading categories...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-gray-500">No categories found.</div>
            ) : (
              <div className="grid gap-4 p-5">
                {filtered.map((category) => {
                  const orderIndex = categories.findIndex((item) => item._id === category._id);
                  return (
                  <div key={category._id} className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          {category.image ? (
                            <img src={category.image} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                          ) : (
                            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gray-100 text-xs text-gray-400">No image</div>
                          )}
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-xs text-gray-500">/{category.slug}</p>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                              <span>{category.subcategories.length} second</span>
                              <span>•</span>
                              <span>{category.subcategories.reduce((sum, sub) => sum + (sub.children?.length || 0), 0)} third</span>
                            </div>
                          </div>
                        </div>
                        {category.description && (
                          <p className="mt-2 text-sm text-gray-600">{category.description}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <div className="flex overflow-hidden rounded-lg border">
                          <button
                            type="button"
                            onClick={() => moveMainCategory(category._id, "up")}
                            disabled={orderIndex <= 0 || q.trim().length > 0}
                            className="px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35"
                            title={q.trim() ? "Clear search before reordering" : "Move up"}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveMainCategory(category._id, "down")}
                            disabled={orderIndex < 0 || orderIndex >= categories.length - 1 || q.trim().length > 0}
                            className="border-l px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35"
                            title={q.trim() ? "Clear search before reordering" : "Move down"}
                          >
                            ↓
                          </button>
                        </div>
                        <button type="button" onClick={() => editCategory(category)} className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50">
                          Manage Tree
                        </button>
                        <button type="button" onClick={() => deleteCategory(category)} className="px-3 py-2 rounded-lg border text-sm text-red-700 hover:bg-red-50">
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {category.subcategories.length === 0 ? (
                        <span className="text-sm text-gray-400">No subcategories</span>
                      ) : (
                        category.subcategories.map((sub) => (
                          <div key={sub._id || sub.slug} className="rounded-xl border bg-gray-50 px-3 py-2 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <b>{sub.name}</b>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-500">{sub.children?.length || 0}</span>
                            </div>
                            {sub.children?.length ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {sub.children.map((child) => (
                                  <span key={child._id || child.slug || child.name} className="rounded-full bg-white px-2 py-1 text-xs text-gray-500">
                                    {child.name}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-950">{value}</p>
    </div>
  );
}
