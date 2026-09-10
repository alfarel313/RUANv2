/**
 * Fetch POI OSM (Overpass) 8 kategori di Kota Bekasi → scripts/places-osm.json
 * - Query per kategori (bbox luas Kota Bekasi), node+way center tags
 * - Filter: punya nama, inside polygon Kota Bekasi, dedup koordinat (>50 m antar POI)
 * - Target tambahan ~100-150 tempat (bukan pengganti 20 tempat kurasi existing)
 * Idempotent & sopan (jeda antar kategori). Jalankan: node scripts/fetch-places-osm.js
 */
const fs = require("fs");
const path = require("path");

// Polygon batas Kota Bekasi (ekstrak dari src/lib/batas-bekasi.ts — konsisten app)
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

// bbox kotak pembungkus polygon Bekasi (margin kecil)
const lats = BATAS.map((p) => p[0]);
const lngs = BATAS.map((p) => p[1]);
const BBOX = `${Math.min(...lats)},${Math.min(...lngs)},${Math.max(...lats)},${Math.max(...lngs)}`;
// jam operasional default per kategori (di-lanjut admin via UI kelola bila perlu)
// toko: default NON-24jam (jujur — tanpa data jam OSM, jangan klaim buka tengah malam);
//       cabang 24 jam yang jelas (Point/Plus) diberi 24 jam
const HOURS = {
  polisi: ["00:00", "00:00"],
  rumah_sakit: ["00:00", "00:00"],
  puskesmas: ["07:30", "17:00"],
  masjid: ["04:00", "21:00"],
  toko: ["06:00", "23:00"],
  mall: ["10:00", "22:00"],
  stasiun: ["05:00", "22:00"],
  pos_keamanan: ["00:00", "00:00"],
};

// Nama yang BUKAN tempat itu sendiri (pintu/zona/aula/bagian-fasilitas) — buang
const EXCLUDE_RE = /entrance|pintu masuk|pintu keluar|zone|zona|gate|aula|parkir|parking|layanan|gor |gedung serbaguna|bike area|area parkir|food ?court|main entrance|drop off/i;
// Duplikat kawasan: "Plaza Pondok Gede 2" dsb — cukup satu per kawasan (dedup minM menangkap sisanya
// saat nama persis sama, tapi "… 2" lolos — buang eksplisit)
const EXCLUDE_TAIL_RE = /\b[234]\s*$/;

// Kategori OSM → kategori RUAN (sesuai mapping geocode-overpass + konvensi OSM)
const CATEGORIES = [
  {
    type: "polisi",
    osm: `["amenity"="police"]`,
    kw: "polisi|polsek|polresta|polres|pos polisi",
    limit: 25,
  },
  {
    type: "rumah_sakit",
    osm: `["amenity"="hospital"]`,
    kw: "rs|rumah sakit|hospital|klinik besar",
    limit: 20,
  },
  {
    type: "puskesmas",
    osm: `["amenity"="clinic"]["name"~"Puskesmas",i]`,
    kw: "puskesmas|puskes",
    limit: 20,
  },
  {
    type: "masjid",
    osm: `["amenity"="place_of_worship"]["religion"="muslim"]["name"~"Masjid",i]`,
    kw: "masjid|musholla|mushola",
    limit: 40,
  },
  {
    type: "toko",
    osm: `["shop"~"^(convenience|supermarket)$"]["name"~"Indomaret|Alfamart|Alfamidi|Yomart|Lawson|Circle K|Superindo| Griya|Fresh|Supermarket",i]`,
    kw: "indomaret|alfamart|alfamidi|yomart|lawson|circle k|superindo|supermarket",
    limit: 50,
    minM: 35, // minimarket sering sebelahan beda merek — dedup lebih rapat
  },
  {
    type: "mall",
    osm: `["shop"="mall"]`,
    kw: "mall|metropolitan|grand|summarecon|plaza|square|park",
    limit: 15,
  },
  {
    type: "stasiun",
    osm: `["railway"~"^(station|halt)$"]["public_transport"!="stop_position"]`,
    kw: ".", // semua station/halt — filter inside-polygon yang menyeleksi
    limit: 10,
  },
  {
    type: "pos_keamanan",
    osm: `["amenity"="community_centre"]["name"~"Pos|RW|RT|Kamra|Linmas|Keamanan",i]`,
    kw: "pos|rw|rt|linmas|kamtra|keamanan",
    limit: 15,
  },
];

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
    signal: AbortSignal.timeout(60000),
  }).catch(() => null);
  if (!res || res.status === 429 || res.status === 504) {
    if (attempt >= ENDPOINTS.length * 2) return null;
    await sleep(4000);
    return overpass(q, attempt + 1);
  }
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/(^|[\s(\-/.])([a-z])/g, (m, p, c) => p + c.toUpperCase());
}

(async () => {
  const out = [];
  const seen = []; // koordinat semua POI terpilih — dedup >50 m
  const existing = JSON.parse(
    fs.readFileSync(path.join(__dirname, "places-existing.json"), "utf8")
  );
  existing.forEach((p) => seen.push([p.lat, p.lng, p.name])); // jangan tumpuk 20 tempat kurasi
  const dupExisting = (lat, lng, name, minM = 50) =>
    seen.some(
      ([sLat, sLng, sName]) =>
        (name && sName === name) || distM(sLat, sLng, lat, lng) < minM
    );

  for (const cat of CATEGORIES) {
    const q = `[out:json][timeout:50];
(
  node(${BBOX})["name"]${cat.osm};
  way(${BBOX})["name"]${cat.osm};
);
out center tags;`;
    process.stdout.write(`Fetch ${cat.type}… `);
    const data = await overpass(q);
    await sleep(3000);
    if (!data) {
      console.log("GAGAL (endpoint)");
      continue;
    }
    const re = new RegExp(cat.kw, "i");
    let taken = 0;
    const skipped = { outside: 0, dup: 0, kw: 0 };
    for (const e of data.elements ?? []) {
      if (taken >= cat.limit) break;
      const name = e.tags?.name?.trim();
      if (!name) continue;
      if (EXCLUDE_RE.test(name) || EXCLUDE_TAIL_RE.test(name)) { skipped.kw++; continue; }
      const lat = e.lat ?? e.center?.lat;
      const lng = e.lon ?? e.center?.lon;
      if (typeof lat !== "number" || typeof lng !== "number") continue;
      if (!insideBekasi(lat, lng)) { skipped.outside++; continue; }
      if (!re.test(name)) { skipped.kw++; continue; }
      if (dupExisting(lat, lng, name, cat.minM ?? 50)) { skipped.dup++; continue; }
      seen.push([lat, lng, name]);
      const hours =
        cat.type === "toko" && /point|plus/i.test(name)
          ? ["00:00", "00:00"]
          : HOURS[cat.type];
      out.push({
        name: titleCase(name).slice(0, 100),
        type: cat.type,
        lat: +lat.toFixed(6),
        lng: +lng.toFixed(6),
        address: "",
        open: hours[0],
        close: hours[1],
        phone: null,
        city: "Bekasi",
      });
      taken++;
    }
    console.log(
      `+${taken} (skip: ${skipped.outside} luar, ${skipped.dup} duplikat/dekat, ${skipped.kw} tak-match)`
    );
  }

  // tulis file — seed.js akan merge
  fs.writeFileSync(
    path.join(__dirname, "places-osm.json"),
    JSON.stringify(out, null, 2),
    "utf8"
  );
  const perType = {};
  out.forEach((p) => (perType[p.type] = (perType[p.type] ?? 0) + 1));
  console.log(`\nTotal: ${out.length} POI → scripts/places-osm.json`);
  console.log("Per kategori:", JSON.stringify(perType));
})();
