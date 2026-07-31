module.exports = function orderPlacedEmail(order, userEmail) {
  return {
    to: userEmail,
    subject: `Your order has been approved. Please check again. – Korezi`,
    html: `
      <div style="background:#f5f6f8;padding:30px 0;font-family: "Inter Tight", sans-serif;">
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden">

          <!-- Header -->
          <div style="text-align:center;padding:25px;border-bottom:1px solid #eee">
            <img 
              src="https://korezi.com/kz-icon.png" 
              alt="Korezi" 
              style="height:40px;margin-bottom:10px"
            />
            <h2 style="margin:0;color:#111">Order Confirmed 🎉</h2>
            <p style="margin:6px 0 0;color:#666;font-size:14px">
              Thank you for shopping with Korezi
            </p>
          </div>

          <!-- Body -->
          <div style="padding:25px">

            <p style="color:#333;font-size:15px">
              Hi <strong>${order.customerName}</strong>,<br/><br/>
              Your order has been successfully placed. Below are your order details.
            </p>

            <!-- Order Info -->
            <table width="100%" style="font-size:14px;color:#444;margin:20px 0">
              <tr>
                <td><strong>Order ID:</strong></td>
                <td align="right">#${order._id.toString().slice(-6)}</td>
              </tr>
              <tr>
                <td><strong>Payment Method:</strong></td>
                <td align="right">Cash on Delivery</td>
              </tr>
            </table>

            <!-- Delivery -->
            <div style="background:#fafafa;padding:15px;border-radius:6px;margin-bottom:20px">
              <h3 style="margin:0 0 10px;font-size:16px">Delivery Details</h3>
              <p style="margin:0;font-size:14px;line-height:1.6">
                ${order.customerName}<br/>
                ${order.phone}<br/>
                ${order.address}
              </p>
            </div>

            <!-- Items -->
            <h3 style="font-size:16px;margin-bottom:10px">Items</h3>
            <table width="100%" style="border-collapse:collapse;font-size:14px">
              ${order.items
                .map(
                  (i) => `
                  <tr>
                    <td style="padding:8px 0">${i.name} × ${i.quantity}</td>
                    <td align="right" style="padding:8px 0">৳${i.price * i.quantity}</td>
                  </tr>
                `
                )
                .join("")}
            </table>

            <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>

            <!-- Totals -->
            <table width="100%" style="font-size:14px">
              <tr>
                <td>Subtotal</td>
                <td align="right">৳${order.subtotal}</td>
              </tr>
              <tr>
                <td>Delivery</td>
                <td align="right">৳${order.deliveryCharge}</td>
              </tr>
              <tr>
                <td style="font-weight:bold;padding-top:8px">Total</td>
                <td align="right" style="font-weight:bold;padding-top:8px">
                  ৳${order.total}
                </td>
              </tr>
            </table>

          </div>

          <!-- Footer -->
          <div style="text-align:center;padding:20px;border-top:1px solid #eee;background:#fafafa">
            <p style="margin:0;font-size:13px;color:#666">
              We’ll contact you soon for delivery confirmation.
            </p>
            <p style="margin:8px 0 0;font-size:13px;color:#999">
              ❤️ Korezi — Skin & Care
            </p>
          </div>

        </div>
      </div>
    `,
  };
};
