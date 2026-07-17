const mongoose = require("mongoose");

const coverSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", trim: true },
    subtitle: { type: String, default: "", trim: true },
    image: { type: String, required: true, trim: true },
    href: { type: String, default: "/shop", trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cover", coverSchema);
