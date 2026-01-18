import React, { useEffect, useMemo, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import HeaderLogo from "../../../images/Header_Logo.png";
import { LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import { sidebarIconMap } from "../ui/Icons";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalize(u = "") {
  return String(u).split("?")[0];
}

function isActive(url, href) {
  if (!href) return false;
  const u = normalize(url);
  const h = normalize(href);
  return u === h || u.startsWith(h + "/");
}

const STORAGE_KEY = "pietyl.sidebar.collapsed";

function SideItem({ href, label, active, collapsed, Icon }) {
  const activeExpanded = active && !collapsed;

  return (
    <Link href={href} className="block" title={collapsed ? label : undefined}>
      <div
        className={cx(
          "relative rounded-2xl transition-colors",
          "px-3 py-2.5",
          "hover:bg-slate-50",
          activeExpanded ? "bg-teal-600/10" : "bg-transparent"
        )}
      >
        {active ? (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-teal-600" />
        ) : null}

        {/* IMPORTANT: structure never changes, so icon never moves */}
        <div className="flex items-center">
          {/* Fixed icon slot */}
          <div className="w-10 flex items-center justify-center shrink-0">
            <div
              className={cx(
                "h-10 w-10 rounded-2xl flex items-center justify-center ring-1 transition-colors",
                "bg-white",
                activeExpanded ? "ring-teal-200" : "ring-slate-200"
              )}
            >
              <Icon
                className={cx(
                  "h-5 w-5 transition-colors",
                  active ? "text-teal-700" : "text-slate-600"
                )}
              />
            </div>
          </div>

          {/* Label slot always exists, but collapses to 0 so icon x stays same */}
          <div
            className={cx(
              "ml-3 min-w-0 overflow-hidden",
              "transition-[max-width,opacity,transform] duration-200 ease-in-out",
              collapsed
                ? "max-w-0 opacity-0 -translate-x-1"
                : "max-w-[220px] opacity-100 translate-x-0"
            )}
            aria-hidden={collapsed ? true : false}
          >
            <div className={cx("truncate text-sm font-semibold", active ? "text-teal-900" : "text-slate-700")}>
              {label}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Sidebar({ title = "Dashboard", subtitle = "Pietyl LPG", items = [] }) {
  const page = usePage();
  const url = page?.url || "";
  const navItems = useMemo(() => items.filter(Boolean), [items]);

  const [collapsed, setCollapsed] = useState(false);

  // Restore sidebar state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setCollapsed(true);
      if (saved === "0") setCollapsed(false);
    } catch {}
  }, []);

  // Persist sidebar state whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  const toggle = () => setCollapsed((v) => !v);

  return (
    <aside
      className={cx(
        "shrink-0 border-r border-slate-200 bg-white",
        "h-screen sticky top-0",
        "transition-[width] duration-200 ease-in-out",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header fixed height */}
      <div className="h-[84px] border-b border-slate-200 px-4 flex items-center">
        <div className="w-full flex items-center justify-between">
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-3 rounded-2xl outline-none focus:outline-none"
            style={{ WebkitTapHighlightColor: "transparent" }}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
              <img src={HeaderLogo} alt="Pietyl LPG" className="h-7 w-7 object-contain" />
            </div>

            <div
              className={cx(
                "min-w-0 text-left overflow-hidden",
                "transition-[max-width,opacity,transform] duration-200 ease-in-out",
                collapsed
                  ? "max-w-0 opacity-0 -translate-x-1"
                  : "max-w-[220px] opacity-100 translate-x-0"
              )}
              aria-hidden={collapsed ? true : false}
            >
              <div className="text-sm font-extrabold text-slate-900 truncate">{title}</div>
              <div className="text-xs text-slate-500 truncate">{subtitle}</div>
            </div>
          </button>

          <button
            type="button"
            onClick={toggle}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 outline-none focus:outline-none"
            style={{ WebkitTapHighlightColor: "transparent" }}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(url, item.href);

            const Icon =
              typeof item.icon === "string"
                ? sidebarIconMap[item.icon] || LayoutDashboard
                : item.icon || LayoutDashboard;

            return (
              <SideItem
                key={item.href}
                href={item.href}
                label={item.label}
                active={active}
                collapsed={collapsed}
                Icon={Icon}
              />
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
