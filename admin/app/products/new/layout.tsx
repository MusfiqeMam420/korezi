import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Product | Korezi Admin",
  description: "Upload a new product to Korezi store.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
