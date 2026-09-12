"use client";

import dynamicImport from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { PresenceContext } from "@/components/PresenceContext";
import { RouteProvider } from "@/components/RouteContext";
import { LiveLocationProvider } from "@/components/LiveLocationContext";
import { MapFiltersProvider } from "@/components/MapFiltersContext";
import CheckInButton from "@/components/CheckInButton";
import SOSButton from "@/components/SOSButton";
import LoginGate from "@/components/LoginGate";

const LiveMap = dynamicImport(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[70dvh] bg-slate-100"
      role="status"
      aria-label="Memuat peta"
    >
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-md space-y-3 px-6">
          <div className="mx-auto h-16 w-16 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-3 w-3/4 animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  const { user, loading } = useAuth();
  const presence = usePresence();

  return (
    <PresenceContext.Provider value={presence}>
      <LiveLocationProvider>
        <MapFiltersProvider>
          <RouteProvider>
            <main className="relative">
            <div className="h-[72dvh] md:h-[78dvh]">
              <LiveMap />
            </div>

          {/* Hero singkat di atas peta untuk konteks juri/guest */}
          {!user && !loading && (
            <section className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-4">
              <div className="pointer-events-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                <h1 className="text-lg font-extrabold text-slate-900">
                  RUAN — Rute Aman Bekasi
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Platform keselamatan perkotaan berbasis komunikasi: lihat
                  keramaian warga (crowd beacon), info bahaya terverifikasi,
                  dan bantuan terdekat — real-time, untuk semua warga
                  termasuk lansia dan penyandang disabilitas.
                </p>
              </div>
            </section>
          )}

          {/* Bar aksi di bawah peta (ruang kosong) — bukan overlay di atas peta */}
          {user ? (
            <div className="flex w-full max-w-md items-center justify-between gap-3 px-4 py-3 mx-auto">
              <CheckInButton />
              <SOSButton />
            </div>
          ) : null}

          {!user && !loading && <LoginGate />}
          </main>
        </RouteProvider>
        </MapFiltersProvider>
      </LiveLocationProvider>
    </PresenceContext.Provider>
  );
}
