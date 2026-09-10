/**
 * Diagnosa places: hitung dokumen, kelompokkan per status flag `seeded`.
 * Jalankan: node scripts/diag-places.js
 */
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

const keyPath = path.join(__dirname, "..", "serviceAccountKey.json");
if (!fs.existsSync(keyPath)) {
  console.error("serviceAccountKey.json tidak ditemukan");
  process.exit(1);
}
initializeApp({ credential: cert(JSON.parse(fs.readFileSync(keyPath, "utf8"))) });
const db = getFirestore();

(async () => {
  const snap = await db.collection("places").get();
  let withTrue = 0;
  let withFalse = 0;
  let noFlag = 0;
  const noFlagList = [];
  const seen = {};
  const dupCoords = [];
  snap.forEach((d) => {
    const p = d.data();
    if (p.seeded === true) withTrue++;
    else if (p.seeded === false) withFalse++;
    else {
      noFlag++;
      if (noFlagList.length < 5) noFlagList.push(`${d.id}: ${p.name}`);
    }
    const k = `${p.lat},${p.lng}`;
    seen[k] = (seen[k] || 0) + 1;
  });
  Object.entries(seen).forEach(([k, n]) => {
    if (n > 1) dupCoords.push(`${k} x${n}`);
  });
  console.log(JSON.stringify({
    total: snap.size,
    seededTrue: withTrue,
    seededFalse: withFalse,
    tanpaFlag_seedLama: noFlag,
    contohTanpaFlag: noFlagList,
    koordinatDuplikat: dupCoords,
  }, null, 2));
})();
