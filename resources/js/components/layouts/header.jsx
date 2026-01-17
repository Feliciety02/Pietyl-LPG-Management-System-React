import React, { useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import NavItem from "../ui/NavLink";
import HeaderLogo from "../../../images/Header_Logo.png";

export default function Header({
  activeKey,
  ctaLabel = "Sign in",
  ctaHref = "/login",
  onHome,
  onProducts,
  onAbout,
  onContact,
}) {
  const [open, setOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { key: "home", label: "Home", href: "/", onClick: onHome },
      { key: "products", label: "Products", href: "#products", onClick: onProducts },
      { key: "about", label: "About Us", href: "#about", onClick: onAbout },
      { key: "contact", label: "Contact", href: "#contact", onClick: onContact },
    ],
    [onHome, onProducts, onAbout, onContact]
  );

  const handleClick = (item) => (e) => {
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/35 backdrop-blur-2xl backdrop-saturate-150">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img src={HeaderLogo} alt="Pietyl logo" className="h-10 w-auto" />
          <div>
            <div className="font-extrabold text-slate-900">PIETYL</div>
            <div className="text-xs text-slate-600/80">LPG Operations Platform</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-10">
          {navItems.map((item) => (
            <NavItem
              key={item.key}
              label={item.label}
              href={item.href}
              active={activeKey === item.key}
              onClick={handleClick(item)}
            />
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href={ctaHref}
            className="hidden sm:inline-flex rounded-xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition"
          >
            {ctaLabel}
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden rounded-xl border bg-white/40 px-3 py-2 text-sm font-bold"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
    </header>
  );
}
