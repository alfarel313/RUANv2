"use client";

import { useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { BeaconView } from "@/hooks/usePresence";
import { computeAndSetRoute, useRouteCtx } from "@/components/RouteContext";
import { useLiveLocationCtx } from "@/components/LiveLocationContext";
import { fetchAllReports } from "@/lib/reports";
import InfoDot from "@/components/InfoDot";
import { Navigation, Users } from "lucide-react";

/** Sisa menit sebelum beacon dissolve (hitungan 2 menit sejak lowSince) */
function dissolveLeftText(lowSince: number | null | undefined): string | null {
  if (!lowSince) return null;
  const DISSOLVE_MS = 2 * 60 * 1000;
  const left = Math.ceil((lowSince + DISSOLVE_MS - Date.now()) / 60000);
  if (left <= 0) return "sebentar lagi";
  return `± ${left} menit lagi`;
}

function beaconIcon(count: number): L.DivIcon {
  // count ≤ 0 = dissolving (0 orang, menunggu window 2 mnt): tampil pudar tanpa pulse
  const dissolving = count <= 0;
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:44px;height:44px;">
        <div class="beacon-pulse" style="position:absolute;inset:0;border-radius:9999px;background:${dissolving ? "#94a3b8" : "#14b8a6"};${dissolving ? "opacity:.45;" : ""}"></div>
        <div style="position:absolute;inset:4px;border-radius:9999px;background:${dissolving ? "#64748b" : "#0f766e"};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,.3);border:2px solid #fff;${dissolving ? "opacity:.75;" : ""}">
          ${dissolving ? "—" : count}
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
        // guard: dokumen beacon rusak (tanpa lat/lng — hasil race tulis-merge lawan
        // hapus antar klien) TIDAK boleh sampai ke Leaflet — Invalid LatLng mematikan seluruh peta
        if (
          typeof b.lat !== "number" ||
          typeof b.lng !== "number" ||
          Number.isNaN(b.lat) ||
          Number.isNaN(b.lng)
        ) {
          return null;
        }
        const left = dissolveLeftText(b.lowSince);
        const dissolving = b.count <= 0; // 0 orang — menunggu window dissolve habis
        return (
          <Marker
            key={b.id}
            position={[b.lat, b.lng]}
            icon={beaconIcon(Math.max(b.count, 0))}
            title={dissolving ? "Keramaian sudah bubar — beacon segera hilang" : `Keramaian ${b.count} orang aktif`}
            aria-label={dissolving ? "Keramaian sudah bubar — beacon segera hilang" : `Keramaian ${b.count} orang aktif`}
          >
            <Popup>
              <strong style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Users aria-hidden="true" width={14} height={14} />{" "}
                {dissolving ? "Keramaian sudah bubar" : `${b.count} orang aktif`}
              </strong>{" "}
              <InfoDot text="Crowd beacon: keramaian warga yang sedang check-in di radius ±15 m. Terbentuk otomatis dari check-in warga (mode demo: 1 orang cukup). Jika semua orang berhenti check-in, beacon hilang setelah 2 menit." />
              <br />
              {dissolving
                ? "Tidak ada orang yang check-in lagi di area ini."
                : "Keramaian terkonfirmasi warga (crowd beacon). Area ramai cenderung lebih aman."}
              <br />
              {left ? (
                <span
                  role="status"
                  style={{ color: "#b45309", fontWeight: 700, fontSize: 12 }}
                >
                  Orang mulai berkurang — beacon hilang {left}
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
                Lokasi Anda belum terdeteksi — izinkan akses lokasi lalu
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Navigation aria-hidden="true" width={15} height={15} />
                {routing ? "Menghitung rute…" : "Rute Aman ke sini"}
              </button>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
