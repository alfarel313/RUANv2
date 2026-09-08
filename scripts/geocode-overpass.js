/**
 * Geocode places via Overpass API (OSM) v3 — TARGETED per tempat:
 * bbox kecil (±2 km) di sekitar posisi lama + hanya kategori relevan,
 * jadi respons kecil & cepat (aman dari 504/429 di server publik).
 * Hasil: POI OSM paling dekat yang lolos nama+kategori+polygon Kota Bekasi.
 * Idempotent; jalankan: node scripts/geocode-overpass.js
 */
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

const keyPath = path.join(__dirname, "..", "serviceAccountKey.json");
if (!fs.existsSync(keyPath)) {
  console.error("❌ serviceAccountKey.json tidak ditemukan.");
  process.exit(1);
}

// ── Polygon batas Kota Bekasi (ekstrak dari src/lib/batas-bekasi.ts) ──
const batasSrc = fs.readFileSync(
  path.join(__dirname, "..", "src", "lib", "batas-bekasi.ts"),
  "utf8"
);
const BATAS = [...batasSrc.matchAll(/\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/g)].map(
  (m) => [parseFloat(m[1]), parseFloat(m[2])]
);
if (BATAS.length < 10) {
  console.error("❌ Gagal ekstrak polygon batas dari batas-bekasi.ts");
  process.exit(1);
}

function insideBekasi(lat, lng) {
  let inside = false;
  for (let i = 0, j = BATAS.length - 1; i < BATAS.length; j = i++) {
    const [latI, lngI] = BATAS[i];
    const [latJ, lngJ] = BATAS[j];
    const intersect =
      latI > lat !== latJ > lat &&
      lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distM(aLat, aLng, bLat, bLng) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

async function overpass(q, attempt = 0) {
  const url = ENDPOINTS[attempt % ENDPOINTS.length];
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "RUAN-RuteAmanBekasi/1.0 (lomba Exasti)",
      Accept: "application/json",
    },
    body: new URLSearchParams({ data: q }).toString(),
    signal: AbortSignal.timeout(45000),
  }).catch(() => null);
  if (!res || res.status === 429 || res.status === 504) {
    if (attempt >= ENDPOINTS.length * 2) return null;
    await sleep(2500);
    return overpass(q, attempt + 1);
  }
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

// bbox ±Δ km di sekitar titik
function bbox(lat, lng, dLat = 0.02, dLng = 0.025) {
  return `${(lat - dLat).toFixed(4)},${(lng - dLng).toFixed(4)},${(lat + dLat).toFixed(4)},${(lng + dLng).toFixed(4)}`;
}

/**
 * Konfigurasi per tempat: kw (regex nama), osmFilter (bagian query kategori OSM),
 * validate (tags) => bool opsional, maxM jarak maks dari posisi lama.
 */
const CFG = {
  "Polresta Kota Bekasi": { kw: "Polresta", osm: `["amenity"="police"]` },
  "Polsek Bekasi Timur": { kw: "Polsek", osm: `["amenity"="police"]`, maxM: 4000 },
  "Polsek Bekasi Barat": { kw: "Polsek", osm: `["amenity"="police"]`, maxM: 4000 },
  "RSUD Dr. Chasbullah Abdul Malik": { kw: "Chasbullah|Chahsabullah", osm: `["amenity"~"^(hospital|clinic)$"]` },
  "RS Bekasi Dharma Hospital": { kw: "Dharma", osm: `["amenity"~"^(hospital|clinic)$"]`, maxM: 4000 },
  "RS Siloam Bekasi": { kw: "Siloam", osm: `["amenity"~"^(hospital|clinic)$"]` },
  "Puskesmas Bekasi Selatan": { kw: "Puskesmas", osm: `["amenity"~"^(clinic|doctors)$"]["name"~"Puskesmas",i]`, maxM: 6000 },
  "Puskesmas Sumur Batu": { kw: "Puskesmas|Sumur Batu", osm: `["amenity"~"^(clinic|doctors)$"]["name"~"Puskesmas|Sumur Batu",i]`, maxM: 6000 },
  "Summarecon Mall Bekasi": { kw: "Summarecon", osm: `["shop"="mall"]` },
  "Grand Metropolitan Mall": { kw: "Metropolitan", osm: `["shop"="mall"]` },
  "Stasiun Bekasi (KAI)": { kw: "Stasiun Bekasi", osm: `["railway"="station"]` },
  "Masjid Agung Al-Barkah": { kw: "Al-?Barkah", osm: `["amenity"="place_of_worship"]`, maxM: 4000 },
  "Masjid Raya Al-Azhar Grand Mosque": { kw: "Al-?Azhar", osm: `["amenity"="place_of_worship"]`, maxM: 4000 },
  "Pos Keamanan Summarecon": null,
  "Pos Keamanan Kemang Pratama": null,
  "Indomaret Jalan Ahmad Yani": { kw: "Indomaret", osm: `["shop"="convenience"]`, maxM: 3000 },
  "Alfamart Caman Raya": { kw: "Alfamart", osm: `["shop"="convenience"]`, maxM: 3000 },
  "Pasar Kranji (Pengamanan)": { kw: "Kranji", osm: `["railway"~"^(station|halt)$"]`, maxM: 3000 },
  "DAMRI Kartini (Angkutan Umum)": { kw: "Damri|Terminal|Kayuringin", osm: `["amenity"="bus_station"]`, maxM: 4000 },
  "Transmart Bekasi (Pintu Timur)": { kw: "Transmart", osm: `["name"~"Transmart",i]`, maxM: 4000 },
};

async function main() {
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();
  const snap = await db.collection("places").get();

  let updated = 0;
  const unmatched = [];

  for (const d of snap.docs) {
    const p = d.data();
    const cfg = CFG[p.name];
    if (!cfg) {
      unmatched.push(p.name);
      console.log(`⏭️  Skip (review manual): ${p.name}`);
      continue;
    }
    // bbox mengikuti maxM (default 2 km)
    const maxM = cfg.maxM ?? 2000;
    const dLat = Math.min(0.05, maxM / 111000);
    const dLng = Math.min(0.06, maxM / 111000 / Math.cos((p.lat * Math.PI) / 180));
    const q = `[out:json][timeout:30];
(
  node(${bbox(p.lat, p.lng, dLat, dLng)})["name"]${cfg.osm};
  way(${bbox(p.lat, p.lng, dLat, dLng)})["name"]${cfg.osm};
);
out center tags;`;
    const data = await overpass(q);
    await sleep(1200); // jeda antar tempat — sopan
    const pois = (data?.elements ?? []).filter((e) => e.tags?.name && (e.lat || e.center));
    const re = new RegExp(cfg.kw, "i");
    const cands = pois
      .map((e) => {
        const [lat, lng] = e.lat ? [e.lat, e.lon] : [e.center.lat, e.center.lon];
        return { lat, lng, name: e.tags.name, dist: distM(p.lat, p.lng, lat, lng) };
      })
      .filter((c) => re.test(c.name) && insideBekasi(c.lat, c.lng) && c.dist <= maxM)
      .sort((a, b) => a.dist - b.dist);

    if (cands.length === 0) {
      unmatched.push(p.name);
      console.log(`⚠️  Tidak ada match: ${p.name}`);
      continue;
    }
    const best = cands[0];
    await d.ref.update({ lat: best.lat, lng: best.lng });
    console.log(`✅ ${p.name} → ${best.lat.toFixed(6)}, ${best.lng.toFixed(6)} ("${best.name}", ${Math.round(best.dist)} m)`);
    updated++;
  }

  console.log(`\nSelesai: ${updated} diperbarui.`);
  if (unmatched.length) console.log("Review manual:", unmatched.join(", "));
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Gagal:", e.message);
  process.exit(1);
});
