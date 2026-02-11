"use client";

import Link from "next/link";

function IconFacebook(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-3h2.4V9.7c0-2.4 1.4-3.7 3.6-3.7 1 0 2 .2 2 .2v2.2h-1.1c-1.1 0-1.4.7-1.4 1.4V12H18l-.4 3h-2.6v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}
function IconInstagram(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm6.2-2.7a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
    </svg>
  );
}
function IconYoutube(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.2 31 31 0 0 0 2 12s.1 3.6.4 4.8a3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1c.3-1.2.4-4.8.4-4.8s0-3.6-.4-4.8ZM10 15.4V8.6L16 12l-6 3.4Z" />
    </svg>
  );
}
function IconMail(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16v12H4z"
      />
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4 7 8 6 8-6"
      />
    </svg>
  );
}
function IconPhone(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 16.9v3a2 2 0 0 1-2.2 2A19.9 19.9 0 0 1 11 18.1a19.5 19.5 0 0 1-6.1-6.1A19.9 19.9 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.8.3 1.6.6 2.3a2 2 0 0 1-.5 2.1L8 9a16 16 0 0 0 7 7l.9-1.2a2 2 0 0 1 2.1-.5c.8.3 1.5.5 2.3.6A2 2 0 0 1 22 16.9Z"
      />
    </svg>
  );
}
function IconLocation(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 22s7-4.4 7-11a7 7 0 0 0-14 0c0 6.6 7 11 7 11Z"
      />
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      {/* Top */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-xl font-semibold tracking-tight">Korezi</span>
              <span className="text-xs px-2 py-1 rounded-full border text-[#BE171F] border-[#BE171F]/30 bg-[#BE171F]/5">
                K-Beauty
              </span>
            </Link>

            <p className="mt-4 text-sm text-gray-600 leading-relaxed">
              Authentic Korean skincare in Bangladesh. Curated essentials for acne, hydration,
              barrier repair & glow — with fair pricing and fast delivery.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-2xl border bg-white hover:bg-gray-100 flex items-center justify-center"
                aria-label="Facebook"
              >
                <IconFacebook className="w-5 h-5 text-gray-700" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-2xl border bg-white hover:bg-gray-100 flex items-center justify-center"
                aria-label="Instagram"
              >
                <IconInstagram className="w-5 h-5 text-gray-700" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-2xl border bg-white hover:bg-gray-100 flex items-center justify-center"
                aria-label="YouTube"
              >
                <IconYoutube className="w-5 h-5 text-gray-700" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <p className="text-sm font-semibold text-gray-900">Shop</p>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>
                <Link className="hover:text-black" href="/shop">
                  All Products
                </Link>
              </li>
              <li>
                <Link className="hover:text-black" href="/shop?category=Cleanser">
                  Cleansers
                </Link>
              </li>
              <li>
                <Link className="hover:text-black" href="/shop?category=Serum">
                  Serums
                </Link>
              </li>
              <li>
                <Link className="hover:text-black" href="/shop?category=Sunscreen">
                  Sunscreens
                </Link>
              </li>
              <li>
                <Link className="hover:text-black" href="/shop?category=Moisturizer">
                  Moisturizers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">Company</p>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>
                <Link className="hover:text-black" href="#about">
                  About Korezi
                </Link>
              </li>
              <li>
                <Link className="hover:text-black" href="/contact">
                  Contact
                </Link>
              </li>
              <li>
                <Link className="hover:text-black" href="/faq">
                  FAQ
                </Link>
              </li>
              <li>
                <Link className="hover:text-black" href="/privacy-policy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link className="hover:text-black" href="/terms-conditions">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact + Newsletter */}
          <div>
            <p className="text-sm font-semibold text-gray-900">Help & Support</p>

            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <IconPhone className="w-4 h-4 text-gray-700" />
                <span>+880 1923-815299</span>
              </div>
              <div className="flex items-center gap-2">
                <IconMail className="w-4 h-4 text-gray-700" />
                <span>support@korezi.com</span>
              </div>
              <div className="flex items-center gap-2">
                <IconLocation className="w-4 h-4 text-gray-700" />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-900">Get deals & updates</p>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Subscribed ✅ (connect backend later)");
                }}
              >
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  className="w-full border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                />
                <button
                  type="submit"
                  className="shrink-0 px-4 py-3 rounded-2xl bg-[#BE171F] hover:bg-black transition text-white text-sm font-medium"
                >
                  Subscribe
                </button>
              </form>

              <p className="mt-2 text-[11px] text-gray-400">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t bg-black text-white">
        <div className="max-w-7xl  mx-auto px-6 py-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <p className="text-xs ">
            © {new Date().getFullYear()} Korezi. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-3 text-xs ">
            <Link className="hover:text-[#BE171F]" href="/privacy-policy">
              Privacy
            </Link>
            <span className="text-gray-300">•</span>
            <Link className="hover:text-[#BE171F]" href="/terms-conditions">
              Terms
            </Link>
            <span className="text-gray-300">•</span>
            <Link className="hover:text-[#BE171F]" href="/refund-policy">
              Refund Policy
            </Link>
            <span className="text-gray-300">•</span>
            <Link className="hover:text-[#BE171F]" href="/shipping-policy">
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
