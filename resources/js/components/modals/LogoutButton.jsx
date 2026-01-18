import React from "react";
import { router } from "@inertiajs/react";

export default function LogoutButton({ className = "" }) {
  const handleLogout = (e) => {
    e.preventDefault();
    router.post('/logout');
  };

  return (
    <button
      onClick={handleLogout}
      className={
        className ||
        "w-full rounded-2xl bg-white/70 border border-white/80 px-4 py-2.5 text-sm font-extrabold text-slate-900 hover:bg-white transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
      }
    >
      Sign out
    </button>
  );
}