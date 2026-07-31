const express = require("express");
const slugify = require("slugify");
const Brand = require("../models/Brand");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

function makeSlug(value) {
  return slugify(String(value || ""), { lower: true, strict: true }) || "brand";
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

function buildBrandRows(rows) {
  const map = new Map();
  const errors = [];

  for (const row of rows) {
    const name = getCell(row, ["Brand", "Brand Name", "Name"]);
    const logo = getCell(row, ["Logo", "Logo URL", "Image", "Icon", "Brand Icon"]);
    const description = getCell(row, ["Description", "Desc", "Note"]);

    if (!name) {
      errors.push({ row: row.__rowNumber, message: "Brand name is required." });
      continue;
    }

    const slug = makeSlug(name);
    if (!map.has(slug)) {
      map.set(slug, {
        name: name.trim(),
        slug,
        logo: logo.trim(),
        description: description.trim(),
        rows: [row.__rowNumber],
      });
    } else {
      const brand = map.get(slug);
      brand.rows.push(row.__rowNumber);
      if (logo && !brand.logo) brand.logo = logo.trim();
      if (description && !brand.description) brand.description = description.trim();
    }
  }

  return { brands: [...map.values()], errors };
}

router.get("/", async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    res.json(brands);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Brand name is required." });

    const brand = await Brand.create({
      name,
      slug: makeSlug(name),
      description: String(req.body.description || "").trim(),
      logo: String(req.body.logo || "").trim(),
    });

    res.status(201).json({ message: "Brand created", brand });
  } catch (err) {
    const status = err.code === 11000 ? 409 : 500;
    res.status(status).json({ message: err.code === 11000 ? "Brand already exists." : err.message });
  }
});

router.post("/bulk-import", requireAdmin, async (req, res) => {
  try {
    const { sheetUrl, csvText, dryRun = false, mode = "upsert" } = req.body || {};
    const sourceCsv = csvText && String(csvText).trim()
      ? String(csvText)
      : await fetchText(googleSheetCsvUrl(sheetUrl));

    const rows = parseCsv(sourceCsv);
    if (!rows.length) return res.status(400).json({ message: "No brand rows found in the sheet." });

    const { brands, errors } = buildBrandRows(rows);

    if (dryRun) {
      return res.json({
        totalRows: rows.length,
        brands: brands.length,
        errors,
        preview: brands.slice(0, 20).map((brand) => ({
          name: brand.name,
          logo: brand.logo,
          description: brand.description,
          rows: brand.rows,
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

    for (const parsed of brands) {
      try {
        const existing = await Brand.findOne({
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
          await Brand.findByIdAndUpdate(
            existing._id,
            {
              name: parsed.name,
              slug: parsed.slug,
              logo: parsed.logo || existing.logo || "",
              description: parsed.description || existing.description || "",
            },
            { new: true, runValidators: true }
          );
          summary.updated += 1;
        } else {
          await Brand.create({
            name: parsed.name,
            slug: parsed.slug,
            logo: parsed.logo || "",
            description: parsed.description || "",
          });
          summary.created += 1;
        }
      } catch (err) {
        summary.failed += 1;
        summary.errors.push({ rows: parsed.rows, message: err.message || "Brand import failed." });
      }
    }

    const allBrands = await Brand.find().sort({ name: 1 });
    return res.json({ message: "Brand import complete", ...summary, brands: allBrands });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Brand bulk import failed." });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Brand name is required." });

    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      {
        name,
        slug: makeSlug(name),
        description: String(req.body.description || "").trim(),
        logo: String(req.body.logo || "").trim(),
      },
      { new: true, runValidators: true }
    );

    if (!brand) return res.status(404).json({ message: "Brand not found." });
    res.json({ message: "Brand updated", brand });
  } catch (err) {
    const status = err.code === 11000 ? 409 : 500;
    res.status(status).json({ message: err.code === 11000 ? "Brand already exists." : err.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) return res.status(404).json({ message: "Brand not found." });
    res.json({ message: "Brand deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
