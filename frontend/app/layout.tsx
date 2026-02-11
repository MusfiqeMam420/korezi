import "./globals.css";

import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { CartProvider } from "@/app/context/CartContext";
import { AuthProvider } from "@/app/context/AuthContext";
import { ToastProvider } from "@/app/context/ToastContext";

const SITE_NAME = "Korezi";
const SITE_URL = "https://korezi.com"; // change to your real domain
const DESCRIPTION =
  "Authentic Korean skincare & beauty products in Bangladesh. Shop trusted K-beauty at Korezi.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${SITE_NAME} – Korean Skincare & Beauty Store`,
    template: `%s | ${SITE_NAME}`,
  },

  description: DESCRIPTION,

  applicationName: SITE_NAME,
  referrer: "origin-when-cross-origin",

  keywords: [
    "Korezi",
    "Korean skincare",
    "K-beauty",
    "Korean cosmetics",
    "Skincare Bangladesh",
    "Beauty shop BD",
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
        url: "/banner-1.webp", // your image in /public
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
    images: ["/banner-1.webp"],
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

  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              {children}
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
