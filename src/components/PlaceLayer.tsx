"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { db } from "@/lib/firebase";
import type { PlaceData } from "@/lib/types";
import { isOpenNow } from "@/lib/geo";
import { PLACE_ICON_DATA, PLACE_COLORS, iconSvg } from "@/lib/IconMap";
import { PLACE_LABELS } from "@/lib/places";
import { fetchAllReports } from "@/lib/reports";
import { computeAndSetRoute, useRouteCtx } from "@/components/RouteContext";
import { useLiveLocationCtx } from "@/components/LiveLocationContext";
import { useMapFilters } from "@/components/MapFiltersContext";
import { Navigation, Phone } from "lucide-react";

function placeIcon(p: PlaceData, open: boolean): L.DivIcon {
  // Root normal-flow selebar konten; iconAnchor [16,38] = ujung tail = titik koordinat.
  // TANPA inner absolute/translate — offset ganda membuat pin melenceng saat zoom.
  // Background lingkaran tetap PUTIH (default) — hanya LAMBANG yang berwarna
  // per kategori (PLACE_COLORS); tutup → lambang & border pudar.
  const iconColor = open ? (PLACE_COLORS[p.type] ?? "#0f766e") : "#64748b";
  const border = open ? "#0f766e" : "#64748b";
  const icon = iconSvg(
    PLACE_ICON_DATA[p.type] ?? PLACE_ICON_DATA.pos_keamanan,
    17,
    iconColor
  );
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:32px;">
        <div style="box-sizing:border-box;background:#ffffff;border:2px solid ${border};border-radius:9999px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.25);">
          ${icon}
        </div>
        <div style="width:2px;height:6px;background:${border};margin-top:-1px;"></div>
      </div>`,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -32],
  });
}

export default function PlaceLayer() {
  const [places, setPlaces] = useState<(PlaceData & { id: string })[] | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [noLocation, setNoLocation] = useState(false);
  const { pos } = useLiveLocationCtx();
  const { setRoute, setLoading } = useRouteCtx();
  const { filters } = useMapFilters();
  const [routingFor, setRoutingFor] = useState<string | null>(null);

  useEffect(() => {
    // LIVE: tempat yang ditambah/diedit/dihapus admin langsung sinkron di semua
    // tab terbuka (pola onSnapshot sama dengan laporan/`/bahaya`).
    // Error → [] — anti gagal demo, peta tetap jalan.
    const unsub = onSnapshot(
      collection(db, "places"),
      (snap) => {
        const list: (PlaceData & { id: string })[] = [];
        snap.forEach((d) => {
          const p = d.data() as PlaceData;
          if (p.city === "Bekasi") list.push({ ...p, id: d.id });
        });
        setPlaces(list);
      },
      () => setPlaces([])
    );
    const t = setInterval(() => setNow(new Date()), 60_000); // refresh status buka tiap menit
    return () => {
      unsub();
      clearInterval(t);
    };
  }, []);

  if (!places) return null;

  // filter murni visual — tempat tersembunyi TETAP jadi kandidat bantuan SOS
  const visiblePlaces = places.filter((p) => filters.places[p.type]);

  const routeTo = async (p: PlaceData) => {
    if (!pos) {
      setNoLocation(true); // jujur: tanpa titik awal, jangan karang rute dari pusat kota
      return;
    }
    setNoLocation(false);
    setRoutingFor(p.name);
    try {
      const reports = await fetchAllReports();
      await computeAndSetRoute(
        pos,
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
      {visiblePlaces.map((p) => {
        const open = isOpenNow(p.open, p.close, now);
        return (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={placeIcon(p, open)}
            title={`${p.name} — ${open ? "sedang buka" : "tutup"}`}
            aria-label={`${p.name} — ${open ? "sedang buka" : "tutup"}`}
          >
            <Popup>
              <strong>{p.name}</strong>
              <br />
              {PLACE_LABELS[p.type] ?? "Tempat"} ·{" "}
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
                {open ? "Sedang buka" : "Sedang tutup"}
              </span>
              {p.phone && (
                <>
                  <br />
                  <a href={`tel:${p.phone}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Phone aria-hidden="true" width={14} height={14} /> {p.phone}
                  </a>
                </>
              )}
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Navigation aria-hidden="true" width={15} height={15} />
                {routingFor === p.name ? "Menghitung rute…" : "Rute Aman ke sini"}
              </button>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
