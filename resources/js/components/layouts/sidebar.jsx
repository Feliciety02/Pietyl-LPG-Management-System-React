import React, { useMemo, useState } from "react";
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

function SideItem({ href, label, active, collapsed, Icon }) {
  return (
    <Link
      href={href}
      className={cx("block rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/15")}
      title={collapsed ? label : undefined}
    >
      <div
        className={cx(
          "relative flex items-center rounded-2xl transition-colors",
          "px-3 py-2.5",
          active ? "bg-teal-600/10 text-teal-900" : "text-slate-700 hover:bg-slate-50"
        )}
      >
        {active ? (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-teal-600" />
        ) : null}

        {/* Fixed icon slot so icons never move */}
        <div className="w-10 flex items-center justify-center shrink-0">
          <div
            className={cx(
              "h-10 w-10 rounded-2xl flex items-center justify-center ring-1",
              active ? "bg-white ring-teal-200" : "bg-white ring-slate-200"
            )}
          >
            <Icon className={cx("h-5 w-5", active ? "text-teal-700" : "text-slate-600")} />
          </div>
        </div>

        {/* Label fades out without taking layout space when collapsed */}
        <div
          className={cx(
            "ml-3 min-w-0 flex-1",
            "transition-[opacity,transform] duration-200 ease-in-out",
            collapsed ? "opacity-0 -translate-x-1 pointer-events-none" : "opacity-100 translate-x-0"
          )}
          aria-hidden={collapsed ? true : false}
        >
          <div className={cx("truncate text-sm font-semibold", active && "text-teal-900")}>
            {label}
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

  return (
    <aside
      className={cx(
        "shrink-0 border-r border-slate-200 bg-white",
        "h-screen sticky top-0",
        "transition-[width] duration-200 ease-in-out",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header is fixed height so nothing jumps */}
      <div className="h-[84px] border-b border-slate-200 px-4 flex items-center">
        <div className="w-full flex items-center justify-between">
          {/* Logo block fixed size */}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={cx(
              "flex items-center gap-3 rounded-2xl",
              "focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            )}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
              <img src={HeaderLogo} alt="Pietyl LPG" className="h-7 w-7 object-contain" />
            </div>

            {/* Text stays in layout but fades out so icons do not move */}
            <div
              className={cx(
                "min-w-0 text-left",
                "transition-[opacity,transform] duration-200 ease-in-out",
                collapsed ? "opacity-0 -translate-x-1 pointer-events-none" : "opacity-100 translate-x-0"
              )}
              aria-hidden={collapsed ? true : false}
            >
              <div className="text-sm font-extrabold text-slate-900 truncate">{title}</div>
              <div className="text-xs text-slate-500 truncate">{subtitle}</div>
            </div>
          </button>

          {/* Toggle icon stays visible always */}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={cx(
              "rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50",
              "focus:outline-none focus:ring-4 focus:ring-teal-500/15",
              collapsed ? "ml-auto" : ""
            )}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="px-3 py-4">
        {/* Reserve space so nav items never shift even if label is hidden */}
        <div className="h-6 px-2 pb-2">
          <div
            className={cx(
              "text-xs font-semibold tracking-wide text-slate-500",
              "transition-opacity duration-200",
              collapsed ? "opacity-0" : "opacity-100"
            )}
            aria-hidden={collapsed ? true : false}
          >
            Navigation
          </div>
        </div>

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
