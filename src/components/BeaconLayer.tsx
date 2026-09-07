"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { BeaconData } from "@/lib/types";

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
  beacons: BeaconData[];
}) {
  return (
    <>
      {beacons.map((b) => (
        <Marker
          key={`${b.lat.toFixed(5)},${b.lng.toFixed(5)}`}
          position={[b.lat, b.lng]}
          icon={beaconIcon(b.count)}
          aria-label={`Keramaian ${b.count} orang aktif`}
        >
          <Popup>
            <strong>👥 {b.count} orang aktif</strong>
            <br />
            Keramaian terkonfirmasi warga (crowd beacon). Area ramai
            cenderung lebih aman.
          </Popup>
        </Marker>
      ))}
    </>
  );
}
