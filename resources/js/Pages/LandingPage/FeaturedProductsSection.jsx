import React, { useMemo, useRef } from "react";
import GlassCard from "../../components/ui/GlassCard";

import Cylinder11 from "../../../images/LPGproducts/Petron_11kg.png";
import Cylinder50 from "../../../images/LPGproducts/Petron_50kg.png";
import Cylinder22 from "../../../images/LPGproducts/Petron_22kg.png";
import Regulator from "../../../images/LPGproducts/Regulator_TokinaBlue.png";
import Hose from "../../../images/LPGproducts/Hose_10mBlack.png";

function formatPeso(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function ScrollButton({ dir = "left", onClick }) {
  const isLeft = dir === "left";
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden md:inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-white/70 border border-white/80 text-slate-800 hover:bg-white/90 transition shadow-sm"
      aria-label={isLeft ? "Scroll left" : "Scroll right"}
    >
      <span className="text-lg font-extrabold">{isLeft ? "‹" : "›"}</span>
    </button>
  );
}

export default function FeaturedProductsSection({ onScrollTo }) {
  const scrollerRef = useRef(null);

  const items = useMemo(
    () => [
      {
        title: "Petron LPG Cylinder 11 kg",
        tag: "Most common",
        desc: "Refill, swap, or delivery option for households.",
        image: Cylinder11,
        price: 950,
        priceNote: "Typical refill estimate",
      },
      {
        title: "Petron LPG Cylinder 22 kg",
        tag: "Household",
        desc: "Larger household option with longer usage.",
        image: Cylinder22,
        price: 1850,
        priceNote: "Typical refill estimate",
      },
      {
        title: "Petron LPG Cylinder 50 kg",
        tag: "Industrial",
        desc: "For restaurants and high volume operations.",
        image: Cylinder50,
        price: 4200,
        priceNote: "Typical refill estimate",
      },
      {
        title: "Tokina Regulator",
        tag: "Accessory",
        desc: "Safety regulator replacement and upgrade.",
        image: Regulator,
        price: 350,
        priceNote: "Typical retail estimate",
      },
      {
        title: "Black 10 m Hose with Clamp",
        tag: "Accessory",
        desc: "For installation and replacement use.",
        image: Hose,
        price: 280,
        priceNote: "Typical retail estimate",
      },
    ],
    []
  );

  function scrollByCards(direction) {
    const el = scrollerRef.current;
    if (!el) return;

    const card = el.querySelector("[data-card]");
    const cardWidth = card ? card.getBoundingClientRect().width : 340;
    const gap = 20;
    const delta = direction === "left" ? -(cardWidth + gap) : cardWidth + gap;

    el.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <section id="products" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-teal-50/60" />

      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        {/* centered header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-white/70 border border-white/80 px-4 py-2 text-xs font-extrabold tracking-[0.18em] text-teal-900">
            FEATURED PRODUCTS
          </div>

          <h2 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            customer favorites and essentials
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-700/90 leading-relaxed">
            Prices below are practical sample estimates. Final pricing depends on your store rate and location.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onScrollTo?.("contact")}
              className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm shadow-teal-600/25 hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/30"
            >
              request pricing
            </button>

            <button
              type="button"
              onClick={() => onScrollTo?.("contact")}
              className="inline-flex items-center justify-center rounded-xl bg-white/70 border border-white/80 px-5 py-3 text-sm font-extrabold text-teal-900 hover:bg-white/90 transition shadow-sm"
            >
              inquire now
            </button>
          </div>
        </div>

        {/* carousel controls */}
        <div className="mt-10 flex items-center justify-between">
          <div className="text-sm font-extrabold text-slate-900">browse products</div>
          <div className="flex items-center gap-2">
            <ScrollButton dir="left" onClick={() => scrollByCards("left")} />
            <ScrollButton dir="right" onClick={() => scrollByCards("right")} />
          </div>
        </div>

        {/* fade edges */}
        <div className="relative mt-4">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-slate-50/90 via-slate-50/60 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-slate-50/90 via-slate-50/60 to-transparent z-10" />

          <div
            ref={scrollerRef}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:none]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {items.map((p) => (
              <div
                key={p.title}
                data-card
                className="min-w-[280px] sm:min-w-[340px] snap-start"
              >
                <GlassCard className="p-6 h-full flex flex-col overflow-hidden hover:-translate-y-0.5 transition-transform">
                  {/* image */}
                  <div className="relative rounded-2xl overflow-hidden border border-white/70 bg-white/40">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent" />
                    <img
                      src={p.image}
                      alt={p.title}
                      className="h-44 w-full object-contain p-5 transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute left-4 top-4">
                      <span className="text-[11px] font-extrabold text-teal-900 bg-white/75 border border-white/80 rounded-full px-3 py-1">
                        {p.tag}
                      </span>
                    </div>
                  </div>

                  {/* content */}
                  <div className="mt-4">
                    <div className="text-base font-extrabold text-slate-900">{p.title}</div>
                    <p className="mt-2 text-sm text-slate-700/90 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>

                  {/* price */}
                  <div className="mt-4 rounded-2xl bg-white/60 border border-white/80 p-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-slate-700/90">estimated price</div>
                        <div className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                          {formatPeso(p.price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-teal-900">note</div>
                        <div className="mt-1 text-xs text-slate-700/90">{p.priceNote}</div>
                      </div>
                    </div>
                  </div>

                  {/* action */}
                  <button
                    type="button"
                    onClick={() => onScrollTo?.("contact")}
                    className="mt-4 w-full inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm shadow-teal-600/25 hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/30"
                  >
                    inquire
                  </button>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-600/80">
          tip: scroll horizontally to view more items
        </div>
      </div>
    </section>
  );
}
