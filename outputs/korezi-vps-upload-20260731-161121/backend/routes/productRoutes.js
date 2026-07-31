const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const Product = require("../models/Product");
const Category = require("../models/Category");
const slugify = require("slugify");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();
const productUploadDir = path.join(__dirname, "..", "uploads", "products");

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

function safeName(originalName) {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  return (
    base
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9\-_.]/g, "")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)/g, "") || "product"
  );
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((item) => String(item).trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((item) => String(item).trim() !== "")) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((cells, index) => {
    const record = { __rowNumber: index + 2 };
    headers.forEach((header, headerIndex) => {
      if (header) record[header] = String(cells[headerIndex] || "").trim();
    });
    return record;
  });
}

function getCell(row, aliases) {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];
    if (value != null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function toNumber(value, fallback = 0) {
  if (value == null || value === "") return fallback;
  const clean = String(value).replace(/[^0-9.-]/g, "");
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function splitList(value) {
  return String(value || "")
    .split(/[\n,;|]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function addLookupItem(map, key, value) {
  const cleanKey = normalizeName(key);
  if (!cleanKey) return;
  if (!map.has(cleanKey)) map.set(cleanKey, []);
  map.get(cleanKey).push(value);
}

function buildCategoryLookup(categories) {
  const lookup = {
    main: new Map(),
    sub: new Map(),
    third: new Map(),
  };

  for (const category of categories) {
    const mainName = String(category.name || "").trim();
    addLookupItem(lookup.main, mainName, { category: mainName });

    for (const sub of category.subcategories || []) {
      const subName = String(sub.name || "").trim();
      addLookupItem(lookup.sub, subName, { category: mainName, subCategory: subName });

      for (const child of sub.children || []) {
        const thirdName = String(child.name || "").trim();
        addLookupItem(lookup.third, thirdName, {
          category: mainName,
          subCategory: subName,
          thirdCategory: thirdName,
        });
      }
    }
  }

  return lookup;
}

function firstLookupMatch(map, value, warnings, rowNumber, field) {
  const matches = map.get(normalizeName(value)) || [];
  if (matches.length > 1) {
    warnings.push({
      row: rowNumber,
      field,
      message: `"${value}" matched multiple categories. Used the first match.`,
    });
  }
  return matches[0] || null;
}

function resolveProductCategory(product, lookup, warnings, rowNumber) {
  const mainInput = String(product.category || "").trim();
  const subInput = String(product.subCategory || "").trim();
  const thirdInput = String(product.thirdCategory || "").trim();

  const mainAsMain = firstLookupMatch(lookup.main, mainInput, warnings, rowNumber, "category");
  const mainAsSub = firstLookupMatch(lookup.sub, mainInput, warnings, rowNumber, "category");
  const mainAsThird = firstLookupMatch(lookup.third, mainInput, warnings, rowNumber, "category");
  const subAsSub = firstLookupMatch(lookup.sub, subInput, warnings, rowNumber, "subCategory");
  const subAsThird = firstLookupMatch(lookup.third, subInput, warnings, rowNumber, "subCategory");
  const thirdAsThird = firstLookupMatch(lookup.third, thirdInput, warnings, rowNumber, "thirdCategory");

  if (mainAsMain) {
    product.category = mainAsMain.category;
    if (subInput) product.subCategory = subAsSub?.subCategory || subInput;
    if (thirdInput) product.thirdCategory = thirdAsThird?.thirdCategory || thirdInput;

    if (!subInput && thirdAsThird && normalizeName(thirdAsThird.category) === normalizeName(product.category)) {
      product.subCategory = thirdAsThird.subCategory;
      product.thirdCategory = thirdAsThird.thirdCategory;
    }
    return product;
  }

  if (mainAsSub) {
    product.category = mainAsSub.category;
    product.subCategory = mainAsSub.subCategory;
    if (subAsThird && normalizeName(subAsThird.subCategory) === normalizeName(mainAsSub.subCategory)) {
      product.thirdCategory = subAsThird.thirdCategory;
    } else if (thirdAsThird && normalizeName(thirdAsThird.subCategory) === normalizeName(mainAsSub.subCategory)) {
      product.thirdCategory = thirdAsThird.thirdCategory;
    } else {
      product.thirdCategory = thirdInput || "";
    }
    return product;
  }

  if (mainAsThird) {
    product.category = mainAsThird.category;
    product.subCategory = mainAsThird.subCategory;
    product.thirdCategory = mainAsThird.thirdCategory;
    return product;
  }

  if (!mainInput && subAsSub) {
    product.category = subAsSub.category;
    product.subCategory = subAsSub.subCategory;
    if (thirdAsThird && normalizeName(thirdAsThird.subCategory) === normalizeName(subAsSub.subCategory)) {
      product.thirdCategory = thirdAsThird.thirdCategory;
    }
    return product;
  }

  if (!mainInput && subAsThird) {
    product.category = subAsThird.category;
    product.subCategory = subAsThird.subCategory;
    product.thirdCategory = subAsThird.thirdCategory;
    return product;
  }

  if (!mainInput && !subInput && thirdAsThird) {
    product.category = thirdAsThird.category;
    product.subCategory = thirdAsThird.subCategory;
    product.thirdCategory = thirdAsThird.thirdCategory;
  }

  if (mainInput && !mainAsMain && !mainAsSub && !mainAsThird) {
    warnings.push({
      row: rowNumber,
      field: "category",
      message: `"${mainInput}" was not found in the category database. Kept the sheet value.`,
    });
  }

  return product;
}

function getImageUrls(row) {
  const values = [];
  for (const [key, value] of Object.entries(row)) {
    if (
      value &&
      (key === "image" ||
        key === "images" ||
        key === "photo" ||
        key === "photos" ||
        key === "imageurl" ||
        key === "imageurls" ||
        /^image[0-9]+$/.test(key) ||
        /^photo[0-9]+$/.test(key))
    ) {
      values.push(...splitList(value));
    }
  }
  return [...new Set(values)];
}

function googleSheetCsvUrl(input) {
  const value = String(input || "").trim();
  if (!value) return "";
  if (/(\?|&)output=csv\b/i.test(value) || /(\?|&)format=csv\b/i.test(value) || /\.csv(\?|$)/i.test(value)) {
    return value;
  }

  const sheetMatch = value.match(/docs\.google\.com\/spreadsheets\/d\/([^/]+)/i);
  if (!sheetMatch) return value;

  const gidMatch = value.match(/[?&#]gid=([0-9]+)/i);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=csv&gid=${gid}`;
}

function googleDriveDownloadUrl(input) {
  const value = String(input || "").trim();
  const fileMatch = value.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  const idMatch = value.match(/[?&]id=([^&]+)/i);
  const id = fileMatch?.[1] || idMatch?.[1];
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : value;
}

function buildProductFromRow(row) {
  const name = getCell(row, ["product", "product name", "name", "title"]);
  const regularPrice = toNumber(getCell(row, ["mrp", "regular price", "regular", "old price"]));
  const rawSale = toNumber(getCell(row, ["price", "sale price", "selling price", "offer price"]), 0);
  const salePrice = rawSale > 0 && regularPrice > 0 && rawSale < regularPrice ? rawSale : null;

  return {
    name,
    regularPrice,
    salePrice,
    mrp: regularPrice,
    price: salePrice ?? (rawSale > 0 ? rawSale : regularPrice),
    stock: toNumber(getCell(row, ["stock", "quantity", "qty"]), 0),
    brand: getCell(row, ["brand"]),
    category: getCell(row, ["category", "main category"]),
    subCategory: getCell(row, ["subcategory", "sub category", "2nd category", "second category", "type"]),
    thirdCategory: getCell(row, ["third category", "3rd category", "child category"]),
    skinType: splitList(getCell(row, ["skin", "skin type", "skintype"])),
    concerns: splitList(getCell(row, ["concerns", "concern"])),
    tags: splitList(getCell(row, ["tags", "tag"])),
    video: getCell(row, ["video", "video url", "product video"]),
    description: getCell(row, ["des", "description", "details"]),
    images: getImageUrls(row),
  };
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Sheet download failed (${response.status})`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function downloadImageToWebp(url, productName, rowNumber, imageIndex, req) {
  const source = googleDriveDownloadUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(source, {
      signal: controller.signal,
      headers: { "user-agent": "KoreziBulkImporter/1.0" },
    });
    if (!response.ok) throw new Error(`image responded ${response.status}`);

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      throw new Error("URL did not return an image");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.mkdirSync(productUploadDir, { recursive: true });

    const filename = `${Date.now()}-${rowNumber}-${imageIndex}-${safeName(productName)}.webp`;
    const outputPath = path.join(productUploadDir, filename);

    await sharp(buffer)
      .rotate()
      .resize({
        width: 1400,
        height: 1400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 5 })
      .toFile(outputPath);

    return `${req.protocol}://${req.get("host")}/uploads/products/${filename}`;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveBulkImages(product, req, rowNumber, importImages, warnings) {
  if (!importImages) return product.images;

  const saved = [];
  for (let index = 0; index < product.images.length; index += 1) {
    const url = product.images[index];
    try {
      saved.push(await downloadImageToWebp(url, product.name, rowNumber, index + 1, req));
    } catch (err) {
      warnings.push({
        row: rowNumber,
        field: "images",
        message: `Image skipped: ${url} (${err.message})`,
      });
    }
  }

  return saved;
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

router.post("/bulk-import", requireAdmin, async (req, res) => {
  try {
    const {
      sheetUrl,
      csvText,
      importImages = true,
      dryRun = false,
      mode = "upsert",
    } = req.body || {};

    const sourceCsv = csvText && String(csvText).trim()
      ? String(csvText)
      : await fetchText(googleSheetCsvUrl(sheetUrl));

    const rows = parseCsv(sourceCsv);
    const errors = [];
    const warnings = [];

    if (!rows.length) {
      return res.status(400).json({ message: "No product rows found in the sheet." });
    }

    const categoryLookup = buildCategoryLookup(await Category.find().lean());

    const parsed = rows.map((row) => {
      const product = resolveProductCategory(
        buildProductFromRow(row),
        categoryLookup,
        warnings,
        row.__rowNumber
      );
      const rowErrors = [];

      if (!product.name) rowErrors.push("Product name is required.");
      if (!product.regularPrice || product.regularPrice <= 0) rowErrors.push("MRP / regular price is required.");
      if (product.salePrice != null && product.salePrice >= product.regularPrice) {
        rowErrors.push("Sale price must be less than MRP.");
      }

      return {
        rowNumber: row.__rowNumber,
        product,
        rowErrors,
      };
    });

    parsed.forEach((item) => {
      item.rowErrors.forEach((message) => errors.push({ row: item.rowNumber, message }));
    });

    const valid = parsed.filter((item) => item.rowErrors.length === 0);

    if (dryRun) {
      return res.json({
        totalRows: rows.length,
        validRows: valid.length,
        invalidRows: parsed.length - valid.length,
        errors,
        warnings,
        preview: valid.slice(0, 10).map((item) => ({
          row: item.rowNumber,
          name: item.product.name,
          brand: item.product.brand,
          category: item.product.category,
          subCategory: item.product.subCategory,
          thirdCategory: item.product.thirdCategory,
          regularPrice: item.product.regularPrice,
          salePrice: item.product.salePrice,
          stock: item.product.stock,
          images: item.product.images.length,
        })),
      });
    }

    const summary = {
      totalRows: rows.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors,
      warnings,
    };

    for (const item of valid) {
      try {
        const cleanName = item.product.name.trim();
        const baseSlug = slugify(cleanName, { lower: true, strict: true }) || "product";
        const existing = await Product.findOne({
          $or: [
            { slug: baseSlug },
            { name: new RegExp(`^${escapeRegex(cleanName)}$`, "i") },
          ],
        });

        if (existing && mode !== "upsert") {
          summary.skipped += 1;
          warnings.push({
            row: item.rowNumber,
            message: `Skipped duplicate product: ${cleanName}`,
          });
          continue;
        }

        const images = await resolveBulkImages(
          item.product,
          req,
          item.rowNumber,
          Boolean(importImages),
          warnings
        );

        const payload = {
          ...item.product,
          name: cleanName,
          brand: String(item.product.brand || "").trim(),
          category: String(item.product.category || "").trim(),
          subCategory: String(item.product.subCategory || "").trim(),
          thirdCategory: String(item.product.thirdCategory || "").trim(),
          images,
          video: String(item.product.video || "").trim(),
          description: String(item.product.description || "").trim(),
        };

        if (existing) {
          await Product.findByIdAndUpdate(existing._id, payload, {
            new: true,
            runValidators: true,
          });
          summary.updated += 1;
        } else {
          const slug = await generateUniqueSlug(cleanName);
          await Product.create({ ...payload, slug });
          summary.created += 1;
        }
      } catch (err) {
        summary.failed += 1;
        errors.push({
          row: item.rowNumber,
          message: err.message || "Import failed.",
        });
      }
    }

    return res.json({ message: "Bulk import complete", ...summary });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Bulk import failed." });
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
        { skinType: { $regex: searchText, $options: "i" } },
        { concerns: { $regex: searchText, $options: "i" } },
        { tags: { $regex: searchText, $options: "i" } },
        { description: { $regex: searchText, $options: "i" } },
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
