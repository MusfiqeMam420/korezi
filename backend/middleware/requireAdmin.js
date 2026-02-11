const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/admin/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // ✅ allow only admin (and moderator if you use it)
    if (!["admin", "moderator"].includes(user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // ✅ FIX: compare with passwordHash
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);

    res.cookie("korezi_admin", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/", // ✅ important
    });

    res.json({
      message: "Logged in",
      admin: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/me
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.korezi_admin;
    if (!token) return res.status(401).json({ message: "No session" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!["admin", "moderator"].includes(payload.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json({ admin: payload });
  } catch (err) {
    res.status(401).json({ message: "Invalid session" });
  }
});

// POST /api/admin/logout
router.post("/logout", (req, res) => {
  res.clearCookie("korezi_admin", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/", // ✅ important
  });
  res.json({ message: "Logged out" });
});

module.exports = router;
