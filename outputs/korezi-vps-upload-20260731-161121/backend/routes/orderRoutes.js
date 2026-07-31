const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const transporter = require("../utils/mailer");
const orderPlacedEmail = require("../emails/orderPlacedEmail");

const router = express.Router();

async function sendOrderEmailsInBackground(order, customerEmail) {
  try {
    const from = `"Korezi" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`;
    const adminEmail = (process.env.MAIL_ADMIN || "").trim();

    if (customerEmail) {
      const emailData = orderPlacedEmail(order, customerEmail);
      await transporter.sendMail({
        from,
        ...emailData,
      });
    }

    if (adminEmail) {
      const adminData = orderPlacedEmail(order, adminEmail);
      await transporter.sendMail({
        from,
        to: adminEmail,
        subject: `New Order Received - Korezi (#${order._id.toString().slice(-6)})`,
        html: adminData.html,
      });
    }
  } catch (err) {
    console.error("Background order email failed:", err.message);
  }
}

// POST: create order
router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      email,
      phone,
      address,
      paymentMethod,
      deliveryZone,
      deliveryCharge,
      subtotal,
      total,
      items,
    } = req.body;

    if (!customerName || !phone || !address) {
      return res.status(400).json({ message: "Name, phone, address are required." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart items are required." });
    }

    for (const it of items) {
      const product = await Product.findById(it.productId);
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${it.productId}` });
      }

      if (product.stock < it.quantity) {
        return res.status(400).json({
          message: `${product.name} is out of stock (available: ${product.stock})`,
        });
      }
    }

    for (const it of items) {
      await Product.findByIdAndUpdate(it.productId, {
        $inc: { stock: -it.quantity },
      });
    }

    let userId = null;
    let userEmail = null;

    try {
      const token = req.cookies?.korezi_token;
      if (token) {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        userId = payload.userId;
        userEmail = payload.email;
      }
    } catch {}

    const finalEmail = (userEmail || email || "").trim();

    const order = await Order.create({
      userId,
      customerName: customerName.trim(),
      email: finalEmail,
      phone: phone.trim(),
      address: address.trim(),
      paymentMethod: paymentMethod || "COD",
      deliveryZone: deliveryZone || "dhaka",
      deliveryCharge: Number(deliveryCharge || 0),
      subtotal: Number(subtotal || 0),
      total: Number(total || 0),
      items,
      status: "pending",
    });

    setImmediate(() => sendOrderEmailsInBackground(order, finalEmail));

    return res.status(201).json({ message: "Order created", orderId: order._id });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/my (logged-in user's orders)
router.get("/my", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/status (ADMIN - update status)
router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = ["pending", "processing", "confirmed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Status updated", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders (admin list)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
