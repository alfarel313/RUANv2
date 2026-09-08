"use client";

import { createContext, useContext, useEffect } from "react";
import {
  useLiveLocation,
  type UseLiveLocationResult,
} from "@/hooks/useLiveLocation";

export const LiveLocationContext = createContext<UseLiveLocationResult | null>(
  null
);

/**
 * SATU watcher lokasi untuk seluruh halaman (bukan instance per komponen —
 * pernah jadi bug: PlaceLayer punya instance sendiri yang tak pernah start,
 * sehingga titik awal rute selalu fallback ke pusat kota).
 * Dipakai oleh: UserLocationLayer (marker), PlaceLayer (titik awal rute), SOSButton.
 */
export function LiveLocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useLiveLocation();
  const { start } = value;
  useEffect(() => {
    start();
  }, [start]);
  return (
    <LiveLocationContext.Provider value={value}>
      {children}
    </LiveLocationContext.Provider>
  );
}

export function useLiveLocationCtx(): UseLiveLocationResult {
  const ctx = useContext(LiveLocationContext);
  if (!ctx) throw new Error("useLiveLocationCtx: LiveLocationContext belum ada");
  return ctx;
}
