const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // keep this
    passwordHash: { type: String, required: true },

    // ✅ add this
   role: { type: String, enum: ["user", "admin", "moderator"], default: "user" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
