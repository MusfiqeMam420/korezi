"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function RefundPolicyPage() {
  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Refund & Return Policy
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Intro */}
        <section className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            At <b>Korezi</b>, customer satisfaction is important to us. We take
            great care to ensure that all products are authentic, well-packed,
            and delivered safely. Please read our refund and return policy
            carefully before placing an order.
          </p>
        </section>

        <Section title="1. Eligibility for Returns">
          <ul className="list-disc pl-6 space-y-2">
            <li>Only damaged, defective, or incorrect items are eligible for return.</li>
            <li>Products must be unused, unopened, and in original packaging.</li>
            <li>Return requests must be made within <b>24 hours</b> of delivery.</li>
          </ul>
        </Section>

        <Section title="2. Non-Returnable Items">
          <p>The following items are not eligible for return or refund:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Opened or used skincare and beauty products</li>
            <li>Products damaged after delivery</li>
            <li>Items purchased on clearance or special discounts</li>
            <li>Free gifts or promotional items</li>
          </ul>
        </Section>

        <Section title="3. Damaged or Incorrect Products">
          <p>
            If you receive a damaged, defective, or incorrect product, please
            contact us within 24 hours of delivery with:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Order number</li>
            <li>Clear photos or video of the issue</li>
            <li>Description of the problem</li>
          </ul>
        </Section>

        <Section title="4. Refund Process">
          <ul className="list-disc pl-6 space-y-2">
            <li>Once your return is approved, we will arrange pickup if applicable.</li>
            <li>Refunds are processed after inspection of the returned product.</li>
            <li>Approved refunds will be issued within 7–10 business days.</li>
          </ul>
        </Section>

        <Section title="5. Refund Method">
          <p>
            Refunds will be made using the original payment method or an
            alternative method agreed upon with the customer.
          </p>
        </Section>

        <Section title="6. Shipping Charges">
          <ul className="list-disc pl-6 space-y-2">
            <li>Shipping fees are non-refundable.</li>
            <li>
              If the return is due to our error (wrong or defective product),
              Korezi will bear the return shipping cost.
            </li>
          </ul>
        </Section>

        <Section title="7. Order Cancellation">
          <p>
            Orders can only be canceled before shipment. Once an order has been
            shipped, cancellation is not possible.
          </p>
        </Section>

        <Section title="8. Policy Updates">
          <p>
            Korezi reserves the right to update or modify this Refund Policy at
            any time. Changes will be effective immediately upon posting on the
            website.
          </p>
        </Section>

        <Section title="9. Contact Us">
          <p>If you have any questions regarding refunds or returns, contact us:</p>
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
      <Footer />
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
