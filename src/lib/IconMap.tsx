"use client";

import {
  CircleHelp,
  Construction,
  FileText,
  Flame,
  Hospital,
  Landmark,
  Mosque,
  Package,
  ShieldCheck,
  Siren,
  Stethoscope,
  Store,
  TrainFront,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { __iconData as landmarkData } from "lucide-react/dist/esm/icons/landmark.mjs";
import { __iconData as hospitalData } from "lucide-react/dist/esm/icons/hospital.mjs";
import { __iconData as stethoscopeData } from "lucide-react/dist/esm/icons/stethoscope.mjs";
import { __iconData as mosqueData } from "lucide-react/dist/esm/icons/mosque.mjs";
import { __iconData as storeData } from "lucide-react/dist/esm/icons/store.mjs";
import { __iconData as packageData } from "lucide-react/dist/esm/icons/package.mjs";
import { __iconData as trainFrontData } from "lucide-react/dist/esm/icons/train-front.mjs";
import { __iconData as shieldCheckData } from "lucide-react/dist/esm/icons/shield-check.mjs";
import { __iconData as wavesData } from "lucide-react/dist/esm/icons/waves-horizontal.mjs";
import { __iconData as flameData } from "lucide-react/dist/esm/icons/flame.mjs";
import { __iconData as sirenData } from "lucide-react/dist/esm/icons/siren.mjs";
import { __iconData as constructionData } from "lucide-react/dist/esm/icons/construction.mjs";
import { __iconData as circleHelpData } from "lucide-react/dist/esm/icons/circle-question-mark.mjs";
import { __iconData as fileTextData } from "lucide-react/dist/esm/icons/file-text.mjs";
import { __iconData as mapPinData } from "lucide-react/dist/esm/icons/map-pin.mjs";
import { __iconData as usersData } from "lucide-react/dist/esm/icons/users.mjs";
import type { PlaceType, ReportType } from "./types";

/**
 * SATU SUMBER KEBENARAN ikon Lucide — dipakai nav, filter, kartu, form, peta.
 * Komponen React: untuk JSX. `*Data` (node SVG): untuk iconSvg → DivIcon Leaflet.
 */

type LucideIconData = {
  name: string;
  size: number;
  node: [string, Record<string, string>][];
};

export const PLACE_LUCIDE: Record<PlaceType, LucideIcon> = {
  polisi: Landmark,
  rumah_sakit: Hospital,
  puskesmas: Stethoscope,
  masjid: Mosque,
  toko: Store,
  mall: Package,
  stasiun: TrainFront,
  pos_keamanan: ShieldCheck,
};

export const PLACE_ICON_DATA: Record<PlaceType, LucideIconData> = {
  polisi: landmarkData,
  rumah_sakit: hospitalData,
  puskesmas: stethoscopeData,
  masjid: mosqueData,
  toko: storeData,
  mall: packageData,
  stasiun: trainFrontData,
  pos_keamanan: shieldCheckData,
};

/**
 * Warna marker per kategori tempat — SATU WARNA = SATU KATEGORI (mudah dibedakan
 * di peta). Dipakai: border+ekor marker PlaceLayer, ikon di dropdown filter
 * (legenda), dan teks ikon di PlaceAdminSection. Warna gelap agar kontras
 * dengan lingkaran putih marker & tetap terbaca di atas tiles terang.
 */
export const PLACE_COLORS: Record<PlaceType, string> = {
  polisi: "#1d4ed8", // biru — kantor polisi
  rumah_sakit: "#dc2626", // merah — rumah sakit (darurat medis)
  puskesmas: "#db2777", // pink — puskesmas
  masjid: "#16a34a", // hijau — masjid
  toko: "#ea580c", // oranye — minimarket
  mall: "#7c3aed", // ungu — mal
  stasiun: "#0e7490", // teal gelap — stasiun/transport
  pos_keamanan: "#4d7c0f", // zaitun — pos keamanan
};

export const REPORT_LUCIDE: Record<ReportType, LucideIcon> = {
  banjir: Waves,
  kebakaran: Flame,
  kejahatan: Siren,
  jalan_rusak: Construction,
  kehilangan: CircleHelp,
  lainnya: FileText,
};

export const REPORT_ICON_DATA: Record<ReportType, LucideIconData> = {
  banjir: wavesData,
  kebakaran: flameData,
  kejahatan: sirenData,
  jalan_rusak: constructionData,
  kehilangan: circleHelpData,
  lainnya: fileTextData,
};

/** Data node ikon umum untuk DivIcon peta (pin lapor, beacon, dll.) */
export const MAP_ICON_DATA = {
  pin: mapPinData,
  users: usersData,
} as const;

/** SVG string untuk DivIcon Leaflet — render node ikon Lucide sebagai <svg> inline */
export function iconSvg(
  data: LucideIconData,
  size = 18,
  color = "currentColor"
): string {
  if (!data || !Array.isArray(data.node)) return "";
  const inner = data.node
    .map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .filter(([k]) => k !== "key")
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${tag} ${attrStr}/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
