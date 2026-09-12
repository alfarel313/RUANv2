"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map as MapIcon, Megaphone, ShieldAlert, ShieldCheck, UserRound, Wrench } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/firebase";

const NAV = [
  { href: "/", label: "Peta", short: "Peta", Icon: MapIcon },
  { href: "/bahaya", label: "Info Bahaya", short: "Bahaya", Icon: ShieldAlert },
  { href: "/lapor", label: "Lapor", short: "Lapor", Icon: Megaphone },
  { href: "/panduan", label: "Panduan", short: "Panduan", Icon: ShieldCheck },
  { href: "/akun", label: "Akun", short: "Akun", Icon: UserRound },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, userData } = useAuth();
  const pathname = usePathname();
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Terapkan preferensi aksesibilitas ke <html>
  useEffect(() => {
    const root = document.documentElement;
    const apply = (large: boolean, dark: boolean) => {
      root.classList.toggle("ruan-large-text", large);
      root.classList.toggle("ruan-dark", dark);
    };
    if (userData) {
      apply(userData.settings.largeText, userData.settings.darkMode);
    } else {
      // guest: localStorage
      try {
        apply(
          localStorage.getItem("ruan-large-text") === "1",
          localStorage.getItem("ruan-dark") === "1"
        );
      } catch {
        /* ignore */
      }
    }
  }, [userData]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#konten-utama" className="skip-link">
        Lewati ke konten utama
      </a>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg py-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-96.png"
              alt="Logo RUAN Rute Aman"
              className="h-9 w-9 rounded-xl object-cover"
            />
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
                    <n.Icon aria-hidden="true" className="h-4 w-4" /> {n.label}
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
                    <Wrench aria-hidden="true" className="h-4 w-4" /> Admin
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {user && !confirmLogout && (
              <button
                onClick={() => setConfirmLogout(true)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Keluar
              </button>
            )}
            {user && confirmLogout && (
              <span
                role="alertdialog"
                aria-label="Konfirmasi keluar akun"
                className="flex items-center gap-1.5"
              >
                <span className="hidden text-xs font-bold text-slate-600 sm:inline">
                  Keluar?
                </span>
                <button
                  onClick={() => logout()}
                  className="rounded-lg bg-sos px-3 py-2 text-xs font-bold text-white hover:bg-sos-dark"
                >
                  Ya
                </button>
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1">
        <div id="konten-utama" className="contents">
          {children}
        </div>
      </div>

      {/* Bottom nav mobile (target sentuh ≥48px) */}
      <nav
        aria-label="Navigasi bawah"
        className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      >
        <ul className={userData?.role === "admin" ? "grid grid-cols-6" : "grid grid-cols-5"}>
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={pathname === n.href ? "page" : undefined}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold ${
                  pathname === n.href ? "text-brand" : "text-slate-600"
                }`}
              >
                <n.Icon aria-hidden="true" className="h-5 w-5" />
                {n.short}
              </Link>
            </li>
          ))}
          {userData?.role === "admin" && (
            <li>
              <Link
                href="/admin"
                aria-current={pathname === "/admin" ? "page" : undefined}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold ${
                  pathname === "/admin" ? "text-amber" : "text-amber hover:bg-amber/10"
                }`}
              >
                <Wrench aria-hidden="true" className="h-5 w-5" />
                Admin
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
