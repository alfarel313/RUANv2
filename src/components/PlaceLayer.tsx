"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { db } from "@/lib/firebase";
import type { PlaceData, ReportData } from "@/lib/types";
import { isOpenNow } from "@/lib/geo";
import { computeAndSetRoute, useRouteCtx } from "@/components/RouteContext";
import { useLiveLocation } from "@/hooks/useLiveLocation";
import { BEKASI_CENTER } from "@/lib/batas-bekasi";

const ICONS: Record<string, string> = {
  polisi: "👮",
  puskesmas: "🩺",
  rumah_sakit: "🏥",
  masjid: "🕌",
  toko: "🏪",
  mall: "🏬",
  stasiun: "🚉",
  pos_keamanan: "🛟",
};

const LABELS: Record<string, string> = {
  polisi: "Kantor Polisi",
  puskesmas: "Puskesmas",
  rumah_sakit: "Rumah Sakit",
  masjid: "Masjid",
  toko: "Minimarket",
  mall: "Mal",
  stasiun: "Stasiun/Transport",
  pos_keamanan: "Pos Keamanan",
};

function placeIcon(p: PlaceData, open: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
        <div style="background:${open ? "#ffffff" : "#94a3b8"};border:2px solid ${open ? "#0f766e" : "#64748b"};border-radius:9999px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 2px 6px rgba(0,0,0,.25);${open ? "" : "filter:grayscale(.6);"}">
          ${ICONS[p.type] ?? "📍"}
        </div>
        <div style="width:2px;height:6px;background:${open ? "#0f766e" : "#64748b"};"></div>
      </div>`,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -40],
  });
}

async function fetchVerifiedReports(): Promise<ReportData[]> {
  try {
    const snap = await getDocs(collection(db, "reports"));
    const list: ReportData[] = [];
    snap.forEach((d) => list.push(d.data() as ReportData));
    return list;
  } catch {
    return []; // Firestore error → treat 0 insiden, tidak crash
  }
}

export default function PlaceLayer() {
  const [places, setPlaces] = useState<PlaceData[] | null>(null);
  const [now, setNow] = useState(() => new Date());
  const { pos } = useLiveLocation();
  const { setRoute, setLoading } = useRouteCtx();
  const [routingFor, setRoutingFor] = useState<string | null>(null);

  useEffect(() => {
    getDocs(collection(db, "places"))
      .then((snap) => {
        const list: PlaceData[] = [];
        snap.forEach((d) => list.push(d.data() as PlaceData));
        setPlaces(list);
      })
      .catch(() => setPlaces([]));
    const t = setInterval(() => setNow(new Date()), 60_000); // refresh status buka tiap menit
    return () => clearInterval(t);
  }, []);

  if (!places) return null;

  const routeTo = async (p: PlaceData) => {
    setRoutingFor(p.name);
    try {
      const reports = await fetchVerifiedReports();
      const origin = pos ?? { lat: BEKASI_CENTER[0], lng: BEKASI_CENTER[1] };
      await computeAndSetRoute(
        origin,
        { lat: p.lat, lng: p.lng },
        p.name,
        reports,
        setRoute,
        setLoading
      );
    } finally {
      setRoutingFor(null);
    }
  };

  return (
    <>
      {places.map((p, i) => {
        const open = isOpenNow(p.open, p.close, now);
        return (
          <Marker
            key={i}
            position={[p.lat, p.lng]}
            icon={placeIcon(p, open)}
            aria-label={`${p.name} — ${open ? "sedang buka" : "tutup"}`}
          >
            <Popup>
              <strong>{p.name}</strong>
              <br />
              {LABELS[p.type] ?? "Tempat"} ·{" "}
              {p.open === p.close
                ? "Buka 24 jam"
                : `Jam ${p.open}–${p.close}`}
              <br />
              <span
                style={{
                  color: open ? "#0f766e" : "#b91c1c",
                  fontWeight: 700,
                }}
              >
                {open ? "✅ Sedang buka" : "⛔ Sedang tutup"}
              </span>
              {p.phone && (
                <>
                  <br />
                  <a href={`tel:${p.phone}`}>📞 {p.phone}</a>
                </>
              )}
              <br />
              <button
                onClick={() => routeTo(p)}
                disabled={routingFor === p.name}
                style={{
                  marginTop: 6,
                  minHeight: 40,
                  width: "100%",
                  borderRadius: 10,
                  border: "2px solid #0f766e",
                  background: routingFor === p.name ? "#e6f2f1" : "#0f766e",
                  color: routingFor === p.name ? "#0f766e" : "#ffffff",
                  fontWeight: 700,
                  cursor: routingFor === p.name ? "wait" : "pointer",
                  fontSize: 13,
                }}
              >
                {routingFor === p.name ? "Menghitung rute…" : "🧭 Rute Aman ke sini"}
              </button>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
