/** Diagnosa beacon: daftar dokumen beacons + presence segar — jalankan: node scripts/diag-beacons.js */
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

const keyPath = path.join(__dirname, "..", "serviceAccountKey.json");
if (!fs.existsSync(keyPath)) {
  console.error("serviceAccountKey.json tidak ada.");
  process.exit(1);
}
initializeApp({ credential: cert(JSON.parse(fs.readFileSync(keyPath, "utf8"))) });
const db = getFirestore();

(async () => {
  const bSnap = await db.collection("beacons").get();
  const pSnap = await db.collection("presence").get();
  const now = Date.now();
  console.log(`beacons: ${bSnap.size} dokumen, presence: ${pSnap.size} dokumen`);
  bSnap.forEach((d) => {
    const b = d.data();
    const fresh = now - (b.updatedAt ?? 0) < 60_000;
    console.log(
      `  ${d.id} count=${b.count} lowSince=${b.lowSince ?? "-"} umur=${Math.round((now - (b.updatedAt ?? 0)) / 1000)}s ${fresh ? "segar" : "STALE"}`
    );
  });
  pSnap.forEach((d) => {
    const p = d.data();
    const age = Math.round((now - (p.updatedAt ?? 0)) / 1000);
    console.log(`  presence ${d.id} umur=${age}s ${age < 60 ? "segar" : "KEDALUWARSA"}`);
  });
  process.exit(0);
})();
