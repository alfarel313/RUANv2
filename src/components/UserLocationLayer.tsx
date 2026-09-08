"use client";

import { useEffect, useState } from "react";
import { CircleMarker, Circle, useMap } from "react-leaflet";
import { useLiveLocation } from "@/hooks/useLiveLocation";

/** Pan mengikuti marker user saat follow aktif; toggle via kartu aksi peta */
function FollowUser({ pos, follow }: { pos: { lat: number; lng: number } | null; follow: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!follow || !pos) return;
    map.panTo([pos.lat, pos.lng], { animate: true });
  }, [pos, follow, map]);
  return null;
}

/**
 * Marker posisi pengguna: titik biru + lingkaran akurasi.
 * Hook aktif otomatis di-mount; auto-stop 30 menit dari hook (hemat baterai).
 */
export default function UserLocationLayer() {
  const { pos, accuracy, active, start, error } = useLiveLocation();
  const [follow] = useState(true);

  // mulai watch saat layer mount (sekali)
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error && !pos) return null;
  if (!pos || !active) return null;

  return (
    <>
      {accuracy != null && accuracy > 0 && (
        <Circle
          center={[pos.lat, pos.lng]}
          radius={Math.min(accuracy, 150)}
          pathOptions={{
            color: "#2563eb",
            weight: 1,
            fillColor: "#2563eb",
            fillOpacity: 0.12,
            interactive: false,
          }}
          aria-hidden="true"
        />
      )}
      <CircleMarker
        center={[pos.lat, pos.lng]}
        radius={8}
        pathOptions={{
          color: "#ffffff",
          weight: 3,
          fillColor: "#2563eb",
          fillOpacity: 1,
        }}
        aria-label="Posisi Anda sekarang"
      />
      <FollowUser pos={pos} follow={follow} />
    </>
  );
}
