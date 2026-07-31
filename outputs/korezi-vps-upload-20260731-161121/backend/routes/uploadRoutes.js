const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

const productUploadDir = path.join(__dirname, "..", "uploads", "products");
const coverUploadDir = path.join(__dirname, "..", "uploads", "covers");
const categoryUploadDir = path.join(__dirname, "..", "uploads", "categories");
const brandUploadDir = path.join(__dirname, "..", "uploads", "brands");
const productVideoUploadDir = path.join(__dirname, "..", "uploads", "product-videos");

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

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 8,
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 80 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      return cb(new Error("Only video files are allowed."));
    }
    cb(null, true);
  },
});

router.post("/products", imageUpload.array("images", 8), async (req, res) => {
  try {
    fs.mkdirSync(productUploadDir, { recursive: true });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const urls = [];

    for (const file of req.files || []) {
      const filename = `${Date.now()}-${safeName(file.originalname)}.webp`;
      const outputPath = path.join(productUploadDir, filename);

      await sharp(file.buffer)
        .rotate()
        .resize({
          width: 1400,
          height: 1400,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82, effort: 5 })
        .toFile(outputPath);

      urls.push(`${baseUrl}/uploads/products/${filename}`);
    }

    res.json({ urls });
  } catch (err) {
    res.status(400).json({ message: err.message || "Image upload failed." });
  }
});

router.post("/covers", requireAdmin, imageUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Cover image is required." });

    fs.mkdirSync(coverUploadDir, { recursive: true });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const filename = `${Date.now()}-${safeName(req.file.originalname)}.webp`;
    const outputPath = path.join(coverUploadDir, filename);

    await sharp(req.file.buffer)
      .rotate()
      .resize({
        width: 2200,
        height: 900,
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 84, effort: 5 })
      .toFile(outputPath);

    res.json({ url: `${baseUrl}/uploads/covers/${filename}` });
  } catch (err) {
    res.status(400).json({ message: err.message || "Cover upload failed." });
  }
});

router.post("/categories", requireAdmin, imageUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Category image is required." });

    fs.mkdirSync(categoryUploadDir, { recursive: true });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const filename = `${Date.now()}-${safeName(req.file.originalname)}.webp`;
    const outputPath = path.join(categoryUploadDir, filename);

    await sharp(req.file.buffer)
      .rotate()
      .resize({
        width: 900,
        height: 900,
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 84, effort: 5 })
      .toFile(outputPath);

    res.json({ url: `${baseUrl}/uploads/categories/${filename}` });
  } catch (err) {
    res.status(400).json({ message: err.message || "Category image upload failed." });
  }
});

router.post("/brands", requireAdmin, imageUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Brand icon is required." });

    fs.mkdirSync(brandUploadDir, { recursive: true });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const filename = `${Date.now()}-${safeName(req.file.originalname)}.webp`;
    const outputPath = path.join(brandUploadDir, filename);

    await sharp(req.file.buffer)
      .rotate()
      .resize({
        width: 600,
        height: 600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 84, effort: 5 })
      .toFile(outputPath);

    res.json({ url: `${baseUrl}/uploads/brands/${filename}` });
  } catch (err) {
    res.status(400).json({ message: err.message || "Brand icon upload failed." });
  }
});

router.post("/product-video", requireAdmin, videoUpload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Product video is required." });

    fs.mkdirSync(productVideoUploadDir, { recursive: true });

    const allowedExt = [".mp4", ".webm", ".mov"];
    const sourceExt = path.extname(req.file.originalname).toLowerCase();
    const ext = allowedExt.includes(sourceExt) ? sourceExt : ".mp4";
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const filename = `${Date.now()}-${safeName(req.file.originalname)}${ext}`;
    const outputPath = path.join(productVideoUploadDir, filename);

    fs.writeFileSync(outputPath, req.file.buffer);

    res.json({ url: `${baseUrl}/uploads/product-videos/${filename}` });
  } catch (err) {
    res.status(400).json({ message: err.message || "Product video upload failed." });
  }
});

module.exports = router;
