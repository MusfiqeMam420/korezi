require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "korezi.control@gmail.com";
  const user = await User.findOne({ email });

  if (!user) {
    console.log("❌ User not found:", email);
    process.exit(1);
  }

  user.role = "admin";
  await user.save();

  console.log("✅ Updated to admin:", user.email);
  process.exit(0);
})();
