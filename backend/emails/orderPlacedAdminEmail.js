module.exports = function orderPlacedAdminEmail(order) {
  return {
    to: process.env.ADMIN_NOTIFY_EMAIL,
    subject: `🛒 New Order – Korezi (#${order._id.toString().slice(-6)})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2>New Order Received 🚀</h2>

        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Total:</strong> ৳${order.total}</p>

        <hr/>

        <h3>Customer</h3>
        <p>
          ${order.customerName}<br/>
          ${order.phone}<br/>
          ${order.address}
        </p>

        <h3>Items</h3>
        <ul>
          ${order.items
            .map(
              (i) =>
                `<li>${i.name} × ${i.quantity} — ৳${i.price * i.quantity}</li>`
            )
            .join("")}
        </ul>

        <hr/>

        <p><strong>Payment:</strong> Cash on Delivery</p>
        <p><strong>Delivery Charge:</strong> ৳${order.deliveryCharge}</p>
        <p><strong>Grand Total:</strong> ৳${order.total}</p>

        <hr/>

        <p>⚡ Check admin panel for order processing.</p>
      </div>
    `,
  };
};
