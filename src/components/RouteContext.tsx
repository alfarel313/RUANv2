"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { RouteCandidate, SafeRouteResult } from "@/lib/routing";
import type { ReportData } from "@/lib/types";

export interface RouteState {
  result: SafeRouteResult;
  origin: { lat: number; lng: number };
  dest: { lat: number; lng: number };
  destName: string;
  reports: ReportData[]; // snapshot laporan saat rute dihitung (untuk marker insiden)
  showCompare: boolean;
}

export interface RouteContextValue {
  route: RouteState | null;
  loading: boolean;
  setRoute: (r: Omit<RouteState, "showCompare">) => void;
  setLoading: (v: boolean) => void;
  toggleCompare: () => void;
  clearRoute: () => void;
}

export const RouteContext = createContext<RouteContextValue | null>(null);

export function RouteProvider({ children }: { children: React.ReactNode }) {
  const [route, setRouteState] = useState<RouteState | null>(null);
  const [loading, setLoading] = useState(false);

  const setRoute = useCallback((r: Omit<RouteState, "showCompare">) => {
    setRouteState({ ...r, showCompare: false });
  }, []);

  const toggleCompare = useCallback(() => {
    setRouteState((prev) =>
      prev ? { ...prev, showCompare: !prev.showCompare } : prev
    );
  }, []);

  const clearRoute = useCallback(() => {
    setRouteState(null);
    setLoading(false);
  }, []);

  return (
    <RouteContext.Provider
      value={{ route, loading, setRoute, setLoading, toggleCompare, clearRoute }}
    >
      {children}
    </RouteContext.Provider>
  );
}

export function useRouteCtx(): RouteContextValue {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error("useRouteCtx: RouteContext belum ada");
  return ctx;
}

/** Helper pemanggilan lengkap: fetch kandidat → pilih rute aman → simpan state */
export async function computeAndSetRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
  destName: string,
  reports: ReportData[],
  setRoute: RouteContextValue["setRoute"],
  setLoading: RouteContextValue["setLoading"]
): Promise<SafeRouteResult> {
  setLoading(true);
  try {
    const { fetchRoutes, pickSafeRoute } = await import("@/lib/routing");
    const candidates: RouteCandidate[] = await fetchRoutes(origin, dest);
    const result = pickSafeRoute(candidates, reports) ?? null;
    if (!result) throw new Error("tidak ada kandidat rute");
    setRoute({ result, origin, dest, destName, reports });
    return result;
  } finally {
    setLoading(false);
  }
}
