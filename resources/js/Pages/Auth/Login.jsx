import React from "react";
import { router } from "@inertiajs/react";
import LoginModal from "@/components/modals/LoginModal";

export default function Login() {
  return (
    <div className="min-h-screen bg-slate-50">
      <LoginModal open onClose={() => router.visit("/")} />
    </div>
  );
}
