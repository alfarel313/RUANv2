"use client";

import { useMap } from "react-leaflet";
import { LocateFixed } from "lucide-react";
import { useLiveLocationCtx } from "@/components/LiveLocationContext";

/**
 * Tombol fokus lokasi pengguna (kiri-bawah peta):
 * - klik saat posisi ada → flyTo posisi pengguna + aktifkan kembali mode ikuti (follow)
 *   (follow mati otomatis saat user menggeser peta — ini satu-satunya cara menyalakannya lagi)
 * - klik saat watcher mati/tak ada posisi → nyalakan ulang watcher (mis. sudah auto-stop 30 menit)
 */
export default function FocusLocationButton({
  follow,
  onFollow,
}: {
  follow: boolean;
  onFollow: (v: boolean) => void;
}) {
  const map = useMap();
  const { pos, stop, start } = useLiveLocationCtx();

  const handleClick = () => {
    if (pos) {
      onFollow(true);
      map.flyTo([pos.lat, pos.lng], Math.max(map.getZoom(), 16), {
        duration: 0.6,
      });
    } else {
      stop(); // bersihkan watcher lama bila ada
      start(); // nyalakan ulang — marker & follow menyusul begitu posisi datang
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Fokus ke lokasi saya"
      aria-pressed={follow}
      title="Fokus ke lokasi saya"
      className={`pointer-events-auto absolute bottom-3 left-3 z-[500] flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-colors ${
        follow
          ? "border-brand bg-brand text-white"
          : "border-slate-200 bg-white text-brand hover:bg-brand/5"
      }`}
    >
      <LocateFixed aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
