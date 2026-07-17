const express = require("express");
const slugify = require("slugify");
const Category = require("../models/Category");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

function makeSlug(value) {
  return slugify(String(value || ""), { lower: true, strict: true }) || "category";
}

function normalizeSubcategories(input) {
  const seen = new Set();
  return (Array.isArray(input) ? input : [])
    .map((item) => {
      const name = typeof item === "string" ? item : item?.name;
      const cleanName = String(name || "").trim();
      const slug = makeSlug(cleanName);
      const childSeen = new Set();
      const children = (Array.isArray(item?.children) ? item.children : [])
        .map((child) => {
          const childName = typeof child === "string" ? child : child?.name;
          const cleanChildName = String(childName || "").trim();
          const childSlug = makeSlug(cleanChildName);
          return cleanChildName ? { name: cleanChildName, slug: childSlug } : null;
        })
        .filter(Boolean)
        .filter((child) => {
          if (childSeen.has(child.slug)) return false;
          childSeen.add(child.slug);
          return true;
        });
      return cleanName ? { name: cleanName, slug, children } : null;
    })
    .filter(Boolean)
    .filter((item) => {
      if (seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    });
}

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Category name is required." });
    const lastCategory = await Category.findOne().sort({ sortOrder: -1, createdAt: -1 }).select("sortOrder");

    const category = await Category.create({
      name,
      slug: makeSlug(name),
      image: String(req.body.image || "").trim(),
      description: String(req.body.description || "").trim(),
      sortOrder: Number.isFinite(Number(req.body.sortOrder)) ? Number(req.body.sortOrder) : Number(lastCategory?.sortOrder || 0) + 1,
      subcategories: normalizeSubcategories(req.body.subcategories),
    });

    res.status(201).json({ message: "Category created", category });
  } catch (err) {
    const status = err.code === 11000 ? 409 : 500;
    res.status(status).json({ message: err.code === 11000 ? "Category already exists." : err.message });
  }
});

router.patch("/reorder", requireAdmin, async (req, res) => {
  try {
    const orderedIds = Array.isArray(req.body.orderedIds) ? req.body.orderedIds.map(String).filter(Boolean) : [];
    if (!orderedIds.length) return res.status(400).json({ message: "Category order is required." });

    await Promise.all(
      orderedIds.map((id, index) =>
        Category.findByIdAndUpdate(id, { sortOrder: index + 1 }, { runValidators: true })
      )
    );

    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json({ message: "Category order updated", categories });
  } catch (err) {
    res.status(500).json({ message: err.message || "Category reorder failed." });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Category name is required." });

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name,
        slug: makeSlug(name),
        image: String(req.body.image || "").trim(),
        description: String(req.body.description || "").trim(),
        subcategories: normalizeSubcategories(req.body.subcategories),
      },
      { new: true, runValidators: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found." });
    res.json({ message: "Category updated", category });
  } catch (err) {
    const status = err.code === 11000 ? 409 : 500;
    res.status(status).json({ message: err.code === 11000 ? "Category already exists." : err.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found." });
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
