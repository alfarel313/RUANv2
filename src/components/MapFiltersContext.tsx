"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReportType } from "@/lib/types";
import type { PlaceType } from "@/lib/types";

/**
 * Filter visibilitas marker per kategori — MURNI VISUAL (invarian keselamatan):
 * kategori yang dimatikan TIDAK dikeluarkan dari kandidat bantuan SOS
 * maupun perhitungan Rute Aman (docs/ideas/filter-kategori-peta.md).
 * Default semua ON; reset tiap sesi (tanpa persist — aman demo).
 */
export interface MapFilters {
  places: Record<PlaceType, boolean>;
  showBeacons: boolean;
  reports: Record<ReportType, boolean>;
  showRouteIncidents: boolean;
}

export const PLACE_KEYS: PlaceType[] = [
  "polisi",
  "rumah_sakit",
  "puskesmas",
  "masjid",
  "toko",
  "mall",
  "stasiun",
  "pos_keamanan",
];

export const REPORT_KEYS: ReportType[] = [
  "banjir",
  "kebakaran",
  "kejahatan",
  "jalan_rusak",
  "kehilangan",
  "lainnya",
];

function defaultFilters(): MapFilters {
  return {
    places: {
      polisi: true,
      rumah_sakit: true,
      puskesmas: true,
      masjid: true,
      toko: true,
      mall: true,
      stasiun: true,
      pos_keamanan: true,
    },
    showBeacons: true,
    reports: {
      banjir: true,
      kebakaran: true,
      kejahatan: true,
      jalan_rusak: true,
      kehilangan: true,
      lainnya: true,
    },
    showRouteIncidents: true,
  };
}

export interface MapFiltersContextValue {
  filters: MapFilters;
  togglePlace: (k: PlaceType) => void;
  toggleBeacons: () => void;
  toggleReport: (k: ReportType) => void;
  toggleRouteIncidents: () => void;
  allPlacesOn: () => void;
  allReportsOn: () => void;
  allPlacesOff: () => void;
  allReportsOff: () => void;
}

const MapFiltersContext = createContext<MapFiltersContextValue | null>(null);

export function MapFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<MapFilters>(defaultFilters);

  const togglePlace = useCallback((k: PlaceType) => {
    setFilters((f) => ({ ...f, places: { ...f.places, [k]: !f.places[k] } }));
  }, []);

  const toggleBeacons = useCallback(() => {
    setFilters((f) => ({ ...f, showBeacons: !f.showBeacons }));
  }, []);

  const toggleReport = useCallback((k: ReportType) => {
    setFilters((f) => ({ ...f, reports: { ...f.reports, [k]: !f.reports[k] } }));
  }, []);

  const toggleRouteIncidents = useCallback(() => {
    setFilters((f) => ({ ...f, showRouteIncidents: !f.showRouteIncidents }));
  }, []);

  const allPlacesOn = useCallback(() => {
    setFilters((f) => ({
      ...f,
      places: PLACE_KEYS.reduce<Record<PlaceType, boolean>>(
        (acc, k) => ({ ...acc, [k]: true }),
        {} as Record<PlaceType, boolean>
      ),
    }));
  }, []);

  const allReportsOn = useCallback(() => {
    setFilters((f) => ({
      ...f,
      reports: REPORT_KEYS.reduce<Record<ReportType, boolean>>(
        (acc, k) => ({ ...acc, [k]: true }),
        {} as Record<ReportType, boolean>
      ),
    }));
  }, []);

  // "Sembunyikan semua" — satu ketuk kosongkan peta (murni visual, invarian tetap)
  const allPlacesOff = useCallback(() => {
    setFilters((f) => ({
      ...f,
      places: PLACE_KEYS.reduce<Record<PlaceType, boolean>>(
        (acc, k) => ({ ...acc, [k]: false }),
        {} as Record<PlaceType, boolean>
      ),
    }));
  }, []);

  const allReportsOff = useCallback(() => {
    setFilters((f) => ({
      ...f,
      reports: REPORT_KEYS.reduce<Record<ReportType, boolean>>(
        (acc, k) => ({ ...acc, [k]: false }),
        {} as Record<ReportType, boolean>
      ),
    }));
  }, []);

  return (
    <MapFiltersContext.Provider
      value={{
        filters,
        togglePlace,
        toggleBeacons,
        toggleReport,
        toggleRouteIncidents,
        allPlacesOn,
        allReportsOn,
        allPlacesOff,
        allReportsOff,
      }}
    >
      {children}
    </MapFiltersContext.Provider>
  );
}

export function useMapFilters(): MapFiltersContextValue {
  const ctx = useContext(MapFiltersContext);
  if (!ctx) throw new Error("useMapFilters: MapFiltersContext belum ada");
  return ctx;
}
