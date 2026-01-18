import React, { useMemo } from "react";
import { Link, usePage } from "@inertiajs/react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function isActive(url, href) {
  if (!href) return false;
  return url === href || url.startsWith(href + "/");
}

function NavItem({ href, label, active }) {
  return (
    <Link
      href={href}
      className={cx(
        "relative flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition",
        "focus:outline-none focus:ring-4 focus:ring-teal-500/20",
        active
          ? "bg-teal-600 text-white shadow-sm"
          : "text-slate-700 hover:bg-slate-100"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-white/90" />
      )}
      {label}
    </Link>
  );
}

export default function Sidebar({ title = "Dashboard", items = [] }) {
  const { url } = usePage();
  const navItems = useMemo(() => items.filter(Boolean), [items]);

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white ui-animate-sidebar">
      {/* header */}
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="text-sm font-extrabold text-slate-900">{title}</div>
        <div className="mt-1 text-xs text-slate-500">Navigation</div>
      </div>

      {/* nav */}
      <nav className="px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(url, item.href)}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}
