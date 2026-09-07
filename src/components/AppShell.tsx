"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/firebase";

const NAV = [
  { href: "/", label: "Peta", icon: "🗺️" },
  { href: "/bahaya", label: "Info Bahaya", icon: "⚠️" },
  { href: "/lapor", label: "Lapor", icon: "📢" },
  { href: "/panduan", label: "Panduan", icon: "🛡️" },
  { href: "/akun", label: "Akun", icon: "👤" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, userData } = useAuth();
  const pathname = usePathname();

  // Terapkan preferensi aksesibilitas ke <html>
  useEffect(() => {
    const root = document.documentElement;
    const apply = (large: boolean, contrast: boolean) => {
      root.classList.toggle("ruan-large-text", large);
      root.classList.toggle("ruan-high-contrast", contrast);
    };
    if (userData) {
      apply(userData.settings.largeText, userData.settings.highContrast);
    } else {
      // guest: localStorage
      try {
        apply(
          localStorage.getItem("ruan-large-text") === "1",
          localStorage.getItem("ruan-high-contrast") === "1"
        );
      } catch {
        /* ignore */
      }
    }
  }, [userData]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg py-1"
            aria-label="RUAN Rute Aman — kembali ke peta"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white"
            >
              R
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                RUAN
              </span>
              <span className="text-xs font-medium text-brand">
                Rute Aman · Bekasi
              </span>
            </span>
          </Link>

          <nav aria-label="Navigasi utama" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={pathname === n.href ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      pathname === n.href
                        ? "bg-brand text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span aria-hidden="true">{n.icon}</span> {n.label}
                  </Link>
                </li>
              ))}
              {userData?.role === "admin" && (
                <li>
                  <Link
                    href="/admin"
                    aria-current={pathname === "/admin" ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      pathname === "/admin"
                        ? "bg-amber text-white"
                        : "text-amber hover:bg-amber/10"
                    }`}
                  >
                    <span aria-hidden="true">🛠️</span> Admin
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={() => logout()}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Keluar
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      {/* Bottom nav mobile (target sentuh ≥48px) */}
      <nav
        aria-label="Navigasi bawah"
        className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={pathname === n.href ? "page" : undefined}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold ${
                  pathname === n.href ? "text-brand" : "text-slate-600"
                }`}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {n.icon}
                </span>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
