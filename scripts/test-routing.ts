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
    photos: [],
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

// Geometri: rute A (cepat, 4 km) lewat titik begal; rute B (lambat, 4.8 km) bersih.
// Durasi = jarak / 400 m/mnt (motor, KONFIRMASI USER): A = 600s, B = 720s.
// Skor A dengan 1 kejahatan = 600 + 180 = 780 > 720 → B menang (margin 60s, bukan seri).
const A: RouteCandidate = {
  coords: [
    [-6.2300, 106.9700],
    [-6.2318, 106.9760], // titik begal tepat di dekat sini
    [-6.2336, 106.9820],
    [-6.2350, 106.9860],
  ],
  distanceM: 4000,
  durationS: 600,
  source: "osrm",
};
const B: RouteCandidate = {
  coords: [
    [-6.2300, 106.9700],
    [-6.2280, 106.9760],
    [-6.2320, 106.9800],
    [-6.2350, 106.9860],
  ],
  distanceM: 4800,
  durationS: 720,
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
check("penalti kejahatan = 3 menit (motor, ÷5)", incA[0]?.penaltyMin === 3);

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
check("banjir 1 hari → 1, penalti 4", incBanjir.length === 1 && incBanjir[0].penaltyMin === 4);

console.log("4) Pending / kota lain → diabaikan");
const pending = mkReport(-6.2318, 106.97605, "kejahatan", 5, "pending");
check("pending → 0", routeIncidents(A.coords, [pending], now).length === 0);

console.log("5) pickSafeRoute: begal di rute A → pilih B");
const res = pickSafeRoute([A, B], [begalFresh], now);
check("chosen = B (lebih aman)", res?.chosen === B);
check("fastest = A", res?.fastest === A);
check("avoided = 1", res?.avoidedIncidents.length === 1);
check("extraMinutes = 2 (600→720s)", res?.extraMinutes === 2);
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
check("radius buffer = 75 m", INCIDENT_RADIUS_M === 75);

console.log("9) BUFFER 75 m: insiden 60 m dari jalur ikut terdeteksi");
// titik ~60 m tegak-lurus dari segmen tengah rute A (0.00054° lat ≈ 60 m)
const nearBuffer = mkReport(-6.2318 + 0.00054, 106.9760, "kejahatan", 5);
const inc60 = routeIncidents(A.coords, [nearBuffer], now);
check("insiden 60 m → terdeteksi (dalam buffer 75 m)", inc60.length === 1);
const res60 = pickSafeRoute([A, B], [nearBuffer], now);
check("rute A kena penalti kejahatan 3 mnt → B menang", res60?.chosen === B);
console.log(`   reason: ${res60?.reasonText}`);

console.log("10) BUFFER: insiden 100 m dari jalur TIDAK terdeteksi");
// 0.0009° lat ≈ 100 m — di luar buffer
const outsideBuffer = mkReport(-6.2318 + 0.0009, 106.9760, "kejahatan", 5);
check("insiden 100 m → 0 (di luar buffer)", routeIncidents(A.coords, [outsideBuffer], now).length === 0);
const res100 = pickSafeRoute([A, B], [outsideBuffer], now);
check("tanpa penalti → rute tercepat A menang", res100?.chosen === A);

console.log("11) Sisi buffer: insiden dekat rute B juga menghukum B");
const nearB = mkReport(-6.2280, 106.9760, "banjir", 12); // ~40 m dari jalur B (banjir 4 mnt)
const resB = pickSafeRoute([A, B], [nearB], now);
check("B kena penalti banjir 4 mnt → A (bersih) menang", resB?.chosen === A);
console.log(`   reason: ${resB?.reasonText}`);

console.log(`\n${fail === 0 ? "SEMUA LULUS" : "ADA GAGAL"}: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
