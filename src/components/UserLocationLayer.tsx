"use client";

import { useEffect, useRef, useState } from "react";
import { CircleMarker, Circle, useMap } from "react-leaflet";
import { useLiveLocationCtx } from "@/components/LiveLocationContext";

/**
 * Follow pintar: pan mengikuti HANYA bila peta sedang idle (tidak digeser/diketuk user).
 * Interaksi user apa pun (dragstart/click) mematikan follow otomatis —
 * mencegah peta "melompat balik ke titik saya" saat user menekan tombol/marker.
 */
function FollowUser({ pos, follow, onUserInteract }: { pos: { lat: number; lng: number } | null; follow: boolean; onUserInteract: () => void }) {
  const map = useMap();
  const idleRef = useRef(true);

  useEffect(() => {
    const stop = () => {
      idleRef.current = false;
      onUserInteract();
    };
    map.on("dragstart", stop);
    map.on("zoomstart", stop);
    return () => {
      map.off("dragstart", stop);
      map.off("zoomstart", stop);
    };
  }, [map, onUserInteract]);

  useEffect(() => {
    if (!follow || !pos || !idleRef.current) return;
    map.panTo([pos.lat, pos.lng], { animate: true });
  }, [pos, follow, map]);

  return null;
}

/**
 * Marker posisi pengguna: titik biru + lingkaran akurasi.
 * Hook aktif otomatis di-mount; auto-stop 30 menit dari hook (hemat baterai).
 */
export default function UserLocationLayer() {
  const { pos, accuracy, active, error } = useLiveLocationCtx();
  const [follow, setFollow] = useState(true);

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
      <FollowUser
        pos={pos}
        follow={follow}
        onUserInteract={() => setFollow(false)}
      />
    </>
  );
}
