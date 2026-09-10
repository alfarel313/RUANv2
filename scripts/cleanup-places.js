/**
 * Bersihkan places hasil seed LAMA (dokumen TANPA field `seeded`) — sekali saja.
 * Dokumen ber-flag seeded:true (set canonical) dan hasil kelola admin tidak disentuh.
 * Jalankan: node scripts/cleanup-places.js
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
  const batch = db.batch();
  let del = 0;
  snap.forEach((d) => {
    // hanya dokumen seed pra-T14.2 (tanpa field seeded sama sekali)
    if (d.data().seeded === undefined) {
      batch.delete(d.ref);
      del++;
    }
  });
  if (del > 0) await batch.commit();
  const after = await db.collection("places").get();
  console.log(`Terhapus: ${del}. Sisa: ${after.size} places.`);
})();
