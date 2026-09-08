// Cari 1 POI spesifik via Overpass — usage: node scripts/find-poi.js "<regex nama>" "<osm filter>" <lat> <lng> <radiusM>
const [, , kw, osm, latS, lngS, radS] = process.argv;
const lat = parseFloat(latS);
const lng = parseFloat(lngS);
const rad = parseFloat(radS ?? 3000);
const dLat = rad / 111000;
const dLng = rad / 111000 / Math.cos((lat * Math.PI) / 180);
const bbox = `${(lat - dLat).toFixed(4)},${(lng - dLng).toFixed(4)},${(lat + dLat).toFixed(4)},${(lng + dLng).toFixed(4)}`;
const q = `[out:json][timeout:25];
(
  node(${bbox})["name"]${osm};
  way(${bbox})["name"]${osm};
);
out center tags;`;

const ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];
(async () => {
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "RUAN-RuteAmanBekasi/1.0",
          Accept: "application/json",
        },
        body: new URLSearchParams({ data: q }).toString(),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        console.log(`${url}: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const re = new RegExp(kw, "i");
      for (const e of data.elements ?? []) {
        const name = e.tags?.name;
        if (!name) continue;
        const [ela, elo] = e.lat ? [e.lat, e.lon] : [e.center?.lat, e.center?.lon];
        if (re.test(name)) {
          console.log(`MATCH: ${name} → ${ela}, ${elo}  (${e.tags?.amenity ?? e.tags?.shop ?? e.tags?.railway ?? ""})`);
        }
      }
      return;
    } catch (e) {
      console.log(`${url}: ${e.message}`);
    }
  }
  console.log("Semua endpoint gagal");
})();
