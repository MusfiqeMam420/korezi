const express = require("express");
const Cover = require("../models/Cover");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const query = req.query.all === "true" ? {} : { isActive: true };
    const covers = await Cover.find(query).sort({ sortOrder: 1, createdAt: -1 });
    res.json(covers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const image = String(req.body.image || "").trim();
    if (!image) return res.status(400).json({ message: "Cover image is required." });

    const cover = await Cover.create({
      title: String(req.body.title || "").trim(),
      subtitle: String(req.body.subtitle || "").trim(),
      image,
      href: String(req.body.href || "/shop").trim(),
      isActive: req.body.isActive !== false,
      sortOrder: Number(req.body.sortOrder || 0),
    });

    res.status(201).json({ message: "Cover created", cover });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const cover = await Cover.findByIdAndUpdate(
      req.params.id,
      {
        title: String(req.body.title || "").trim(),
        subtitle: String(req.body.subtitle || "").trim(),
        image: String(req.body.image || "").trim(),
        href: String(req.body.href || "/shop").trim(),
        isActive: req.body.isActive !== false,
        sortOrder: Number(req.body.sortOrder || 0),
      },
      { new: true, runValidators: true }
    );

    if (!cover) return res.status(404).json({ message: "Cover not found." });
    res.json({ message: "Cover updated", cover });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const cover = await Cover.findByIdAndDelete(req.params.id);
    if (!cover) return res.status(404).json({ message: "Cover not found." });
    res.json({ message: "Cover deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
