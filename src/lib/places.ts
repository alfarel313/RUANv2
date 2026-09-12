// Tipe & validasi tempat aman (places) — MURNI, dipakai form admin + PlaceLayer.
// Pola sama dengan src/lib/routing.ts: tanpa side effect, mudah diuji (scripts/test-places.ts).

import type { PlaceData, PlaceType } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import {
  Hospital,
  Landmark,
  Mosque,
  Package,
  ShieldCheck,
  Store,
  Stethoscope,
  TrainFront,
} from "lucide-react";
// re-export agar konsumen places.ts satu pintu (pola komponen layer/admin)
export { PLACE_COLORS } from "@/lib/IconMap";

export interface PlaceCategory {
  value: PlaceType;
  label: string;
  icon: LucideIcon;
}

/** 8 kategori tempat aman — SATU SUMBER KEBENARAN (admin form, PlaceLayer, filter) */
export const PLACE_CATEGORIES: PlaceCategory[] = [
  { value: "polisi", label: "Kantor Polisi", icon: Landmark },
  { value: "rumah_sakit", label: "Rumah Sakit", icon: Hospital },
  { value: "puskesmas", label: "Puskesmas", icon: Stethoscope },
  { value: "masjid", label: "Masjid", icon: Mosque },
  { value: "toko", label: "Minimarket", icon: Store },
  { value: "mall", label: "Mal", icon: Package },
  { value: "stasiun", label: "Stasiun/Transport", icon: TrainFront },
  { value: "pos_keamanan", label: "Pos Keamanan", icon: ShieldCheck },
];

export const PLACE_CATEGORY_VALUES: PlaceType[] = PLACE_CATEGORIES.map((c) => c.value);

export const PLACE_LABELS: Record<PlaceType, string> = Object.fromEntries(
  PLACE_CATEGORIES.map((c) => [c.value, c.label])
) as Record<PlaceType, string>;

export const PLACE_ICONS: Record<PlaceType, LucideIcon> = Object.fromEntries(
  PLACE_CATEGORIES.map((c) => [c.value, c.icon])
) as Record<PlaceType, LucideIcon>;

/** Draft tempat dari form admin — belum tentu valid (di-validasi validatePlaceDraft) */
export type PlaceDraft = Omit<PlaceData, "city"> & { phone: string | null };

// Rentang longgar Indonesia barat — guard penyelamat, BUKAN validasi batas kota
// (validasi dalam-polygon Bekasi dilakukan LocationPicker saat pemilihan titik).
const LAT_RANGE: [number, number] = [-11, 0];
const LNG_RANGE: [number, number] = [104, 112];

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Validasi draft tempat aman.
 * @returns null bila valid; string pesan error (Indonesia) bila tidak.
 *
 * Catatan jam: 24 jam = open==close "00:00"–"00:00" (konvensi seed); jam lintas
 * tengah malam (mis. 18:00–02:00) VALID — geo.isOpenNow sudah menanganinya.
 */
export function validatePlaceDraft(d: PlaceDraft): string | null {
  const name = (d.name ?? "").trim();
  if (name.length < 1) return "Nama tempat wajib diisi.";
  if (name.length > 120) return "Nama tempat maksimal 120 karakter.";

  if (!PLACE_CATEGORY_VALUES.includes(d.type)) {
    return "Kategori tempat tidak valid.";
  }

  if (typeof d.lat !== "number" || !Number.isFinite(d.lat) || d.lat < LAT_RANGE[0] || d.lat > LAT_RANGE[1]) {
    return "Koordinat lintang (lat) tidak valid.";
  }
  if (typeof d.lng !== "number" || !Number.isFinite(d.lng) || d.lng < LNG_RANGE[0] || d.lng > LNG_RANGE[1]) {
    return "Koordinat bujur (lng) tidak valid.";
  }

  if (!HHMM_RE.test(d.open ?? "")) return "Jam buka harus format JJ:MM (contoh 06:00).";
  if (!HHMM_RE.test(d.close ?? "")) return "Jam tutup harus format JJ:MM (contoh 22:00).";

  if (d.phone != null) {
    const phone = String(d.phone).trim();
    if (phone.length > 0 && phone.length > 20) {
      return "Nomor telepon maksimal 20 karakter.";
    }
  }

  return null;
}
