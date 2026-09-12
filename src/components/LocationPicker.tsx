"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BATAS_BEKASI } from "@/lib/batas-bekasi";

export interface LocationPickerValue {
  lat: number;
  lng: number;
}

// Polygon dunia-dengan-lubang: area luar batas digelapkan agar jelas batas pilih
const WORLD: [number, number][] = [
  [85, -180],
  [85, 180],
  [-85, 180],
  [-85, -180],
];

function pinIcon(): L.DivIcon {
  // Root persis selebar konten; iconAnchor [17,42] = ujung tail = titik koordinat.
  // TANPA inner absolute/translate — offset ganda membuat pin melenceng saat zoom.
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:34px;">
        <div style="box-sizing:border-box;background:#ffffff;border:3px solid #d97706;border-radius:9999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:19px;box-shadow:0 2px 8px rgba(0,0,0,.3);">
          📌
        </div>
        <div style="width:3px;height:8px;background:#d97706;margin-top:-1px;"></div>
      </div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -36],
  });
}

/** Pin bisa digeser (dragging) ATAU ketuk peta untuk memindahkan */
function TapAndDrag({
  value,
  onChange,
}: {
  value: LocationPickerValue;
  onChange: (v: LocationPickerValue) => void;
}) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return (
    <Marker
      position={[value.lat, value.lng]}
      icon={pinIcon()}
      draggable
      title="Penanda lokasi kejadian — geser atau ketuk peta"
      eventHandlers={{
        dragend: (e) => {
          const p = (e.target as L.Marker).getLatLng();
          onChange({ lat: p.lat, lng: p.lng });
        },
      }}
      aria-label="Penanda lokasi kejadian — geser atau ketuk peta"
    />
  );
}

export default function LocationPicker({
  value,
  onChange,
}: {
  value: LocationPickerValue;
  onChange: (v: LocationPickerValue) => void;
}) {
  const [rejected, setRejected] = useState(false); // true bila ketukan/drag terakhir di luar batas

  // dalam batas poligon? (point-in-polygon ray casting sederhana; BATAS = [lat, lng])
  const insideBekasi = (lat: number, lng: number): boolean => {
    let inside = false;
    const pts = BATAS_BEKASI;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [latI, lngI] = pts[i];
      const [latJ, lngJ] = pts[j];
      const intersect =
        latI > lat !== latJ > lat &&
        lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const handle = (v: LocationPickerValue) => {
    if (!insideBekasi(v.lat, v.lng)) {
      setRejected(true);
      return; // jangan panggil onChange — pin menolak keluar batas
    }
    setRejected(false);
    onChange(v);
  };

  const note = rejected
    ? "⚠️ Lokasi di luar Kota Bekasi — geser/ketuk di dalam area Bekasi."
    : "Ketuk peta atau geser pin 📌 ke lokasi kejadian.";

  return (
    <div>
      <div className="h-64 overflow-hidden rounded-xl border-2 border-slate-200">
        <MapContainer
          center={[value.lat, value.lng]}
          zoom={15}
          minZoom={11}
          maxZoom={18}
          scrollWheelZoom
          className="h-full w-full"
          aria-label="Peta pemilih lokasi kejadian"
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
          <TapAndDrag value={value} onChange={handle} />
        </MapContainer>
      </div>
      <p className="mt-1.5 text-xs font-semibold text-slate-600">
        {note ?? "Ketuk peta atau geser pin 📌 ke lokasi kejadian."}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">
        Koordinat: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
      </p>
    </div>
  );
}
