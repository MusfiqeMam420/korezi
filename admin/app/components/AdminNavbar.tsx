"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

const navItems = [
  { href: "/products", label: "Products" },
  { href: "/products/new", label: "Upload" },
  { href: "/brands", label: "Brands" },
  { href: "/categories", label: "Categories" },
  { href: "/covers", label: "Covers" },
  { href: "/orders", label: "Orders" },
];

function isActive(pathname: string, href: string) {
  if (href === "/products") return pathname === "/products";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNavbar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  async function logout() {
    await fetch(`${API_BASE}/api/admin/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    window.location.href = "/login";
  }

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-inner">
        <Link href="/products" className="admin-brand" aria-label="Korezi Admin">
          <span className="admin-brand-mark" aria-hidden="true">
            <img src="/kz-icon2.png" alt="" />
          </span>
          <span>
            <span className="admin-brand-title">Korezi</span>
            <span className="admin-brand-subtitle">Admin Panel</span>
          </span>
        </Link>

        <nav className="admin-nav-links" aria-label="Admin navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(pathname, item.href) ? "admin-nav-link active" : "admin-nav-link"}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button type="button" onClick={logout} className="admin-logout">
          Logout
        </button>
      </div>
    </header>
  );
}
