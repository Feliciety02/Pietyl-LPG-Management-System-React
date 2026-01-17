     
import React from "react";
import { Link } from "@inertiajs/react";
export default function Footer({ onSignInClick  }) {
    return (
        <>
     
     <footer className="border-t border-white/30 bg-white/30 backdrop-blur-2xl backdrop-saturate-150">
        <div className="max-w-6xl mx-auto px-6 py-2.5">
          <div className="flex items-center justify-center text-[11px] text-slate-600/90 gap-2">
            <div className="h-5 w-5 rounded-md bg-teal-600 flex items-center justify-center text-white font-bold text-[10px] shadow-sm shadow-teal-600/20">
              P
            </div>
            <span>© 2026 PIETYL. All rights reserved.</span>
          </div>
        </div>
      </footer>
       </>
    );
}