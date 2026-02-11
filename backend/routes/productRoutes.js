const express = require("express");
const Product = require("../models/Product");
const slugify = require("slugify");

const router = express.Router();

/**
 * Helper: generate unique slug
 * - "cosrx-snail-96"
 * - "cosrx-snail-96-2"
 */
async function generateUniqueSlug(name) {
  const base = slugify(String(name || ""), { lower: true, strict: true });
  let slug = base || "product";
  let count = 1;

  while (await Product.findOne({ slug })) {
    count += 1;
    slug = `${base}-${count}`;
  }

  return slug;
}

/**
 * POST /api/products
 * Create product (admin later)
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      regularPrice,
      salePrice,
      stock,
      category,
      brand,

      
      skinType,
      concerns,
      tags,
      images,
      description,
    } = req.body;

    if (!name || regularPrice == null) {
      return res.status(400).json({
        message: "Name and regular price are required.",
      });
    }

    const rp = Number(regularPrice);
    const sp =
      salePrice === "" || salePrice == null ? null : Number(salePrice);

    if (Number.isNaN(rp) || rp <= 0) {
      return res.status(400).json({ message: "Invalid regular price" });
    }

    if (sp != null && (Number.isNaN(sp) || sp <= 0 || sp >= rp)) {
      return res.status(400).json({
        message: "Sale price must be less than regular price",
      });
    }

    const slug = await generateUniqueSlug(name);

    const product = await Product.create({
      name,
      slug,
      regularPrice: rp,
      salePrice: sp,
      stock: Number(stock || 0),
      category,
      brand,
      skinType,
      concerns,
      tags,
      images,
      description,
    });

    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/**
 * GET /api/products/similar/:slug
 * Similar by category (case-insensitive) fallback to tags/concerns
 */
// GET /api/products/similar/:slug
router.get("/similar/:slug", async (req, res) => {
  try {
    const current = await Product.findOne({ slug: req.params.slug });
    if (!current) return res.status(404).json({ message: "Product not found" });

    const limit = 8;
    const cat = String(current.category || "").trim();

    // 1) Same category (case-insensitive)
    let similar = [];
    if (cat) {
      similar = await Product.find({
        _id: { $ne: current._id },
        category: { $regex: new RegExp(`^${cat}$`, "i") },
      })
        .limit(limit)
        .sort({ createdAt: -1 });
    }

    // 2) Fallback: match tags/concerns
    if (similar.length === 0) {
      const tags = Array.isArray(current.tags) ? current.tags : [];
      const concerns = Array.isArray(current.concerns) ? current.concerns : [];

      if (tags.length || concerns.length) {
        similar = await Product.find({
          _id: { $ne: current._id },
          $or: [{ tags: { $in: tags } }, { concerns: { $in: concerns } }],
        })
          .limit(limit)
          .sort({ createdAt: -1 });
      }
    }

    // 3) Final fallback: show newest products (excluding current)
    if (similar.length === 0) {
      similar = await Product.find({ _id: { $ne: current._id } })
        .limit(limit)
        .sort({ createdAt: -1 });
    }

    res.json(similar);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET /api/products?search=&brand=&category=&skinType=&page=1&limit=12
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      brand = "",
      category = "",
      skinType = "",
      page = "1",
      limit = "12",
    } = req.query;

    const q = {};

    // search by name OR brand OR category (partial match)
    if (search) {
      q.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    if (brand) q.brand = { $regex: `^${brand}$`, $options: "i" };
    if (category) q.category = { $regex: `^${category}$`, $options: "i" };

    // skinType is ARRAY in schema: [String]
    if (skinType) q.skinType = { $in: [new RegExp(`^${skinType}$`, "i")] };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Product.find(q).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Product.countDocuments(q),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



/**
 * GET /api/products/slug/:slug
 * Get product by slug (SEO URL)
 */
router.get("/slug/:slug", async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/products/:id
 * Get product by Mongo ID (keep for admin/edit pages)
 * IMPORTANT: keep this LAST to avoid route conflicts
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
