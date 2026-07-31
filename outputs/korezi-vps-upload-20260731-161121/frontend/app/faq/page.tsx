"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type FAQ = {
  q: string;
  a: string;
  tag?: string;
};

export default function FAQPage() {
  const faqs: FAQ[] = useMemo(
    () => [
      {
        q: "Are your products 100% authentic?",
        a: "Yes. We source products from trusted suppliers and only sell authentic items. If you ever have a concern, contact support with your order ID.",
        tag: "Authenticity",
      },
      {
        q: "Do you deliver all over Bangladesh?",
        a: "Yes, we deliver across Bangladesh. Delivery time depends on your location and courier availability.",
        tag: "Shipping",
      },
      {
        q: "How long does delivery take?",
        a: "Inside Dhaka: usually 1–3 business days. Outside Dhaka: usually 2–6 business days. Holidays and courier delays can increase the time.",
        tag: "Shipping",
      },
      {
        q: "What are the delivery charges?",
        a: "Delivery charges depend on your delivery zone and will be shown at checkout before you confirm your order.",
        tag: "Shipping",
      },
      {
        q: "Do you offer Cash on Delivery (COD)?",
        a: "COD is available for selected areas depending on courier support. If COD is available in your area, you’ll see it at checkout.",
        tag: "Payment",
      },
      {
        q: "How can I track my order?",
        a: "After your order is shipped, we may share tracking details (if available). You can also contact support with your order ID for updates.",
        tag: "Orders",
      },
      {
        q: "Can I cancel my order?",
        a: "You can request cancellation before the order is shipped. Once shipped, cancellation may not be possible. Contact support ASAP with your order ID.",
        tag: "Orders",
      },
      {
        q: "What is your refund policy?",
        a: "Refunds depend on product condition and verification. For damaged or incorrect items, please contact support within 24 hours with an unboxing video.",
        tag: "Refund",
      },
      {
        q: "What if I receive a damaged or wrong product?",
        a: "Please contact us within 24 hours of delivery with your order ID and an unboxing video. We’ll review and help you quickly.",
        tag: "Support",
      },
      {
        q: "How do I choose the right product for my skin type?",
        a: "Check the product’s skin type and concerns section. If you’re unsure, message support with your skin type (dry/oily/sensitive) and concerns (acne, pigmentation, etc.).",
        tag: "Products",
      },
      {
        q: "Do you restock sold-out items?",
        a: "Yes, we restock based on demand. If something is sold out, you can contact us or follow our page for restock updates.",
        tag: "Products",
      },
      {
        q: "Do you have any discounts or offers?",
        a: "We run discounts during campaigns and special events. Check the home page and product cards for sale price and MRP.",
        tag: "Offers",
      },
    ],
    []
  );

  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return faqs;
    return faqs.filter(
      (f) =>
        f.q.toLowerCase().includes(s) ||
        f.a.toLowerCase().includes(s) ||
        (f.tag || "").toLowerCase().includes(s)
    );
  }, [faqs, query]);

  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Find quick answers about shipping, authenticity, payments, orders,
            and more.
          </p>
        </div>

        {/* Search */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQ (shipping, COD, refund, authenticity...)"
            className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
          />
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpenIndex(0);
            }}
            className="px-5 py-3 rounded-2xl border hover:bg-gray-50 transition"
          >
            Clear
          </button>
        </div>

        {/* Tags */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            "Shipping",
            "Payment",
            "Orders",
            "Refund",
            "Authenticity",
            "Products",
            "Offers",
            "Support",
          ].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setQuery(t)}
              className="text-xs px-3 py-2 rounded-full border bg-white hover:bg-gray-50 transition"
            >
              {t}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="mt-10 space-y-3">
          {filtered.length === 0 ? (
            <div className="border rounded-2xl p-6 text-gray-600">
              No results found. Try searching for “shipping”, “COD”, or “refund”.
            </div>
          ) : (
            filtered.map((f, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={`${f.q}-${idx}`}
                  className=" rounded-2xl overflow-hidden bg-gray-100"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{f.q}</p>
                      {f.tag && (
                        <p className="text-xs text-gray-500 mt-1">{f.tag}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-gray-500">
                      {isOpen ? "–" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-gray-700 leading-relaxed">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contact box */}
        <div className="mt-12 rounded-3xl border bg-gray-200 p-6">
          <h2 className="text-lg font-semibold">Still need help?</h2>
          <p className="text-sm text-gray-600 mt-2">
            If your question isn’t listed here, contact us with your order ID.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="px-5 py-3 rounded-2xl bg-black text-white hover:bg-[#BE171F] transition"
            >
              Back to Home
            </Link>
            <Link
              href="#"
              className="px-5 py-3 rounded-2xl border hover:bg-white transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
