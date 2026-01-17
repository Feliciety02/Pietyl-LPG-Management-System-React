import React from "react";
import GlassCard from "../../components/ui/GlassCard";
import { Flame, Truck, BarChart3, ShieldCheck, Tags, CheckCircle2 } from "lucide-react";

// swap these with your real images
import RefillImg from "../../../images/services-refill.png";
import DeliveryImg from "../../../images/services-delivery.png";
import InventoryImg from "../../../images/services-inventory.png";

function Feature({ text }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-white/80 px-3 py-1.5 text-xs font-semibold text-slate-800">
      <CheckCircle2 className="h-4 w-4 text-teal-700" />
      {text}
    </div>
  );
}

function ServiceCard({ title, desc, bullets, image, alt, icon: Icon, tint = "teal" }) {
  const tintClasses =
    tint === "teal"
      ? "from-teal-500/15 via-transparent to-cyan-500/15"
      : tint === "cyan"
      ? "from-cyan-500/15 via-transparent to-teal-500/15"
      : "from-emerald-500/15 via-transparent to-teal-500/15";

  const iconBg =
    tint === "teal"
      ? "bg-teal-600/10 border-teal-600/15 text-teal-700"
      : tint === "cyan"
      ? "bg-cyan-600/10 border-cyan-600/15 text-cyan-700"
      : "bg-emerald-600/10 border-emerald-600/15 text-emerald-700";

  return (
    <GlassCard className="relative p-7 sm:p-8 overflow-hidden group">
      {/* subtle animated gradient wash */}

      {/* top image */}
      <div className="relative rounded-2xl overflow-hidden border border-white/70 bg-white/40">
        <img
          src={image}
          alt={alt}
          className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent" />

        {/* icon badge */}
        <div className="absolute left-4 top-4">
          <div className={`grid h-11 w-11 place-items-center rounded-2xl border ${iconBg} bg-white/70 backdrop-blur`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* content */}
      <div className="mt-5">
        <div className="text-lg font-extrabold tracking-tight text-slate-900 capitalize">
          {title}
        </div>
        <p className="mt-2 text-sm text-slate-700/90 leading-relaxed">
          {desc}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {bullets.map((b) => (
            <Feature key={b} text={b} />
          ))}
        </div>
      </div>

      {/* hover lift */}
      <div className="absolute inset-0 rounded-[1.75rem] transition-transform duration-300 group-hover:-translate-y-0.5" />
    </GlassCard>
  );
}

export default function ServicesSection() {
  const services = [
    {
      title: "refill and swap",
      desc: "Track refills, swaps, deposits, and returns with clean, consistent records across shifts.",
      bullets: ["deposit tracking", "return history", "customer notes"],
      image: RefillImg,
      alt: "LPG refill and swap service",
      icon: Flame,
      tint: "teal",
    },
    {
      title: "delivery operations",
      desc: "Assign riders, manage zones, and keep delivery status updates visible to the team.",
      bullets: ["delivery zones", "status updates", "rider assignment"],
      image: DeliveryImg,
      alt: "LPG delivery operations",
      icon: Truck,
      tint: "cyan",
    },
    {
      title: "inventory and reporting",
      desc: "Monitor availability, movement, and replenishment using logs and summaries.",
      bullets: ["stock counts", "movement logs", "low stock readiness"],
      image: InventoryImg,
      alt: "Inventory and reporting dashboard",
      icon: BarChart3,
      tint: "emerald",
    },
  ];

  return (
    <section id="services" className="relative overflow-hidden">
      {/* cool but still clean background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-teal-50/70" />
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full blur-3xl bg-teal-300/20 pietyl-bg-float" />
        <div className="absolute top-12 right-[-12rem] h-[30rem] w-[30rem] rounded-full blur-3xl bg-cyan-300/18 pietyl-bg-float delay-2000" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-white/70 border border-white/80 px-4 py-2 text-xs font-extrabold tracking-[0.18em] text-teal-900">
            SERVICES
          </div>

          <h2 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            tools that keep operations fast and consistent
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-700/90 leading-relaxed">
            Built around LPG store workflows so staff can move quickly, keep records clean, and stay accountable.
          </p>
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-6 items-stretch">
          {services.map((s) => (
            <div key={s.title} className="hover:-translate-y-0.5 transition-transform duration-300">
              <ServiceCard {...s} />
            </div>
          ))}
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          <GlassCard className="p-7 sm:p-8 overflow-hidden group hover:-translate-y-0.5 transition-transform">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-600/10 border border-teal-600/15">
                <Tags className="h-5 w-5 text-teal-700" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900">configurable brands catalog</div>
                <p className="mt-2 text-sm text-slate-700/90 leading-relaxed">
                  Add the brands your store carries, including local suppliers. These are configurable catalog items and do not imply affiliation.
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-7 sm:p-8 overflow-hidden group hover:-translate-y-0.5 transition-transform">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-600/10 border border-cyan-600/15">
                <ShieldCheck className="h-5 w-5 text-cyan-700" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900">roles and audit logs</div>
                <p className="mt-2 text-sm text-slate-700/90 leading-relaxed">
                  Employee linked accounts, role based screens, and audit logs for strong accountability and traceability.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
