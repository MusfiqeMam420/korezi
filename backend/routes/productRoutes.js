const express = require("express");
const Product = require("../models/Product");
const slugify = require("slugify");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeProduct(product) {
  const obj = typeof product.toObject === "function" ? product.toObject() : product;
  const regularPrice = Number(obj.regularPrice ?? obj.mrp ?? obj.price ?? 0);
  const legacyPrice = Number(obj.price ?? regularPrice);
  const rawSale = obj.salePrice == null ? legacyPrice : Number(obj.salePrice);
  const salePrice =
    rawSale > 0 && regularPrice > 0 && rawSale < regularPrice ? rawSale : null;

  return {
    ...obj,
    regularPrice,
    salePrice,
    mrp: obj.mrp ?? regularPrice,
    price: salePrice ?? legacyPrice,
  };
}

/**
 * Helper: generate unique slug
 * - "cosrx-snail-96"
 * - "cosrx-snail-96-2"
 */
async function generateUniqueSlug(name, excludeId = null) {
  const base = slugify(String(name || ""), { lower: true, strict: true });
  let slug = base || "product";
  let count = 1;

  const queryForSlug = () => {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    return query;
  };

  while (await Product.findOne(queryForSlug())) {
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
      subCategory,
      thirdCategory,
      brand,

      
      skinType,
      concerns,
      tags,
      images,
      video,
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
      mrp: rp,
      price: sp ?? rp,
      stock: Number(stock || 0),
      category,
      subCategory,
      thirdCategory,
      brand,
      skinType,
      concerns,
      tags,
      images,
      video: String(video || "").trim(),
      description,
    });

    res.status(201).json({ message: "Product created", product: normalizeProduct(product) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const {
      name,
      regularPrice,
      salePrice,
      stock,
      category,
      subCategory,
      thirdCategory,
      brand,
      skinType,
      concerns,
      tags,
      images,
      video,
      description,
    } = req.body;

    if (!name || regularPrice == null) {
      return res.status(400).json({ message: "Name and regular price are required." });
    }

    const rp = Number(regularPrice);
    const sp = salePrice === "" || salePrice == null ? null : Number(salePrice);

    if (Number.isNaN(rp) || rp <= 0) {
      return res.status(400).json({ message: "Invalid regular price" });
    }

    if (sp != null && (Number.isNaN(sp) || sp <= 0 || sp >= rp)) {
      return res.status(400).json({ message: "Sale price must be less than regular price" });
    }

    const cleanName = String(name || "").trim();
    const slug =
      cleanName && cleanName !== existing.name
        ? await generateUniqueSlug(cleanName, existing._id)
        : existing.slug;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: cleanName,
        slug,
        regularPrice: rp,
        salePrice: sp,
        mrp: rp,
        price: sp ?? rp,
        stock: Number(stock || 0),
        category: String(category || "").trim(),
        subCategory: String(subCategory || "").trim(),
        thirdCategory: String(thirdCategory || "").trim(),
        brand: String(brand || "").trim(),
        skinType: Array.isArray(skinType) ? skinType : [],
        concerns: Array.isArray(concerns) ? concerns : [],
        tags: Array.isArray(tags) ? tags : [],
        images: Array.isArray(images) ? images : [],
        video: String(video || "").trim(),
        description: String(description || "").trim(),
      },
      { new: true, runValidators: true }
    );

    res.json({ message: "Product updated", product: normalizeProduct(product) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/video-like", async (req, res) => {
  try {
    const liked = Boolean(req.body?.liked);
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const currentLikes = Math.max(0, Number(product.videoLikes || 0));
    product.videoLikes = liked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
    await product.save();

    res.json({ videoLikes: product.videoLikes });
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

    res.json(similar.map(normalizeProduct));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET /api/products?search=&brand=&category=&skinType=&concern=&tag=&minPrice=&maxPrice=&inStock=&sort=&page=1&limit=12
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      brand = "",
      category = "",
      subCategory = "",
      thirdCategory = "",
      skinType = "",
      concern = "",
      tag = "",
      minPrice = "",
      maxPrice = "",
      inStock = "",
      sort = "newest",
      page = "1",
      limit = "12",
    } = req.query;

    const q = {};

    // search by name OR brand OR category (partial match)
    if (search) {
      const searchText = escapeRegex(search);
      q.$or = [
        { name: { $regex: searchText, $options: "i" } },
        { brand: { $regex: searchText, $options: "i" } },
        { category: { $regex: searchText, $options: "i" } },
        { subCategory: { $regex: searchText, $options: "i" } },
        { thirdCategory: { $regex: searchText, $options: "i" } },
      ];
    }

    if (brand) q.brand = { $regex: `^${escapeRegex(brand)}$`, $options: "i" };
    if (category) q.category = { $regex: `^${escapeRegex(category)}$`, $options: "i" };
    if (subCategory) q.subCategory = { $regex: `^${escapeRegex(subCategory)}$`, $options: "i" };
    if (thirdCategory) q.thirdCategory = { $regex: `^${escapeRegex(thirdCategory)}$`, $options: "i" };

    // skinType is ARRAY in schema: [String]
    if (skinType) q.skinType = { $in: [new RegExp(`^${escapeRegex(skinType)}$`, "i")] };
    if (concern) q.concerns = { $in: [new RegExp(`^${escapeRegex(concern)}$`, "i")] };
    if (tag) q.tags = { $in: [new RegExp(`^${escapeRegex(tag)}$`, "i")] };
    if (inStock === "true") q.stock = { $gt: 0 };

    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);
    if ((min != null && !Number.isNaN(min)) || (max != null && !Number.isNaN(max))) {
      q.price = {};
      if (min != null && !Number.isNaN(min)) q.price.$gte = min;
      if (max != null && !Number.isNaN(max)) q.price.$lte = max;
    }

    const sortMap = {
      newest: { createdAt: -1 },
      priceLow: { price: 1, createdAt: -1 },
      priceHigh: { price: -1, createdAt: -1 },
      name: { name: 1 },
    };
    const sortBy = sortMap[sort] || sortMap.newest;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Product.find(q).sort(sortBy).skip(skip).limit(limitNum),
      Product.countDocuments(q),
    ]);

    res.json({
      items: items.map(normalizeProduct),
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
    res.json(normalizeProduct(product));
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
    res.json(normalizeProduct(product));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
