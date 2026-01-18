import React, { useMemo, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { motion } from "framer-motion";
import HeaderLogo from "../../../images/Header_Logo.png";
import { LayoutDashboard, ChevronLeft } from "lucide-react";
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
    <Link href={href} className="block" title={collapsed ? label : undefined}>
      <motion.div
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.99 }}
        className={cx(
          "relative flex items-center rounded-2xl transition",
          "focus:outline-none focus:ring-4 focus:ring-teal-500/15",
          collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2.5",
          active ? "bg-teal-600/10 text-teal-900" : "text-slate-700 hover:bg-slate-50"
        )}
      >
        {active ? (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-teal-600" />
        ) : null}

        <div
          className={cx(
            "h-10 w-10 rounded-2xl flex items-center justify-center ring-1 transition",
            active ? "bg-white ring-teal-200" : "bg-white ring-slate-200"
          )}
        >
          <Icon className={cx("h-5 w-5", active ? "text-teal-700" : "text-slate-600")} />
        </div>

        {!collapsed ? (
          <div className={cx("truncate text-sm font-semibold", active && "text-teal-900")}>
            {label}
          </div>
        ) : null}
      </motion.div>
    </Link>
  );
}

export default function Sidebar({ title = "Dashboard", subtitle = "Pietyl LPG", items = [] }) {
  const page = usePage();
  const url = page?.url || "";
  const navItems = useMemo(() => items.filter(Boolean), [items]);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => setCollapsed((v) => !v);

  return (
    <motion.aside
      layout
      transition={{ duration: 0.18 }}
      className={cx(
        "shrink-0 border-r border-slate-200 bg-white",
        "h-screen sticky top-0",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className={cx("p-4 border-b border-slate-200", collapsed && "px-3")}>
        <div className={cx("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          {/* Logo toggles collapse and expand */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cx(
              "flex items-center gap-3 rounded-2xl",
              "focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            )}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <div className="h-11 w-11 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
              <img src={HeaderLogo} alt="Pietyl LPG" className="h-7 w-7 object-contain" />
            </div>

            {!collapsed ? (
              <div className="min-w-0 text-left">
                <div className="text-sm font-extrabold text-slate-900 truncate">{title}</div>
                <div className="text-xs text-slate-500 truncate">{subtitle}</div>
              </div>
            ) : null}
          </button>

          {/* Collapse button only when expanded */}
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
              title="Collapse"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="px-3 py-4">
        {/* Navigation label hidden when collapsed */}
        {!collapsed ? (
          <div className="px-2 pb-2">
            <div className="text-xs font-semibold tracking-wide text-slate-500">Navigation</div>
          </div>
        ) : null}

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
    </motion.aside>
  );
}