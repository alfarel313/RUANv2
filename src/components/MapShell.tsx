"use client";

import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { BATAS_BEKASI, BEKASI_CENTER } from "@/lib/batas-bekasi";

// Polygon dunia-dengan-lubang: luar batas tampak gelap (focus mask)
const WORLD: [number, number][] = [
  [85, -180],
  [85, 180],
  [-85, 180],
  [-85, -180],
];

export interface MapShellProps {
  children?: React.ReactNode
}

export default function MapShell({ children }: MapShellProps) {
  return (
    <MapContainer
      center={BEKASI_CENTER}
      zoom={12}
      minZoom={11}
      maxZoom={18}
      scrollWheelZoom
      className="h-full w-full"
      aria-label="Peta interaktif Kota Bekasi"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Mask luar Kota Bekasi */}
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
      {/* Garis batas teal menyala */}
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
      {children}
    </MapContainer>
  );
}
