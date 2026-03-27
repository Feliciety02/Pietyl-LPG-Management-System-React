import React, { useMemo } from "react";
import { Link, usePage } from "@inertiajs/react";
import { ArrowRight, KeyRound, ScrollText, ShieldCheck, SlidersHorizontal, Tag, WalletCards } from "lucide-react";
import Layout from "../Dashboard/Layout";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SettingCard({ title, description, href, Icon, tone = "teal", badge = null }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700 ring-teal-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
  };

  return (
    <Link
      href={href}
      className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={cx("flex h-12 w-12 items-center justify-center rounded-2xl ring-1", tones[tone] || tones.teal)}>
          <Icon className="h-6 w-6" />
        </div>
        {badge ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-teal-700">
        Open setting
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export default function Settings() {
  const page = usePage();
  const user = page.props?.auth?.user || null;
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const permissionSet = useMemo(() => new Set(permissions), [permissions]);
  const can = (permission) => !permission || permissionSet.has(permission);

  const cards = [
    {
      title: "Multi-factor Authentication",
      description: "Manage authenticator-based MFA for this account and enforce safer sign-in for privileged access.",
      href: "/security/two-factor",
      icon: ShieldCheck,
      tone: "amber",
      badge: user?.two_factor_enabled ? "Enabled" : "Required",
    },
    {
      title: "Password Security",
      description: "Update your password, review password rules, and resolve any forced password-change requirements.",
      href: "/security/password",
      icon: KeyRound,
      tone: "teal",
      badge: user?.must_change_password ? "Action needed" : null,
    },
    {
      title: "VAT Settings",
      description: "Configure VAT application rules that affect sales processing and reporting output.",
      href: "/dashboard/admin/settings/vat",
      icon: WalletCards,
      tone: "slate",
      permission: "admin.settings.manage",
    },
    {
      title: "Promos & Vouchers",
      description: "Control promotional campaigns, voucher availability, and related manager approval settings.",
      href: "/dashboard/admin/promos",
      icon: Tag,
      tone: "slate",
      permission: "admin.promos.view",
    },
    {
      title: "Audit Logs",
      description: "Inspect security and operational audit records for access reviews, investigations, and monitoring.",
      href: "/dashboard/admin/audit",
      icon: ScrollText,
      tone: "slate",
      permission: "admin.audit.view",
    },
    {
      title: "Reports",
      description: "Access reporting screens used for operational review, cost tracking, and administrative oversight.",
      href: "/dashboard/admin/reports",
      icon: SlidersHorizontal,
      tone: "slate",
      permission: "admin.reports.view",
    },
  ].filter((card) => can(card.permission));

  return (
    <Layout title="Settings">
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="text-sm font-extrabold uppercase tracking-[0.2em] text-teal-700">Admin Settings</div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">System configuration and security controls</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Centralize account security, business configuration, monitoring, and administrative features in one place
                so system-critical settings are easier to review and maintain.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-3 text-right ring-1 ring-slate-200">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Signed in</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">{user?.email}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <SettingCard
              key={card.href}
              title={card.title}
              description={card.description}
              href={card.href}
              Icon={card.icon}
              tone={card.tone}
              badge={card.badge}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
