import React from "react";
import { Link } from "@inertiajs/react";

export default function NavItem({ label, href = "#", active, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        "group relative flex flex-col items-center gap-1",
        "text-sm font-semibold transition-colors duration-300",
        active
          ? "text-teal-800 font-extrabold"
          : "text-slate-700 hover:text-teal-800",
      ].join(" ")}
    >
      <span>{label}</span>

      <span
        className={[
          "h-[2px] w-full rounded-full bg-teal-600",
          "origin-left transition-transform duration-300",
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
        ].join(" ")}
      />
    </Link>
  );
}
