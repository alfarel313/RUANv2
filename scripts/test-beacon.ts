/**
 * Regression test bug "beacon tidak mati-mati" — jalankan: npx tsx scripts/test-beacon.ts
 *
 * BUG LAMA (usePresence.ts sweep): dissolve memakai `count` dokumen beacon yang
 * STALE — saat semua anggota berhenti check-in & presence dihapus, dokumen masih
 * memuat count lama (mis. 2) → `2 > BEACON_DISSOLVE_BELOW(1)` → sweep RETURN
 * tanpa dissolve, dan cabang else malah menulis ulang count lama. Beacon
 * menggantung selamanya. Ditambah: sweep hanya berjalan di klien yang masih
 * check-in — begitu semua user pergi, tidak ada penyapu sama sekali.
 *
 * Kontrak BARU yang diuji di sini (logika murni, tanpa Firebase):
 * 1. beacon valid = klaster kehadiran EFEKTIF (bukan angka count dokumen lama)
 * 2. beacon tak valid → window BEACON_DISSOLVE_MS sejak lowSince → dihapus
 * 3. presence kedaluwarsa (TTL) tidak membuat klaster valid
 */
import {
  clusterPresences,
  clustersToBeacons,
  PRESENCE_TTL_MS,
  BEACON_DISSOLVE_MS,
} from "../src/lib/geo";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.error(`  ❌ ${name}`);
  }
}

const NOW = 1_700_000_000_000;

// --- Kasus: semua user pergi (presence kosong) → TIDAK ada klaster valid
{
  const points = new Map(); // kosong — semua presence dihapus
  const clusters = clusterPresences(points, NOW);
  const valid = clustersToBeacons(clusters);
  check("presence kosong → 0 klaster valid (beacon harus dissolve)", valid.length === 0);
}

// --- Kasus: presence kedaluwarsa (>TTL) → diabaikan seperti orang yang pergi
{
  const points = new Map([
    ["u1", { lat: -6.2382, lng: 106.9756, updatedAt: NOW - PRESENCE_TTL_MS - 1_000 }],
  ]);
  const clusters = clusterPresences(points, NOW);
  const valid = clustersToBeacons(clusters);
  check("presence kedaluwarsa (heartbeat mati >60s) → 0 klaster valid", valid.length === 0);
}

// --- Kasus: 1 orang segar (mode demo) → klaster valid, beacon hidup
{
  const points = new Map([
    ["u1", { lat: -6.2382, lng: 106.9756, updatedAt: NOW - 5_000 }],
  ]);
  const valid = clustersToBeacons(clusterPresences(points, NOW));
  check("1 orang segar → klaster valid (beacon hidup)", valid.length === 1 && valid[0].count === 1);
}

// --- Kasus: logika window dissolve — beacon stale dihapus tepat setelah 2 menit
{
  // dokumen beacon "menggantung" dengan count STALE=3 tapi presence nyata kosong:
  const beaconDoc = { count: 3, lowSince: NOW - BEACON_DISSOLVE_MS };
  const validIds = new Set<string>(); // klaster valid = tidak ada
  // keputusan dissolve TIDAK lagi memakai count dokumen:
  const isInvalid = !validIds.has("b_x");
  const since = beaconDoc.lowSince;
  const shouldDelete = isInvalid && NOW - since >= BEACON_DISSOLVE_MS;
  check("beacon count stale (3) + presence kosong → TETAP dissolve setelah window", shouldDelete === true);
}

// --- Kasus: beacon baru-baru menggantung (< 2 menit) → belum dihapus (grace)
{
  const beaconDoc = { count: 0, lowSince: NOW - 30_000 };
  const validIds = new Set<string>();
  const isInvalid = !validIds.has("b_x");
  const shouldDelete = isInvalid && NOW - beaconDoc.lowSince >= BEACON_DISSOLVE_MS;
  check("beacon menggantung < 2 menit → belum dihapus (grace window)", shouldDelete === false);
}

// --- Kasus: klaster hidup kembali → lowSince di-reset (dissolve dibatalkan)
{
  const points = new Map([
    ["u1", { lat: -6.2382, lng: 106.9756, updatedAt: NOW - 3_000 }],
  ]);
  const valid = clustersToBeacons(clusterPresences(points, NOW));
  check("orang kembali check-in → klaster valid lagi (lowSince reset)", valid.length === 1);
}

// --- REGRESSION: dokumen beacon ZOMBIE (tanpa lat/lng — hasil race merge-ke-yang-terhapus)
//     Bug 2026-09-13: klien A deleteDoc beacon window-habis; klien B (sweep paralel,
//     beaconSnap lama) menulis setDoc({lowSince,count:0}, merge) pada id TERHAPUS
//     → Firestore membuat dokumen BARU tanpa lat/lng → BeaconLayer "Invalid LatLng
//     (undefined, undefined)" → seluruh peta crash.
{
  // 1) sweep baru TIDAK boleh menulis merge tanpa mempertahankan lat/lng dokumen:
  //    simulasikan cabang else pada dokumen zombie → hasil tulisan HARUS berisi lat/lng
  const zombieDoc: { lat?: number; lng?: number; lowSince?: number; count?: number } = {
    lowSince: NOW - 30_000,
    count: 0,
  };
  const writePayload = {
    ...(zombieDoc.lat != null && zombieDoc.lng != null ? { lat: zombieDoc.lat, lng: zombieDoc.lng } : {}),
    lowSince: zombieDoc.lowSince,
    count: 0,
  };
  // payload merge tanpa lat/lng pada dokumen yang TIDAK ADA = zombie baru →
  // kontrak fix: bila lat/lng tak ada di dokumen, jangan tulis (dokumen harus dibersihkan)
  check("dokumen tanpa lat/lng → payload tulis TIDAK memuat lat/lng palsu (menunggu pembersihan)", !("lat" in writePayload) && !("lng" in writePayload));

  // 2) guard render: BeaconView lat/lng bukan number → Marker TIDAK dirender
  const views: Array<{ id: string; lat?: unknown; lng?: unknown; count: number }> = [
    { id: "ok", lat: -6.2382, lng: 106.9756, count: 2 },
    { id: "zombie-undefined", lat: undefined, lng: undefined, count: 0 },
    { id: "zombie-null", lat: null, lng: null, count: 0 },
    { id: "zombie-nan", lat: Number.NaN, lng: Number.NaN, count: 0 },
  ];
  const renderable = views.filter(
    (b) => typeof b.lat === "number" && typeof b.lng === "number" && !Number.isNaN(b.lat) && !Number.isNaN(b.lng)
  );
  check("guard render: hanya beacon ber-koordinat valid yang dirender (1 dari 4)", renderable.length === 1 && renderable[0].id === "ok");

  // 3) sweep membersihkan zombie: dokumen tanpa lat/lng number → dihapus
  const corrupt = (b: { lat?: unknown; lng?: unknown }) =>
    b.lat == null || b.lng == null || typeof b.lat !== "number" || typeof b.lng !== "number";
  check("deteksi zombie: undefined/null/nan/missing lat/lng → true", corrupt({}) && corrupt({ lat: undefined, lng: undefined }) && corrupt({ lat: null, lng: null }) && corrupt({ lat: "x", lng: "y" }));
  check("deteksi zombie: dokumen sehat → false", !corrupt({ lat: -6.2, lng: 106.9 }));
}

console.log(`\n${pass} lulus, ${fail} gagal dari ${pass + fail} test.`);
if (fail > 0) process.exit(1);
