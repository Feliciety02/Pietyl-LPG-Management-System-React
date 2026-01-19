import React, { useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import NavItem from "../ui/NavLink";
import HeaderLogo from "../../../images/Header_Logo.png";

// adjust the import path if yours is different
import LoginModal from "../modals/loginModal";

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
  const [loginOpen, setLoginOpen] = useState(false);

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

  function openLogin() {
    setLoginOpen(true);
    setOpen(false);
  }

  function closeLogin() {
    setLoginOpen(false);
  }

  return (
    <>
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
            {/* minimalist sign in button */}
            <button
              type="button"
              onClick={openLogin}
              className="hidden sm:inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-white/40 px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white/70 hover:border-slate-900/15 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
            >
              {ctaLabel}
            </button>

            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="md:hidden rounded-xl border border-white/60 bg-white/40 px-3 py-2 text-sm font-extrabold text-slate-900 hover:bg-white/65 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {open ? (
          <div className="md:hidden border-t border-white/30 bg-white/35 backdrop-blur-2xl">
            <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={handleClick(item)}
                  className="rounded-xl bg-white/40 border border-white/60 px-4 py-3 text-sm font-extrabold text-slate-900 hover:bg-white/65 transition"
                >
                  {item.label}
                </Link>
              ))}

              <button
                type="button"
                onClick={openLogin}
                className="rounded-xl bg-teal-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/30"
              >
                {ctaLabel}
              </button>
            </div>
          </div>
        ) : null}
      </header>

      {/* black tinted backdrop + modal */}
      {loginOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeLogin();
          }}
        >
          {/* tint overlay */}
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

          {/* modal content wrapper */}
          <div className="relative w-full max-w-lg">
            <LoginModal onClose={closeLogin} />
          </div>
        </div>
      ) : null}
    </>
  );
}
