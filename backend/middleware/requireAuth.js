const jwt = require("jsonwebtoken");

module.exports = function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.korezi_token;
    if (!token) return res.status(401).json({ message: "Not logged in" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, email, name }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid session" });
  }
};
