"use client";

import MapShell from "@/components/MapShell";
import BeaconLayer from "@/components/BeaconLayer";
import PlaceLayer from "@/components/PlaceLayer";
import RouteLayer from "@/components/RouteLayer";
import UserLocationLayer from "@/components/UserLocationLayer";
import { usePresenceCtx } from "@/components/PresenceContext";
import { useRouteCtx } from "@/components/RouteContext";
import { formatDistance } from "@/lib/geo";

/** Kartu ringkas rute aktif — mengambang di atas peta */
function RouteCard() {
  const { route, toggleCompare, clearRoute } = useRouteCtx();
  if (!route) return null;
  const { result, destName } = route;
  const faster = result.chosen !== result.fastest;
  return (
    <div className="pointer-events-auto absolute inset-x-3 top-3 z-[500] mx-auto max-w-md rounded-2xl border-2 border-brand bg-white/97 p-3 shadow-xl backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-wide text-brand">
        🧭 Rute Aman ke {destName}
      </p>
      <p className="mt-0.5 text-lg font-extrabold leading-tight text-slate-900">
        {formatDistance(result.chosen.distanceM)}
        <span className="ml-2 text-sm font-semibold text-slate-600">
          ± {Math.max(1, Math.round(result.chosen.durationS / 60))} menit jalan kaki
        </span>
      </p>
      <p className="mt-1 text-sm font-medium text-slate-700">{result.reasonText}</p>
      <div className="mt-2 flex gap-2">
        {faster && (
          <button
            onClick={toggleCompare}
            className="min-h-[44px] flex-1 rounded-xl border-2 border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            {route.showCompare ? "Sembunyikan perbandingan" : "Bandingkan rute"}
          </button>
        )}
        <button
          onClick={clearRoute}
          className="min-h-[44px] flex-1 rounded-xl bg-brand text-xs font-bold text-white hover:bg-brand-dark"
        >
          Tutup rute
        </button>
      </div>
    </div>
  );
}

export default function LiveMap() {
  const { beacons } = usePresenceCtx();
  return (
    <MapShell>
      <PlaceLayer />
      <BeaconLayer beacons={beacons} />
      <RouteLayer />
      <UserLocationLayer />
      <RouteCard />
    </MapShell>
  );
}
