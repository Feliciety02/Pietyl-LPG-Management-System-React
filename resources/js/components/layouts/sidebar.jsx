
import React, { useMemo, useEffect, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import HeaderLogo from "../../../images/Header_Logo.png";
import { LayoutDashboard, ChevronLeft, ChevronDown } from "lucide-react";
import { sidebarIconMap } from "../ui/Icons";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalize(u = "") {
  return String(u).split("?")[0];
}

function matchesPath(currentUrl, href) {
  if (!href) return false;
  const u = normalize(currentUrl);
  const h = normalize(href);
  return u === h || u.startsWith(h + "/");
}

function flattenItems(items = []) {
  const out = [];
  items.forEach((it) => {
    if (!it) return;
    if (it.type === "group" && Array.isArray(it.items)) out.push(...it.items);
    else out.push(it);
  });
  return out.filter(Boolean);
}

function getActiveHref(currentUrl, items) {
  const u = normalize(currentUrl);
  const flat = flattenItems(items);

  const matches = flat
    .filter((it) => it && it.href)
    .filter((it) => matchesPath(u, it.href))
    .sort((a, b) => normalize(b.href).length - normalize(a.href).length);

  return matches[0]?.href || null;
}

function findActiveGroupLabel(activeHref, items) {
  if (!activeHref) return null;
  const a = normalize(activeHref);

  for (const it of items) {
    if (it?.type !== "group") continue;
    const kids = (it.items || []).filter(Boolean);
    const hit = kids.find((k) => normalize(k.href) === a || a.startsWith(normalize(k.href) + "/"));
    if (hit) return it.label || null;
  }
  return null;
}

function SideItem({ href, label, active, collapsed, Icon }) {
  return (
    <Link href={href} className="block" title={collapsed ? label : undefined}>
      <div
        className={cx(
          "relative rounded-2xl",
          "transition-[background-color,box-shadow] duration-200 ease-out",
          active ? "bg-teal-600/10 shadow-sm" : "bg-transparent",
          collapsed ? "px-3 py-2" : "px-3 py-2.5",
          "hover:bg-slate-50"
        )}
      >
        <span
          className={cx(
            "absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-teal-600",
            "transition-[opacity,height] duration-200 ease-out",
            active ? "opacity-100 h-6 w-1" : "opacity-0 h-0 w-1"
          )}
        />

        <div className="flex items-center gap-3">
          <div className="w-10 shrink-0 flex items-center justify-center">
            <div
              className={cx(
                "h-10 w-10 rounded-2xl flex items-center justify-center ring-1 bg-white",
                "transition-[transform,box-shadow,ring-color] duration-200 ease-out",
                active ? "ring-teal-200 shadow-sm scale-[1.02]" : "ring-slate-200"
              )}
            >
              <Icon
                className={cx(
                  "h-5 w-5",
                  "transition-[color,transform] duration-200 ease-out",
                  active ? "text-teal-700" : "text-slate-600"
                )}
              />
            </div>
          </div>

          <div
            className={cx(
              "min-w-0 flex-1 overflow-hidden",
              "transition-[max-width,opacity,transform] duration-200 ease-out",
              collapsed
                ? "max-w-0 opacity-0 -translate-x-1 pointer-events-none"
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

function GroupHeader({ label, open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cx(
        "w-full px-3 py-2 rounded-2xl",
        "text-left",
        "hover:bg-slate-50",
        "transition-[background-color] duration-200 ease-out",
        "focus:outline-none"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-bold tracking-wide text-slate-500">{label}</div>
        <ChevronDown
          className={cx(
            "h-4 w-4 text-slate-400",
            "transition-transform duration-200 ease-out",
            open ? "rotate-0" : "-rotate-90"
          )}
        />
      </div>
    </button>
  );
}

export default function Sidebar({
  title = "Admin Panel",
  subtitle = "Pietyl LPG",
  items = [],
  homeHref = "/dashboard",
}) {
  const page = usePage();
  const url = page?.url || "";

  const navItems = useMemo(() => items.filter(Boolean), [items]);

  const STORAGE_COLLAPSE = "pietyl.sidebar.collapsed";
  const STORAGE_GROUPS = "pietyl.sidebar.groups";

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_COLLAPSE) === "true";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_COLLAPSE, String(collapsed));
  }, [collapsed]);

  const activeHref = useMemo(() => getActiveHref(url, navItems), [url, navItems]);
  const activeGroupLabel = useMemo(() => findActiveGroupLabel(activeHref, navItems), [activeHref, navItems]);

  const [openGroups, setOpenGroups] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(STORAGE_GROUPS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_GROUPS, JSON.stringify(openGroups));
  }, [openGroups]);

  useEffect(() => {
    if (!activeGroupLabel) return;
    setOpenGroups((prev) => {
      if (prev?.[activeGroupLabel] === true) return prev;
      return { ...prev, [activeGroupLabel]: true };
    });
  }, [activeGroupLabel]);

  const toggle = () => setCollapsed((v) => !v);

  function resolveIcon(icon) {
    return typeof icon === "string"
      ? sidebarIconMap[icon] || LayoutDashboard
      : icon || LayoutDashboard;
  }

  return (
    <aside
      className={cx(
        "shrink-0 border-r border-slate-200 bg-white",
        "h-screen sticky top-0",
        "transition-[width] duration-200 ease-in-out",
        "flex flex-col",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className="h-[84px] shrink-0 border-b border-slate-200 px-4 flex items-center">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            {collapsed ? (
              <button
                type="button"
                onClick={toggle}
                className="flex items-center gap-3 rounded-2xl focus:outline-none"
                title="Expand"
                aria-label="Expand sidebar"
              >
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
                  <img src={HeaderLogo} alt="Pietyl LPG" className="h-7 w-7 object-contain" />
                </div>
              </button>
            ) : (
              <Link href={homeHref} className="flex items-center gap-3 rounded-2xl focus:outline-none" title="Home">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
                  <img src={HeaderLogo} alt="Pietyl LPG" className="h-7 w-7 object-contain" />
                </div>

                <div className="min-w-0 text-left">
                  <div className="text-sm font-extrabold text-slate-900 truncate">{title}</div>
                  <div className="text-xs text-slate-500 truncate">{subtitle}</div>
                </div>
              </Link>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              onClick={toggle}
              className={cx(
                "rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50",
                "transition-[transform,background-color] duration-200 ease-in-out",
                "active:scale-[0.98]",
                "focus:outline-none"
              )}
              aria-label="Collapse sidebar"
              title="Collapse"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className={cx("flex-1 px-2 py-4", flattenItems(navItems).length > 10 ? "overflow-y-auto" : "overflow-y-hidden")}>
        <nav className="space-y-2">
          {navItems.map((it, idx) => {
            if (!it) return null;

            if (it.type === "group" && Array.isArray(it.items)) {
              const label = it.label || `Group ${idx + 1}`;
              const open = openGroups?.[label] !== false;

              if (collapsed) {
                return (
                  <div key={`g-${label}`} className="space-y-1">
                    {it.items.map((item) => {
                      if (!item?.href) return null;
                      const Icon = resolveIcon(item.icon);
                      const active = activeHref ? normalize(item.href) === normalize(activeHref) : false;

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
                  </div>
                );
              }

              return (
                <div key={`g-${label}`} className="space-y-1">
                  <GroupHeader
                    label={label}
                    open={open}
                    onToggle={() => setOpenGroups((p) => ({ ...p, [label]: !open }))}
                  />

                  <div
                    className={cx(
                      "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
                      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden space-y-1">
                      {it.items.map((item) => {
                        if (!item?.href) return null;
                        const Icon = resolveIcon(item.icon);
                        const active = activeHref ? normalize(item.href) === normalize(activeHref) : false;

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
                    </div>
                  </div>
                </div>
              );
            }

            const Icon = resolveIcon(it.icon);
            const active = activeHref ? normalize(it.href) === normalize(activeHref) : false;

            return (
              <SideItem
                key={it.href}
                href={it.href}
                label={it.label}
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