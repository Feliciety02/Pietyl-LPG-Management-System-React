import React from "react";
import { Link, usePage } from "@inertiajs/react";
import HeaderLogo from "../../../images/Header_Logo.png";

export default function Header() {
  const { url } = usePage();

  const isActive = (href) => {
    if (href === "/") return url === "/";
    return url.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/30 bg-white/35 backdrop-blur-2xl backdrop-saturate-150">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
         <img src={HeaderLogo} alt="Pietyl logo" className="h-10 w-auto" />

          <div>
            <div className="font-extrabold text-slate-900 leading-tight">
              PIETYL
            </div>
            <div className="text-xs text-slate-600/80 leading-tight">
              LPG Operations Platform
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
          <Link
            href="/"
            className={`transition hover:text-teal-800 ${
              isActive("/") ? "text-teal-800 font-bold" : ""
            }`}
          >
            Home
          </Link>

          <Link
            href="/products"
            className={`transition hover:text-teal-800 ${
              isActive("/products") ? "text-teal-800 font-bold" : ""
            }`}
          >
            Products
          </Link>

          <Link
            href="/about"
            className={`transition hover:text-teal-800 ${
              isActive("/about") ? "text-teal-800 font-bold" : ""
            }`}
          >
            About Us
          </Link>

          <Link
            href="/contact"
            className={`transition hover:text-teal-800 ${
              isActive("/contact") ? "text-teal-800 font-bold" : ""
            }`}
          >
            Contact
          </Link>
        </nav>

      </div>
    </header>
  );
}
