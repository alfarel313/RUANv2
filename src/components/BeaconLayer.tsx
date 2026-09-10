"use client";

import { useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { BeaconView } from "@/hooks/usePresence";
import { computeAndSetRoute, useRouteCtx } from "@/components/RouteContext";
import { useLiveLocationCtx } from "@/components/LiveLocationContext";
import { fetchAllReports } from "@/lib/reports";
import InfoDot from "@/components/InfoDot";

/** Sisa menit sebelum beacon dissolve (hitungan 2 menit sejak lowSince) */
function dissolveLeftText(lowSince: number | null | undefined): string | null {
  if (!lowSince) return null;
  const DISSOLVE_MS = 2 * 60 * 1000;
  const left = Math.ceil((lowSince + DISSOLVE_MS - Date.now()) / 60000);
  if (left <= 0) return "sebentar lagi";
  return `± ${left} menit lagi`;
}

function beaconIcon(count: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:44px;height:44px;">
        <div class="beacon-pulse" style="position:absolute;inset:0;border-radius:9999px;background:#14b8a6;"></div>
        <div style="position:absolute;inset:4px;border-radius:9999px;background:#0f766e;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,.3);border:2px solid #fff;">
          ${count}
        </div>
      </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -20],
  });
}

export default function BeaconLayer({
  beacons,
}: {
  beacons: BeaconView[];
}) {
  const { pos } = useLiveLocationCtx();
  const { setRoute, setLoading } = useRouteCtx();
  const [routing, setRouting] = useState(false);
  const [noLocation, setNoLocation] = useState(false);

  const routeTo = async (b: BeaconView) => {
    if (!pos) {
      setNoLocation(true); // jujur: tanpa titik awal, jangan karang rute
      return;
    }
    setNoLocation(false);
    setRouting(true);
    try {
      const reports = await fetchAllReports();
      await computeAndSetRoute(
        pos,
        { lat: b.lat, lng: b.lng },
        `Keramaian ${b.count} orang`,
        reports,
        setRoute,
        setLoading
      );
    } finally {
      setRouting(false);
    }
  };

  return (
    <>
      {beacons.map((b) => {
        const left = dissolveLeftText(b.lowSince);
        return (
          <Marker
            key={`${b.lat.toFixed(5)},${b.lng.toFixed(5)}`}
            position={[b.lat, b.lng]}
            icon={beaconIcon(b.count)}
            aria-label={`Keramaian ${b.count} orang aktif`}
          >
            <Popup>
              <strong>👥 {b.count} orang aktif</strong>{" "}
              <InfoDot text="Crowd beacon: keramaian warga yang sedang check-in di radius ±15 m. Terbentuk otomatis dari check-in warga (mode demo: 1 orang cukup). Jika semua orang berhenti check-in, beacon hilang setelah 2 menit." />
              <br />
              Keramaian terkonfirmasi warga (crowd beacon). Area ramai
              cenderung lebih aman.
              <br />
              {left ? (
                <span
                  role="status"
                  style={{ color: "#b45309", fontWeight: 700, fontSize: 12 }}
                >
                  ⏳ Orang mulai berkurang — beacon hilang {left}
                </span>
              ) : null}
              <br />
              {noLocation && (
                <span
                  role="alert"
                  style={{
                    display: "block",
                    marginTop: 6,
                    color: "#b91c1c",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  ⚠️ Lokasi Anda belum terdeteksi — izinkan akses lokasi lalu
                  coba lagi.
                </span>
              )}
              <button
                onClick={() => routeTo(b)}
                disabled={routing}
                style={{
                  marginTop: 6,
                  minHeight: 40,
                  width: "100%",
                  borderRadius: 10,
                  border: "2px solid #0f766e",
                  background: routing ? "#e6f2f1" : "#0f766e",
                  color: routing ? "#0f766e" : "#ffffff",
                  fontWeight: 700,
                  cursor: routing ? "wait" : "pointer",
                  fontSize: 13,
                }}
              >
                {routing ? "Menghitung rute…" : "🧭 Rute Aman ke sini"}
              </button>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
