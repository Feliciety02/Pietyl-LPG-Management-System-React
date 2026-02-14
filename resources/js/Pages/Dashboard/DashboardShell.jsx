// resources/js/components/layouts/DashboardShell.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import { motion } from "framer-motion";
import HeaderLogo from "../../../images/Header_Logo.png";
import { Search, Bell, ChevronRight, Command } from "lucide-react";
import Sidebar from "../../components/layouts/Sidebar";
import ToastMessage from "../../components/layouts/ToastMessage";
import { ExportProvider } from "@/components/Table/ExportContext";
import ExportModal from "@/components/modals/ExportModal";

function normalize(u = "") {
  return String(u).split("?")[0];
}

function titleCase(s = "") {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildCrumbs(url = "") {
  const parts = normalize(url).split("/").filter(Boolean);
  const dashboardIdx = parts.indexOf("dashboard");
  if (dashboardIdx === -1) return [];

  const crumbParts = parts.slice(dashboardIdx + 1);
  const role = crumbParts[0] || "";
  const rest = crumbParts.slice(1);

  const crumbs = [{ label: "Dashboard", href: `/dashboard/${role || ""}`.replace(/\/$/, "") }];

  if (role) crumbs.push({ label: titleCase(role.replace(/-/g, " ")), href: `/dashboard/${role}` });

  let path = `/dashboard/${role}`;
  rest.forEach((seg) => {
    path += `/${seg}`;
    crumbs.push({ label: titleCase(seg.replace(/-/g, " ")), href: path });
  });

  return crumbs;
}

function AvatarChip({ name = "User" }) {
  const initials = String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");

  return (
    <div className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <div className="h-8 w-8 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 flex items-center justify-center">
        <span className="text-[11px] font-extrabold text-teal-800">{initials || "U"}</span>
      </div>
      <div className="text-sm font-semibold text-slate-900 truncate max-w-[160px]">{name}</div>
    </div>
  );
}

export default function DashboardShell({
  title = "Dashboard",
  sidebarTitle = "Dashboard",
  items = [],
  children,
}) {
  const page = usePage();
  const { auth } = page.props;
  const user = auth?.user;
  const url = page?.url || "";
  const baseUrl = normalize(url);

  const crumbs = useMemo(() => buildCrumbs(baseUrl), [baseUrl]);
  const roleBadge = user?.role ? titleCase(String(user.role).replace(/_/g, " ")) : "Role";

  const [q, setQ] = useState("");
  const [exportConfig, setExportConfig] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportValue = useMemo(
    () => ({ exportConfig, setExportConfig, exportOpen, setExportOpen }),
    [exportConfig, exportOpen]
  );

  useEffect(() => {
    if (!exportConfig && exportOpen) {
      setExportOpen(false);
    }
  }, [exportConfig, exportOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      <ToastMessage />
      <div className="flex">
        <Sidebar title={sidebarTitle} subtitle="Pietyl LPG" items={items} />

        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
            <div className="px-6 py-[16.8px]">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                   

                    <div className="min-w-0">
                      

                      
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="w-64 bg-transparent text-sm outline-none placeholder:text-slate-400"
                      placeholder="Search pages, customers, orders..."
                    />
                    <div className="ml-1 inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-extrabold text-slate-600">
                      <Command className="h-3.5 w-3.5" />
                      K
                    </div>
                  </div>

                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/20"
                    title="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                  </button>

                  <AvatarChip name={user?.name || "User"} />

                  <Link
                    as="button"
                    method="post"
                    href="/logout"
                    className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
                  >
                    Logout
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <motion.div
            key={baseUrl}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="p-6"
          >
            <ExportProvider value={exportValue}>
              {children}
              <ExportModal />
            </ExportProvider>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
