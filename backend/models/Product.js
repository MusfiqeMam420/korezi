const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },

    brand: { type: String },
    
     mrp: { type: Number, required: true },          // ✅ Regular / MRP
    price: { type: Number, required: true },

    stock: { type: Number, default: 0 },

    category: { type: String },
    

    // ✅ arrays (matches frontend)
    skinType: [String],
    concerns: [String],
    tags: [String],

    images: [String],
    description: { type: String },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", brand: "text", category: "text" });
productSchema.index({ brand: 1 });
productSchema.index({ category: 1 });
productSchema.index({ skinType: 1 });

module.exports = mongoose.model("Product", productSchema);
