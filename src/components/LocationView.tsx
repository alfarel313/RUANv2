"use client";

import { MapContainer, TileLayer, Marker, Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BATAS_BEKASI } from "@/lib/batas-bekasi";
import { iconSvg, MAP_ICON_DATA } from "@/lib/IconMap";

export interface LocationViewValue {
  lat: number;
  lng: number;
}

// Polygon dunia-dengan-lubang: area luar batas digelapkan (konteks lokasi kota)
const WORLD: [number, number][] = [
  [85, -180],
  [85, 180],
  [-85, 180],
  [-85, -180],
];

/** Pin merah statis — menandai lokasi kejadian laporan (read-only) */
function incidentPin(): L.DivIcon {
  const pin = iconSvg(MAP_ICON_DATA.pin, 18, "#dc2626");
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:34px;">
        <div style="box-sizing:border-box;background:#ffffff;border:3px solid #dc2626;border-radius:9999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.3);">
          ${pin}
        </div>
        <div style="width:3px;height:8px;background:#dc2626;margin-top:-1px;"></div>
      </div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -36],
  });
}

/**
 * Peta mini READ-ONLY lokasi laporan — dipakai admin saat verifikasi agar
 * bisa memeriksa titik kejadian persis seperti yang dilihat pelapor.
 * Tanpa ketuk/geser ubah lokasi (beda dari LocationPicker yang mengubah).
 */
export default function LocationView({
  value,
  height = 200,
  label = "Lokasi kejadian",
}: {
  value: LocationViewValue;
  height?: number;
  label?: string;
}) {
  return (
    <div>
      <div
        className="overflow-hidden rounded-xl border-2 border-slate-200"
        style={{ height }}
      >
        <MapContainer
          center={[value.lat, value.lng]}
          zoom={16}
          minZoom={11}
          maxZoom={18}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
          boxZoom={false}
          keyboard={false}
          zoomControl={false}
          attributionControl={false}
          className="h-full w-full"
          aria-label={`Peta lokasi kejadian: ${label}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polygon
            positions={[WORLD, BATAS_BEKASI]}
            pathOptions={{
              stroke: false,
              fillColor: "#0f172a",
              fillOpacity: 0.45,
              fillRule: "evenodd",
              interactive: false,
            }}
          />
          <Polygon
            positions={BATAS_BEKASI}
            pathOptions={{
              stroke: true,
              color: "#0f766e",
              weight: 3,
              opacity: 0.9,
              fill: false,
              interactive: false,
            }}
          />
          <Marker
            position={[value.lat, value.lng]}
            icon={incidentPin()}
            title={label}
            aria-label={label}
          />
        </MapContainer>
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-600">
        {label} — koordinat {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
      </p>
      <p className="mt-0.5 text-[10px] text-slate-400">
        Peta &copy;{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          OpenStreetMap
        </a>
      </p>
    </div>
  );
}
