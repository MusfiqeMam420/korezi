const express = require("express");
const slugify = require("slugify");
const Brand = require("../models/Brand");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

function makeSlug(value) {
  return slugify(String(value || ""), { lower: true, strict: true }) || "brand";
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
