const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, default: "", trim: true },
    logo: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Brand", brandSchema);
