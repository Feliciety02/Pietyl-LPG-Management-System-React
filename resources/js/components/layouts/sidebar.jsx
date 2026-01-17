import React, { useMemo } from "react";
import { Link, usePage } from "@inertiajs/react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function isActive(url, href) {
  if (!href) return false;
  return url === href || url.startsWith(href + "/");
}

export default function Sidebar({ title = "Dashboard", items = [] }) {
  const { url } = usePage();
  const navItems = useMemo(() => items.filter(Boolean), [items]);

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white">
      <div className="px-5 py-5">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <div className="mt-1 text-xs text-gray-500">Pietyl LPG</div>
      </div>

      <nav className="px-3 pb-5">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(url, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <span className="h-2 w-2 rounded-full bg-current opacity-60" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
