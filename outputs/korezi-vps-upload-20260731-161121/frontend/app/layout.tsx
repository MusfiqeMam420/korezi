import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import Navbar from "@/components/Navbar";
import FloatingCart from "@/components/FloatingCart";
import ExtensionErrorGuard from "@/components/ExtensionErrorGuard";
import PageTransition from "@/components/PageTransition";
import { CartProvider } from "@/app/context/CartContext";
import { AuthProvider } from "@/app/context/AuthContext";
import { ToastProvider } from "@/app/context/ToastContext";

const SITE_NAME = "Korezi";
const SITE_URL = "https://korezi.com";
const DESCRIPTION =
  "Authentic Korean skincare & beauty products in Bangladesh. Shop trusted K-beauty at Korezi.";
const OG_IMAGE = "/og-image.png";
const SOCIAL_LINKS = [
  "https://www.facebook.com/korezi.skin",
  "https://www.instagram.com/korezi.skin/",
];

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${SITE_NAME} – Korean Skincare & Beauty Store`,
    template: `%s | ${SITE_NAME}`,
  },

  description: DESCRIPTION,
  applicationName: SITE_NAME,
  referrer: "origin-when-cross-origin",
  alternates: {
    canonical: "/",
  },

  keywords: [
    "Korezi",
    "Korean skincare",
    "K-beauty",
    "Korean cosmetics",
    "Skincare Bangladesh",
    "Beauty shop BD",
    "Korean skincare Bangladesh",
    "K-beauty Bangladesh",
    "Korean sunscreen Bangladesh",
    "Korean serum Bangladesh",
    "authentic skincare Bangladesh",
  ],

  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },

  manifest: "/site.webmanifest",

  openGraph: {
    title: `${SITE_NAME} – Korean Skincare & Beauty Store`,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} Korean Skincare Store`,
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} – Korean Skincare & Beauty Store`,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "shopping",
};

export const viewport: Viewport = {
  themeColor: "#BE171F",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/kz-icon.png`,
      image: `${SITE_URL}${OG_IMAGE}`,
      sameAs: SOCIAL_LINKS,
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "support@korezi.com",
          areaServed: "BD",
          availableLanguage: ["en", "bn"],
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/shop?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Store",
      "@id": `${SITE_URL}/#store`,
      name: SITE_NAME,
      url: SITE_URL,
      image: `${SITE_URL}${OG_IMAGE}`,
      description: DESCRIPTION,
      priceRange: "$$",
      areaServed: {
        "@type": "Country",
        name: "Bangladesh",
      },
      parentOrganization: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={interTight.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <ExtensionErrorGuard />
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              <PageTransition>{children}</PageTransition>
              <FloatingCart />
            </CartProvider>
          </AuthProvider>
        </ToastProvider>

        <GoogleAnalytics gaId="G-3LV3CFBERG" />
      </body>
    </html>
  );
}
