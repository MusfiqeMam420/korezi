const jwt = require("jsonwebtoken");

module.exports = function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.korezi_admin;
    if (!token) return res.status(401).json({ message: "No admin session" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!["admin", "moderator"].includes(payload.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid admin session" });
  }
};
