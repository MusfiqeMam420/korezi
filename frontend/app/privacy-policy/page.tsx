"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Intro */}
        <section className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Welcome to <b>Korezi</b>. Your privacy is important to us, and we are
            committed to protecting your personal information. This Privacy
            Policy explains how we collect, use, store, and protect your data
            when you visit or make a purchase from our website.
          </p>
          <p>
            By using Korezi, you agree to the practices described in this policy.
            If you do not agree, please discontinue using our services.
          </p>
        </section>

        {/* Info we collect */}
        <Section title="1. Information We Collect">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <b>Personal Information:</b> Name, phone number, email address,
              shipping address, billing address.
            </li>
            <li>
              <b>Account Information:</b> Login details and order history (if you
              create an account).
            </li>
            <li>
              <b>Payment Information:</b> Transaction details (we do not store
              full card or wallet credentials).
            </li>
            <li>
              <b>Technical Data:</b> IP address, browser type, device information,
              and cookies.
            </li>
          </ul>
        </Section>

        {/* How we use */}
        <Section title="2. How We Use Your Information">
          <ul className="list-disc pl-6 space-y-2">
            <li>To process and deliver your orders</li>
            <li>To communicate order updates and customer support</li>
            <li>To improve our website, products, and services</li>
            <li>To prevent fraud and ensure secure transactions</li>
            <li>To send promotional offers (only if you opt in)</li>
          </ul>
        </Section>

        {/* Cookies */}
        <Section title="3. Cookies & Tracking Technologies">
          <p>
            We use cookies and similar technologies to improve your browsing
            experience, analyze traffic, and personalize content. You can
            disable cookies in your browser settings, but some features of the
            site may not function properly.
          </p>
        </Section>

        {/* Sharing */}
        <Section title="4. Sharing Your Information">
          <p>
            We do <b>not sell</b> your personal data. We may share limited
            information with:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Delivery and logistics partners</li>
            <li>Payment gateway providers</li>
            <li>Legal authorities when required by law</li>
          </ul>
        </Section>

        {/* Data security */}
        <Section title="5. Data Security">
          <p>
            We implement industry-standard security measures to protect your
            information. However, no online system is 100% secure, and we cannot
            guarantee absolute security.
          </p>
        </Section>

        {/* Rights */}
        <Section title="6. Your Rights">
          <ul className="list-disc pl-6 space-y-2">
            <li>Access or update your personal information</li>
            <li>Request deletion of your account</li>
            <li>Opt out of promotional communications</li>
          </ul>
        </Section>

        {/* Third party */}
        <Section title="7. Third-Party Links">
          <p>
            Our website may contain links to third-party websites. We are not
            responsible for their privacy practices or content.
          </p>
        </Section>

        {/* Children */}
        <Section title="8. Children’s Privacy">
          <p>
            Korezi does not knowingly collect personal information from children
            under the age of 13. If you believe a child has provided us with
            personal data, please contact us immediately.
          </p>
        </Section>

        {/* Updates */}
        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Any changes will
            be posted on this page with an updated date.
          </p>
        </Section>

        {/* Contact */}
        <Section title="10. Contact Us">
          <p>
            If you have any questions about this Privacy Policy or how your data
            is handled, please contact us:
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

/* Reusable section wrapper */
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
