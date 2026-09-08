// Uji cepat pickSafeRoute + routeIncidents — dijalankan manual via tsx (tanpa framework)
// Skenario: rute tercepat lewat titik begal → harus memilih alternatif yang lebih aman.
import {
  pickSafeRoute,
  routeIncidents,
  pointToRouteM,
  INCIDENT_RADIUS_M,
  type RouteCandidate,
} from "../src/lib/routing";
import type { ReportData } from "../src/lib/types";

const now = Date.now();
const H = 3600 * 1000;

function mkReport(
  lat: number,
  lng: number,
  type: ReportData["type"],
  ageHours: number,
  status: "verified" | "pending" = "verified"
): ReportData {
  return {
    type,
    title: "test",
    description: "test",
    lat,
    lng,
    photoURL: null,
    status,
    reporterUid: "t",
    reporterName: "t",
    city: "Bekasi",
    createdAt: now - ageHours * H,
    verifiedBy: "admin",
    verifiedAt: now,
  };
}

// Geometri: rute A (cepat, 1000m) lewat titik begal; rute B (lambat, 1200m) bersih
const A: RouteCandidate = {
  coords: [
    [-6.2300, 106.9700],
    [-6.2318, 106.9760], // titik begal tepat di dekat sini
    [-6.2336, 106.9820],
    [-6.2350, 106.9860],
  ],
  distanceM: 1000,
  durationS: 750,
  source: "osrm",
};
const B: RouteCandidate = {
  coords: [
    [-6.2300, 106.9700],
    [-6.2280, 106.9760],
    [-6.2320, 106.9800],
    [-6.2350, 106.9860],
  ],
  distanceM: 1200,
  durationS: 900,
  source: "osrm",
};

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}`);
  }
}

console.log("1) Titik begal 20 m dari rute A → terdeteksi sebagai insiden");
const begalFresh = mkReport(-6.2318, 106.97605, "kejahatan", 5); // ~5 m dari jalur A
const incA = routeIncidents(A.coords, [begalFresh], now);
check("insiden rute A = 1", incA.length === 1);
check("penalti kejahatan = 15 menit", incA[0]?.penaltyMin === 15);

console.log("2) Titik 500 m dari rute → BUKAN insiden");
const far = mkReport(-6.2700, 106.9900, "kejahatan", 5);
check("jauh → 0 insiden", routeIncidents(A.coords, [far], now).length === 0);

console.log("3) Umur > window → diabaikan");
const begalOld = mkReport(-6.2318, 106.97605, "kejahatan", 24 * 8); // 8 hari > 7 hari
check("kejahatan 8 hari → 0", routeIncidents(A.coords, [begalOld], now).length === 0);
const banjirOld = mkReport(-6.2318, 106.97605, "banjir", 24 * 3); // 3 hari > 2 hari
check("banjir 3 hari → 0", routeIncidents(A.coords, [banjirOld], now).length === 0);
const banjirFresh = mkReport(-6.2318, 106.97605, "banjir", 24); // 1 hari ≤ 2 hari
const incBanjir = routeIncidents(A.coords, [banjirFresh], now);
check("banjir 1 hari → 1, penalti 20", incBanjir.length === 1 && incBanjir[0].penaltyMin === 20);

console.log("4) Pending / kota lain → diabaikan");
const pending = mkReport(-6.2318, 106.97605, "kejahatan", 5, "pending");
check("pending → 0", routeIncidents(A.coords, [pending], now).length === 0);

console.log("5) pickSafeRoute: begal di rute A → pilih B");
const res = pickSafeRoute([A, B], [begalFresh], now);
check("chosen = B (lebih aman)", res?.chosen === B);
check("fastest = A", res?.fastest === A);
check("avoided = 1", res?.avoidedIncidents.length === 1);
check("extraMinutes = 3 (750→900s)", res?.extraMinutes === 3);
console.log(`   reason: ${res?.reasonText}`);

console.log("6) Tanpa insiden → rute tercepat menang");
const res2 = pickSafeRoute([A, B], [], now);
check("chosen = A", res2?.chosen === A);
console.log(`   reason: ${res2?.reasonText}`);

console.log("7) Semua rute kena insiden → pilih skor minimal (B, penalti lebih ringan)");
const res3 = pickSafeRoute([A, B], [begalFresh, mkReport(-6.2280, 106.97605, "jalan_rusak", 5)], now);
check("chosen = B (skor lebih rendah)", res3?.chosen === B);
console.log(`   reason: ${res3?.reasonText}`);

console.log("8) pointToRouteM dasar");
check("titik di jalur → ~0 m", pointToRouteM(-6.2318, 106.976, A.coords) < 8);
check("radius konstanta = 25", INCIDENT_RADIUS_M === 25);

console.log(`\n${fail === 0 ? "SEMUA LULUS" : "ADA GAGAL"}: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
