const express = require("express");
const path = require("path");
const multer = require("multer");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/products"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safe = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\-_.]/g, "");
    cb(null, `${Date.now()}-${safe}${ext}`);
  },
});

const upload = multer({ storage });

router.post("/products", upload.array("images", 8), (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const urls = (req.files || []).map((f) => `${baseUrl}/uploads/products/${f.filename}`);
  res.json({ urls });
});

module.exports = router;
