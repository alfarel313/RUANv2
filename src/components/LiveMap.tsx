"use client";

import { useState } from "react";
import MapShell from "@/components/MapShell";
import BeaconLayer from "@/components/BeaconLayer";
import PlaceLayer from "@/components/PlaceLayer";
import RouteLayer from "@/components/RouteLayer";
import ReportLayer from "@/components/ReportLayer";
import UserLocationLayer from "@/components/UserLocationLayer";
import MapFilterControl from "@/components/MapFilterControl";
import FocusLocationButton from "@/components/FocusLocationButton";
import { usePresenceCtx } from "@/components/PresenceContext";
import { useRouteCtx } from "@/components/RouteContext";
import { useMapFilters } from "@/components/MapFiltersContext";
import InfoDot from "@/components/InfoDot";
import { formatDistance } from "@/lib/geo";
import { Navigation, X } from "lucide-react";

/** Kartu ringkas rute aktif — mengambang di atas peta (turun bila filter aktif) */
function RouteCard({ pushedDown }: { pushedDown: boolean }) {
  const { route, toggleCompare, clearRoute } = useRouteCtx();
  if (!route) return null;
  const { result, destName } = route;
  const faster = result.chosen !== result.fastest;
  return (
    <div
      className={`pointer-events-auto absolute inset-x-3 z-[500] mx-auto max-w-md rounded-2xl border-2 border-brand bg-white/97 p-3 shadow-xl backdrop-blur transition-top duration-200 ${
        pushedDown ? "top-16" : "top-3"
      }`}
    >
      {/* Kartu rute SENGAJA tetap putih di Mode Malam (di atas peta terang);
          teks dipaksa gelap (!important) agar mengalahkan override global text-slate-* */}
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand!">
        <Navigation aria-hidden="true" className="h-4 w-4" />
        Rute Aman ke {destName}{" "}
        <InfoDot text="Dari beberapa kandidat rute tercepat, sistem memilih rute yang menjauh dari laporan bahaya terverifikasi dalam radius 75 m dari jalur. Biayanya: sedikit lebih lama (dihitung dalam menit) demi keamanan." />
      </p>
      <p className="mt-0.5 text-lg font-extrabold leading-tight text-slate-900!">
        {formatDistance(result.chosen.distanceM)}
        <span className="ml-2 text-sm font-semibold text-slate-600!">
          ± {Math.max(1, Math.round(result.chosen.durationS / 60))} menit jalan kaki
        </span>
      </p>
      <p className="mt-1 text-sm font-medium text-slate-700!">{result.reasonText}</p>
      <div className="mt-2 flex gap-2">
        {faster && (
          <button
            onClick={toggleCompare}
            className="min-h-[44px] flex-1 rounded-xl border-2 border-slate-200! text-xs font-bold text-slate-700! hover:bg-slate-50!"
          >
            {route.showCompare ? "Sembunyikan perbandingan" : "Bandingkan rute"}
          </button>
        )}
        <button
          onClick={clearRoute}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand text-xs font-bold text-white hover:bg-brand-dark"
        >
          <X aria-hidden="true" className="h-4 w-4" /> Tutup rute
        </button>
      </div>
    </div>
  );
}

export default function LiveMap() {
  const { beacons } = usePresenceCtx();
  const { filters } = useMapFilters();
  const { route } = useRouteCtx();
  const [now] = useState(() => Date.now());
  const [follow, setFollow] = useState(true); // dimatikan otomatis saat user geser peta

  // RouteCard turun bila kartu rute & kontrol filter sama-sama menempati atas peta
  const pushedDown = route != null;

  return (
    <MapShell>
      {filters.showBeacons && <BeaconLayer beacons={beacons} />}
      <PlaceLayer />
      <ReportLayer now={now} />
      <RouteLayer />
      <UserLocationLayer follow={follow} onFollow={setFollow} />
      <MapFilterControl />
      <FocusLocationButton follow={follow} onFollow={setFollow} />
      <RouteCard pushedDown={pushedDown} />
    </MapShell>
  );
}
