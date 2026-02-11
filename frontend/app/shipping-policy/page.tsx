"use client";

import Link from "next/link";

export default function ShippingPolicyPage() {
  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Shipping Policy
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Intro */}
        <section className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            At <b>Korezi</b>, we aim to deliver authentic Korean skincare
            products safely and quickly. This Shipping Policy explains delivery
            areas, delivery times, charges, and important shipping conditions.
          </p>
        </section>

        <Section title="1. Delivery Areas">
          <ul className="list-disc pl-6 space-y-2">
            <li>We deliver across Bangladesh.</li>
            <li>Delivery time may vary depending on your location and courier service.</li>
            <li>Remote or special areas may take additional time.</li>
          </ul>
        </Section>

        <Section title="2. Estimated Delivery Time">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <b>Inside Dhaka:</b> Typically 1–3 business days
            </li>
            <li>
              <b>Outside Dhaka:</b> Typically 2–6 business days
            </li>
            <li>
              Delivery time can increase during holidays, political strikes,
              extreme weather, or courier delays.
            </li>
          </ul>
        </Section>

        <Section title="3. Shipping Charges">
          <p>
            Shipping charges depend on your delivery zone and will be shown at
            checkout before confirming your order.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Delivery charge may vary by location and order size.</li>
            <li>Special offers may include free or discounted delivery.</li>
          </ul>
        </Section>

        <Section title="4. Order Processing Time">
          <ul className="list-disc pl-6 space-y-2">
            <li>Orders are usually processed within 24–48 hours.</li>
            <li>Processing may take longer during high-volume campaigns or restocking.</li>
            <li>Orders placed late at night may be processed the next business day.</li>
          </ul>
        </Section>

        <Section title="5. Cash on Delivery (COD)">
          <ul className="list-disc pl-6 space-y-2">
            <li>COD is available for selected locations (based on courier support).</li>
            <li>Customers must provide a valid phone number for confirmation.</li>
            <li>
              If a customer repeatedly rejects COD deliveries, Korezi may restrict COD
              access for future orders.
            </li>
          </ul>
        </Section>

        <Section title="6. Failed Delivery / Unreachable Customer">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              If the courier cannot reach you, they may attempt delivery again or contact you.
            </li>
            <li>
              If delivery fails due to incorrect address, unreachable phone, or customer refusal,
              the order may be canceled.
            </li>
            <li>In such cases, delivery charges may not be refundable.</li>
          </ul>
        </Section>

        <Section title="7. Package Inspection & Unboxing">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Please check the package condition before accepting delivery.
            </li>
            <li>
              We recommend making an unboxing video for damaged/incorrect product claims.
            </li>
            <li>
              If the seal is broken or packaging looks tampered, contact us immediately before opening.
            </li>
          </ul>
        </Section>

        <Section title="8. Address Accuracy">
          <p>
            Customers are responsible for providing accurate shipping information.
            Korezi is not responsible for delivery delays due to incorrect or incomplete
            address details.
          </p>
        </Section>

        <Section title="9. Contact Us">
          <p>If you need help regarding shipping, please contact us:</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Email: <b>support@korezi.com</b></li>
            <li>Location: Dhaka, Bangladesh</li>
          </ul>
        </Section>

        {/* Back link */}
        <div className="mt-12">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-black"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

/* Reusable section component */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}
