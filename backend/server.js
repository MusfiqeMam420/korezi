// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const adminAuthRoutes = require("./routes/adminAuth");

require("./config/db");

const app = express();

// ✅ CORS (ONLY ONCE)
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

// ✅ Parsers (ONLY ONCE)
app.use(express.json());
app.use(cookieParser());

// ✅ Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Routes
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/uploads", require("./routes/uploadRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));

// ✅ Health check
app.get("/", (req, res) => res.send("Korezi API running"));


app.use("/api/admin", adminAuthRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
