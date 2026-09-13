"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonList } from "@/components/Skeleton";
import { ChevronLeft, ShieldCheck, Wrench } from "lucide-react";

/**
 * Kerangka bersama 3 halaman admin (gate + heading + tab nav).
 * - loading → skeleton; guest/non-admin → gate penjelasan; admin → children.
 * - SATU guard untuk semua route admin — jangan copy-paste per page.
 */
export default function AdminShell({
  children,
  description,
}: {
  children: React.ReactNode;
  description: string;
}) {
  const { user, userData, loading } = useAuth();
  const pathname = usePathname();
  const isAdmin = userData?.role === "admin";

  const TABS = [
    { href: "/admin", label: "Verifikasi", match: (p: string) => p === "/admin" },
    {
      href: "/admin/riwayat",
      label: "Riwayat",
      match: (p: string) => p.startsWith("/admin/riwayat"),
    },
    {
      href: "/admin/tempat",
      label: "Tempat Aman",
      match: (p: string) => p.startsWith("/admin/tempat"),
    },
  ];

  let content: React.ReactNode;
  if (loading) {
    content = <SkeletonList label="Memuat panel admin" count={3} />;
  } else if (!user || !isAdmin) {
    content = (
      <div className="mt-4 rounded-2xl border-2 border-amber bg-white p-6 text-center shadow">
        <p className="text-sm font-semibold text-slate-700">
          Halaman ini khusus admin Kota Bekasi. Masuk dengan akun admin
          (alfarel3134@gmail.com) untuk mengelola laporan dan tempat aman.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex min-h-[48px] items-center gap-1.5 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" /> Kembali ke Peta
        </Link>
      </div>
    );
  } else {
    content = children;
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
        <Wrench aria-hidden="true" className="h-7 w-7" /> Panel Admin — Kota
        Bekasi
      </h1>
      <p className="mt-1 text-sm text-slate-600">{description}</p>

      {/* Tab nav admin — hanya tampil setelah gate lolos */}
      {isAdmin && !loading && (
        <nav
          aria-label="Bagian panel admin"
          className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
        >
          {TABS.map((t) => {
            const active = t.match(pathname);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-extrabold transition-colors ${
                  active
                    ? "bg-brand text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.href === "/admin" && (
                  <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                )}
                {t.label}
              </Link>
            );
          })}
        </nav>
      )}

      <div className="mt-4">{content}</div>
    </main>
  );
}
