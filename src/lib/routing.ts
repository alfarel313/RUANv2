// Rute Aman engine — murni & teruji tanpa Firebase/DOM (pola src/lib/geo.ts)
// Kontrak (docs/SPEC-live-nav.md):
// insiden dihitung bila berada dalam BUFFER 75 m di sekitar geometri rute
// (bukan hanya tepat di jalur) — kejadian terdekat ikut menimbulkan penalti;
// penalti per tipe × window umur; skor = durasi + 60×penalti → pilih minimal.
// MODE MOTOR (KONFIRMASI USER 2026-09-13): kecepatan 400 m/mnt (24 km/jam),
// penalti diskala ÷5 dari kalibrasi jalan kaki — perbandingan detour-vs-penalti
// dalam meter TIDAK berubah (pilihan rute identik dengan kalibrasi lama).

import type { ReportData, ReportType } from "@/lib/types";
import { haversineM } from "@/lib/geo";

export interface LatLng {
  lat: number;
  lng: number;
}

export const INCIDENT_RADIUS_M = 75; // buffer 75 m di sekitar rute — kejadian terdekat ikut dihukum (KONFIRMASI USER)
export const MOTO_M_PER_MIN = 400; // 24 km/jam rata-rata motor di kota (KONFIRMASI USER)

/** Penalti (menit motor) & window umur laporan per tipe — KONFIRMASI USER
 *  (skala ÷5 dari kalibrasi jalan kaki; window umur tetap, tidak berubah) */
export const INCIDENT_RULES: Record<
  ReportType,
  { penaltyMin: number; windowMs: number }
> = {
  kejahatan: { penaltyMin: 3, windowMs: 7 * 24 * 3600 * 1000 },
  banjir: { penaltyMin: 4, windowMs: 2 * 24 * 3600 * 1000 },
  kebakaran: { penaltyMin: 1, windowMs: 7 * 24 * 3600 * 1000 },
  jalan_rusak: { penaltyMin: 0.4, windowMs: 7 * 24 * 3600 * 1000 },
  kehilangan: { penaltyMin: 0.4, windowMs: 7 * 24 * 3600 * 1000 },
  lainnya: { penaltyMin: 1, windowMs: 7 * 24 * 3600 * 1000 },
};

export const REPORT_LABELS: Record<ReportType, string> = {
  banjir: "banjir",
  kebakaran: "kebakaran",
  kejahatan: "kejahatan",
  jalan_rusak: "jalan rusak",
  kehilangan: "kehilangan",
  lainnya: "lainnya",
};

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving"; // profil kendaraan — motor (KONFIRMASI USER)
const OSRM_TIMEOUT_MS = 5000;

export type RouteSource = "osrm" | "straight";

export interface RouteCandidate {
  coords: [number, number][]; // [lat, lng]
  distanceM: number;
  durationS: number; // estimasi motor konsisten (400 m/mnt), bukan durasi mentah OSRM
  source: RouteSource;
}

export interface RouteIncident {
  report: ReportData;
  penaltyMin: number;
}

export interface SafeRouteResult {
  chosen: RouteCandidate;
  fastest: RouteCandidate;
  chosenIncidents: RouteIncident[]; // insiden yang tetap di rute terpilih
  avoidedIncidents: RouteIncident[]; // insiden rute tercepat yang berhasil dihindari
  extraMinutes: number; // menit tambahan chosen vs fastest
  reasonText: string;
}

function motoSeconds(distanceM: number): number {
  return (distanceM / MOTO_M_PER_MIN) * 60;
}

/** Jarak titik→segmen (proyeksi equirectangular lokal — akurat untuk skala kota) */
function pointToSegmentM(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const R = 6371000;
  const cosLat = Math.cos((pLat * Math.PI) / 180);
  const ax = ((aLng - pLng) * Math.PI) / 180 * cosLat * R;
  const ay = ((aLat - pLat) * Math.PI) / 180 * R;
  const bx = ((bLng - pLng) * Math.PI) / 180 * cosLat * R;
  const by = ((bLat - pLat) * Math.PI) / 180 * R;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0) {
    t = Math.max(0, Math.min(1, (-ax * dx - ay * dy) / len2));
  }
  const px = ax + t * dx;
  const py = ay + t * dy;
  return Math.sqrt(px * px + py * py);
}

/** Jarak terdekat titik→polyline rute (dengan prefilter bbox per segmen) */
export function pointToRouteM(
  lat: number,
  lng: number,
  coords: [number, number][]
): number {
  if (coords.length === 0) return Infinity;
  if (coords.length === 1) return haversineM(lat, lng, coords[0][0], coords[0][1]);
  const D_LAT = 0.0012; // ~±133 m — margin aman di atas buffer INCIDENT_RADIUS_M (75 m)
  const D_LNG = 0.0014;
  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const [aLat, aLng] = coords[i];
    const [bLat, bLng] = coords[i + 1];
    if (
      lat > Math.max(aLat, bLat) + D_LAT ||
      lat < Math.min(aLat, bLat) - D_LAT ||
      lng > Math.max(aLng, bLng) + D_LNG ||
      lng < Math.min(aLng, bLng) - D_LNG
    ) {
      continue; // segmen mustahil ≤ radius — lewati
    }
    const d = pointToSegmentM(lat, lng, aLat, aLng, bLat, bLng);
    if (d < min) min = d;
  }
  return min;
}

function activeReports(reports: ReportData[], now: number): ReportData[] {
  return reports.filter((r) => {
    if (r.status !== "verified") return false;
    if (r.city && r.city !== "Bekasi") return false;
    const rule = INCIDENT_RULES[r.type];
    if (!rule) return false;
    const age = now - r.createdAt;
    return age >= 0 && age <= rule.windowMs;
  });
}

/** Insiden laporan verified (dalam window umur) dalam buffer INCIDENT_RADIUS_M di sekitar rute */
export function routeIncidents(
  coords: [number, number][],
  reports: ReportData[],
  now: number = Date.now()
): RouteIncident[] {
  const out: RouteIncident[] = [];
  for (const r of activeReports(reports, now)) {
    if (pointToRouteM(r.lat, r.lng, coords) <= INCIDENT_RADIUS_M) {
      out.push({ report: r, penaltyMin: INCIDENT_RULES[r.type].penaltyMin });
    }
  }
  return out;
}

function incidentKey(r: ReportData): string {
  return `${r.lat.toFixed(6)},${r.lng.toFixed(6)},${r.createdAt}`;
}

function describeCounts(list: RouteIncident[]): string {
  const counts = new Map<ReportType, number>();
  list.forEach((i) =>
    counts.set(i.report.type, (counts.get(i.report.type) ?? 0) + 1)
  );
  return [...counts.entries()]
    .map(([t, n]) => `${REPORT_LABELS[t]}${n > 1 ? ` ×${n}` : ""}`)
    .join(", ");
}

/**
 * Pilih Rute Aman: skor = durationS + 60 × Σ penalti insiden → minimal.
 * Fallback garis lurus sudah dijamin fetchRoutes; di sini cukup ≥1 kandidat.
 */
export function pickSafeRoute(
  candidates: RouteCandidate[],
  reports: ReportData[],
  now: number = Date.now()
): SafeRouteResult | null {
  if (candidates.length === 0) return null;

  const scored = candidates.map((c) => {
    const incidents = routeIncidents(c.coords, reports, now);
    const penaltyS = incidents.reduce((s, i) => s + i.penaltyMin * 60, 0);
    return { c, incidents, score: c.durationS + penaltyS };
  });

  let fastestIdx = 0;
  scored.forEach((s, i) => {
    if (scored[i].c.durationS < scored[fastestIdx].c.durationS) fastestIdx = i;
  });
  let chosenIdx = 0;
  scored.forEach((s, i) => {
    if (scored[i].score < scored[chosenIdx].score) chosenIdx = i;
  });

  const fastest = scored[fastestIdx];
  const chosen = scored[chosenIdx];
  const extraMinutes = Math.max(
    0,
    Math.round((chosen.c.durationS - fastest.c.durationS) / 60)
  );
  const chosenKeys = new Set(chosen.incidents.map((i) => incidentKey(i.report)));
  const avoidedIncidents = fastest.incidents.filter(
    (i) => !chosenKeys.has(incidentKey(i.report))
  );

  let reasonText: string;
  if (candidates.length === 1 && candidates[0].source === "straight") {
    reasonText =
      "Mode offline — rute langsung ke tujuan (jaringan perutean tidak tersedia).";
  } else if (candidates.length === 1) {
    reasonText =
      chosen.incidents.length === 0
        ? "Hanya satu rute tersedia dan tidak ada titik bahaya terdeteksi."
        : `Hanya satu rute tersedia — waspada: ${describeCounts(chosen.incidents)} di jalur.`;
  } else if (chosenIdx === fastestIdx) {
    reasonText =
      chosen.incidents.length === 0
        ? "Rute tercepat dan aman — tidak ada titik bahaya terdeteksi di jalur."
        : `Semua rute melewati titik bahaya — ini yang paling ringan (${describeCounts(chosen.incidents)}).`;
  } else if (avoidedIncidents.length === 0) {
    reasonText = "Rute paling seimbang antara cepat dan aman.";
  } else {
    reasonText = `Rute aman dipilih: menghindari ${avoidedIncidents.length} titik bahaya (${describeCounts(avoidedIncidents)}) — hanya +${extraMinutes} menit vs rute tercepat.`;
  }

  return {
    chosen: chosen.c,
    fastest: fastest.c,
    chosenIncidents: chosen.incidents,
    avoidedIncidents,
    extraMinutes,
    reasonText,
  };
}

interface OsrmRouteResponse {
  code: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] }; // [lng, lat]
  }[];
}

function straightCandidate(origin: LatLng, dest: LatLng): RouteCandidate {
  const distanceM = haversineM(origin.lat, origin.lng, dest.lat, dest.lng);
  return {
    coords: [
      [origin.lat, origin.lng],
      [dest.lat, dest.lng],
    ],
    distanceM,
    durationS: motoSeconds(distanceM),
    source: "straight",
  };
}

/** Kandidat rute OSRM (alternatives=true, geometri penuh) — gagal apa pun → garis lurus */
export async function fetchRoutes(
  origin: LatLng,
  dest: LatLng
): Promise<RouteCandidate[]> {
  const fallback = straightCandidate(origin, dest);
  if (typeof window === "undefined" || typeof fetch !== "function") {
    return [fallback];
  }
  const url = `${OSRM_BASE}/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?alternatives=true&overview=full&geometries=geojson`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), OSRM_TIMEOUT_MS);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return [fallback];
    const data = (await res.json()) as OsrmRouteResponse;
    if (data.code !== "Ok" || !data.routes?.length) return [fallback];
    const list = data.routes
      .map((r) => {
        const coords = r.geometry.coordinates.map(
          (c) => [c[1], c[0]] as [number, number]
        );
        return {
          coords,
          distanceM: r.distance,
          durationS: motoSeconds(r.distance),
          source: "osrm" as const,
        };
      })
      .filter((c) => c.coords.length >= 2);
    return list.length > 0 ? list : [fallback];
  } catch {
    return [fallback]; // offline / rate-limit / timeout → anti gagal demo
  }
}
