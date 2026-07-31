const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    children: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          slug: { type: String, required: true, trim: true },
        },
      ],
      default: [],
    },
  },
  { _id: true }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    image: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    sortOrder: { type: Number, default: 0, index: true },
    subcategories: { type: [subcategorySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
