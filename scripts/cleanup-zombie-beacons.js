/** Bersihkan dokumen beacon TANPA lat/lng valid (zombie hasil race) — sekali jalan */
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");
const keyPath = path.join(__dirname, "..", "serviceAccountKey.json");
initializeApp({ credential: cert(JSON.parse(fs.readFileSync(keyPath, "utf8"))) });
const db = getFirestore();
(async () => {
  const snap = await db.collection("beacons").get();
  let n = 0;
  for (const d of snap.docs) {
    const b = d.data();
    if (typeof b.lat !== "number" || typeof b.lng !== "number") {
      await d.ref.delete();
      n++;
      console.log("DIHAPUS zombie:", d.id, JSON.stringify(Object.keys(b)));
    }
  }
  console.log(`selesai: ${n} zombie dihapus dari ${snap.size} dokumen`);
  process.exit(0);
})();
