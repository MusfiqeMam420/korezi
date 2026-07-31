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

function mergeSubcategory(target, subName, thirdName) {
  const cleanSub = String(subName || "").trim();
  const cleanThird = String(thirdName || "").trim();
  if (!cleanSub) return;

  const subSlug = makeSlug(cleanSub);
  let sub = target.subcategories.find((item) => item.slug === subSlug);
  if (!sub) {
    sub = { name: cleanSub, slug: subSlug, children: [] };
    target.subcategories.push(sub);
  }

  if (!cleanThird) return;
  const thirdSlug = makeSlug(cleanThird);
  if (!sub.children.some((child) => child.slug === thirdSlug)) {
    sub.children.push({ name: cleanThird, slug: thirdSlug });
  }
}

function buildBulkCategories(rows) {
  const categoryMap = new Map();
  const errors = [];

  for (const row of rows) {
    const mainName = getCell(row, ["Main Category", "Category", "Root Category"]);
    const subName = getCell(row, ["Sub Category", "Subcategory", "2nd Category", "Second Category"]);
    const thirdName = getCell(row, ["3rd Category", "Third Category", "Child Category"]);
    const image = getCell(row, ["Image", "Image URL", "Category Image"]);
    const description = getCell(row, ["Description", "Desc"]);
    const sortOrder = Number(getCell(row, ["Sort Order", "Order", "Position"]));

    if (!mainName) {
      errors.push({ row: row.__rowNumber, message: "Main Category is required." });
      continue;
    }

    const slug = makeSlug(mainName);
    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, {
        name: mainName.trim(),
        slug,
        image: "",
        description: "",
        sortOrder: null,
        subcategories: [],
        rows: [],
      });
    }

    const category = categoryMap.get(slug);
    category.rows.push(row.__rowNumber);
    if (image && !category.image) category.image = image;
    if (description && !category.description) category.description = description;
    if (Number.isFinite(sortOrder) && sortOrder > 0 && category.sortOrder == null) category.sortOrder = sortOrder;
    mergeSubcategory(category, subName, thirdName);
  }

  return { categories: [...categoryMap.values()], errors };
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

router.post("/bulk-import", requireAdmin, async (req, res) => {
  try {
    const { sheetUrl, csvText, dryRun = false, mode = "upsert" } = req.body || {};
    const sourceCsv = csvText && String(csvText).trim()
      ? String(csvText)
      : await fetchText(googleSheetCsvUrl(sheetUrl));

    const rows = parseCsv(sourceCsv);
    if (!rows.length) return res.status(400).json({ message: "No category rows found in the sheet." });

    const { categories: parsedCategories, errors } = buildBulkCategories(rows);
    if (dryRun) {
      return res.json({
        totalRows: rows.length,
        categories: parsedCategories.length,
        subcategories: parsedCategories.reduce((sum, category) => sum + category.subcategories.length, 0),
        thirdCategories: parsedCategories.reduce(
          (sum, category) => sum + category.subcategories.reduce((childSum, sub) => childSum + sub.children.length, 0),
          0
        ),
        errors,
        preview: parsedCategories.slice(0, 10).map((category) => ({
          name: category.name,
          rows: category.rows,
          image: category.image,
          description: category.description,
          sortOrder: category.sortOrder,
          subcategories: category.subcategories.map((sub) => ({
            name: sub.name,
            children: sub.children.map((child) => child.name),
          })),
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
    };

    const lastCategory = await Category.findOne().sort({ sortOrder: -1, createdAt: -1 }).select("sortOrder");
    let fallbackSortOrder = Number(lastCategory?.sortOrder || 0) + 1;

    for (const parsed of parsedCategories) {
      try {
        const existing = await Category.findOne({
          $or: [
            { slug: parsed.slug },
            { name: new RegExp(`^${parsed.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
          ],
        });

        if (existing && mode !== "upsert") {
          summary.skipped += 1;
          continue;
        }

        if (existing) {
          const mergedSubcategories = normalizeSubcategories([
            ...(existing.subcategories || []).map((sub) => ({
              name: sub.name,
              children: (sub.children || []).map((child) => ({ name: child.name })),
            })),
            ...parsed.subcategories,
          ]);

          await Category.findByIdAndUpdate(
            existing._id,
            {
              name: parsed.name,
              slug: parsed.slug,
              image: parsed.image || existing.image || "",
              description: parsed.description || existing.description || "",
              sortOrder: parsed.sortOrder ?? existing.sortOrder ?? fallbackSortOrder++,
              subcategories: mergedSubcategories,
            },
            { new: true, runValidators: true }
          );
          summary.updated += 1;
        } else {
          await Category.create({
            name: parsed.name,
            slug: parsed.slug,
            image: parsed.image || "",
            description: parsed.description || "",
            sortOrder: parsed.sortOrder ?? fallbackSortOrder++,
            subcategories: normalizeSubcategories(parsed.subcategories),
          });
          summary.created += 1;
        }
      } catch (err) {
        summary.failed += 1;
        summary.errors.push({ rows: parsed.rows, message: err.message || "Category import failed." });
      }
    }

    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    return res.json({ message: "Category import complete", ...summary, categories });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Category bulk import failed." });
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
