"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function TermsConditionsPage() {
  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Terms & Conditions
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Intro */}
        <section className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Welcome to <b>Korezi</b>. These Terms & Conditions govern your access
            to and use of our website, services, and products. By accessing or
            purchasing from Korezi, you agree to be bound by these terms.
          </p>
          <p>
            If you do not agree with any part of these Terms, please do not use
            our website or services.
          </p>
        </section>

        <Section title="1. Eligibility">
          <p>
            By using Korezi, you confirm that you are at least 18 years old or
            accessing the site under the supervision of a parent or legal
            guardian.
          </p>
        </Section>

        <Section title="2. Products & Authenticity">
          <p>
            Korezi sells authentic Korean skincare and beauty products sourced
            from verified suppliers. Product images are for reference only and
            actual packaging may vary due to brand updates.
          </p>
        </Section>

        <Section title="3. Pricing & Payments">
          <ul className="list-disc pl-6 space-y-2">
            <li>All prices are listed in Bangladeshi Taka (৳).</li>
            <li>Prices may change without prior notice.</li>
            <li>
              Payments must be completed using approved payment methods before
              order confirmation.
            </li>
          </ul>
        </Section>

        <Section title="4. Orders & Cancellations">
          <ul className="list-disc pl-6 space-y-2">
            <li>Orders are confirmed only after successful payment.</li>
            <li>
              Korezi reserves the right to cancel orders due to stock issues,
              pricing errors, or suspected fraud.
            </li>
            <li>
              Once shipped, orders cannot be canceled.
            </li>
          </ul>
        </Section>

        <Section title="5. Shipping & Delivery">
          <p>
            Delivery timelines are estimated and may vary depending on location,
            courier delays, or unforeseen circumstances. Korezi is not liable
            for delays beyond our control.
          </p>
        </Section>

        <Section title="6. Returns & Refunds">
          <p>
            Due to hygiene and safety reasons, opened or used skincare products
            are not eligible for return or refund. Damaged or incorrect items
            must be reported within 24 hours of delivery.
          </p>
        </Section>

        <Section title="7. User Accounts">
          <ul className="list-disc pl-6 space-y-2">
            <li>You are responsible for maintaining account confidentiality.</li>
            <li>
              Korezi is not liable for unauthorized account access caused by user
              negligence.
            </li>
          </ul>
        </Section>

        <Section title="8. Prohibited Activities">
          <ul className="list-disc pl-6 space-y-2">
            <li>Using the site for illegal or fraudulent purposes</li>
            <li>Attempting to hack, disrupt, or misuse the website</li>
            <li>Providing false or misleading information</li>
          </ul>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            Korezi shall not be liable for any indirect, incidental, or
            consequential damages arising from the use of our products or
            website.
          </p>
        </Section>

        <Section title="10. Intellectual Property">
          <p>
            All content on Korezi, including logos, images, text, and design, is
            the property of Korezi and may not be used without prior written
            permission.
          </p>
        </Section>

        <Section title="11. Changes to Terms">
          <p>
            Korezi reserves the right to update or modify these Terms &
            Conditions at any time. Continued use of the website implies
            acceptance of the updated terms.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p>
            These Terms & Conditions are governed by and interpreted under the
            laws of Bangladesh.
          </p>
        </Section>

        <Section title="13. Contact Information">
          <p>
            If you have any questions regarding these Terms & Conditions, please
            contact us:
          </p>
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
