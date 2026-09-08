"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_STOP_MS = 30 * 60 * 1000; // hemat baterai: matikan sendiri setelah 30 menit

export interface UseLiveLocationResult {
  pos: { lat: number; lng: number } | null;
  accuracy: number | null; // meter
  error: string | null;
  active: boolean; // watch sedang berjalan
  start: () => void;
  stop: () => void;
}

/**
 * Live location via watchPosition — posisi pengguna untuk marker peta & rute.
 * Auto-stop 30 menit + cleanup saat unmount agar tidak bocor baterai.
 */
export function useLiveLocation(): UseLiveLocationResult {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  const watchRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (watchRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setActive(false);
  }, []);

  const start = useCallback(() => {
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation ||
      watchRef.current !== null
    ) {
      return;
    }
    setError(null);
    setActive(true);
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setAccuracy(p.coords.accuracy ?? null);
      },
      () => {
        setError("Tidak bisa mengambil lokasi. Izinkan akses lokasi di browser.");
        stop();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
    );
    // auto-stop hemat baterai
    timerRef.current = setTimeout(() => stop(), AUTO_STOP_MS);
  }, [stop]);

  useEffect(() => stop, [stop]); // cleanup saat unmount

  return { pos, accuracy, error, active, start, stop };
}
