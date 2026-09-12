"use client";

import { ReactNode, useEffect, useRef } from "react";

/**
 * Modal a11y: role=dialog + aria-modal, Escape menutup, fokus dipindahkan ke
 * dalam modal saat dibuka (auto-focus tombol pertama), focus-trap sederhana
 * (Tab/Shift+Tab berputar di dalam modal), fokus kembali ke pemicu saat tutup.
 * Body scroll dikunci saat modal terbuka.
 */
export default function Modal({
  label,
  onClose,
  children,
  position = "center",
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
  position?: "center" | "bottom";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  // buka: simpan fokus pemicu, kunci scroll, fokuskan panel
  useEffect(() => {
    openerRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // tunggu satu frame agar panel ter-render sebelum fokus
    requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.body.style.overflow = prevOverflow;
      (openerRef.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  // Escape menutup modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // focus-trap: Tab di elemen terakhir → kembali ke pertama (dan sebaliknya)
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className={`fixed inset-0 z-50 flex justify-center bg-slate-900/60 p-4 ${
        position === "bottom" ? "items-end sm:items-center" : "items-center"
      }`}
      onKeyDown={onKeyDown}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl outline-none"
      >
        {children}
      </div>
    </div>
  );
}
