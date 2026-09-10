"use client";

import { useState } from "react";

/**
 * Titik "?" penjelasan kontekstual — hover di desktop, tap di HP.
 * Tooltip hitam kecil ala Leaflet, tertutup-ketuk-luar tidak perlu
 * (tooltip kecil & sekali baca; blur/tap-lain otomatis menutup).
 */
export default function InfoDot({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={`Info: ${text}`}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-400 bg-slate-100 text-[10px] font-extrabold text-slate-600 hover:bg-slate-200"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-[700] mb-1.5 w-52 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-left text-[11px] font-medium leading-snug text-white shadow-xl"
        >
          {text}
        </span>
      )}
    </span>
  );
}
