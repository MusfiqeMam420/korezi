const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },

    brand: { type: String },

    regularPrice: { type: Number, required: true },
    salePrice: { type: Number, default: null },

    // Legacy aliases kept for older documents and admin views.
    mrp: { type: Number },
    price: { type: Number },

    stock: { type: Number, default: 0 },
    category: { type: String },
    subCategory: { type: String },
    thirdCategory: { type: String },

    skinType: [String],
    concerns: [String],
    tags: [String],

    images: [String],
    video: { type: String, default: "" },
    videoLikes: { type: Number, default: 0, min: 0 },
    description: { type: String },
  },
  { timestamps: true }
);

productSchema.pre("validate", function normalizePrices() {
  if (this.regularPrice == null && this.mrp != null) {
    this.regularPrice = this.mrp;
  }

  if (this.mrp == null && this.regularPrice != null) {
    this.mrp = this.regularPrice;
  }

  if (this.price == null && this.regularPrice != null) {
    this.price = this.salePrice != null ? this.salePrice : this.regularPrice;
  }
});

productSchema.index({ name: "text", brand: "text", category: "text", subCategory: "text", thirdCategory: "text" });
productSchema.index({ brand: 1 });
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ thirdCategory: 1 });
productSchema.index({ skinType: 1 });

module.exports = mongoose.model("Product", productSchema);
