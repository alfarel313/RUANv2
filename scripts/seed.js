/**
 * Seed Firestore RUAN — Rute Aman Bekasi
 * Butuh: serviceAccountKey.json di root project (dari Firebase Console >
 * Project Settings > Service Accounts > Generate new private key).
 * Jalankan: node scripts/seed.js
 */
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

const keyPath = path.join(__dirname, "..", "serviceAccountKey.json");
if (!fs.existsSync(keyPath)) {
  console.error(
    "❌ serviceAccountKey.json tidak ditemukan di root project.\n" +
      "   Firebase Console > Project Settings > Service Accounts > Generate new private key."
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const ADMIN_EMAILS = ["alfarel3134@gmail.com"];

// ─── Tempat aman (places) — koordinat aproksimasi area pusat Kota Bekasi ───
const PLACES = [
  { name: "Polresta Kota Bekasi", type: "polisi", lat: -6.2375, lng: 106.9806, address: "Jl. Ahmad Yani, Bekasi", open: "00:00", close: "00:00", phone: "110", city: "Bekasi" },
  { name: "Polsek Bekasi Timur", type: "polisi", lat: -6.2310, lng: 106.9960, address: "Jl. Cut Meutia, Bekasi Timur", open: "00:00", close: "00:00", phone: "110", city: "Bekasi" },
  { name: "Polsek Bekasi Barat", type: "polisi", lat: -6.2420, lng: 106.9560, address: "Jl. Pahlawan, Bekasi Barat", open: "00:00", close: "00:00", phone: "110", city: "Bekasi" },
  { name: "RSUD Dr. Chasbullah Abdul Malik", type: "rumah_sakit", lat: -6.2412, lng: 106.9834, address: "Jl. Caman Raya, Jatiwaringin", open: "00:00", close: "00:00", phone: "119", city: "Bekasi" },
  { name: "RS Bekasi Dharma Hospital", type: "rumah_sakit", lat: -6.2405, lng: 106.9820, address: "Jl. Veterans, Bekasi", open: "00:00", close: "00:00", phone: "119", city: "Bekasi" },
  { name: "RS Siloam Bekasi", type: "rumah_sakit", lat: -6.2300, lng: 106.9830, address: "Jl. Jenderal Sudirman, Bekasi", open: "00:00", close: "00:00", phone: "1500169", city: "Bekasi" },
  { name: "Puskesmas Bekasi Selatan", type: "puskesmas", lat: -6.2620, lng: 106.9820, address: "Jl. Raya Pekayon, Bekasi Selatan", open: "07:30", close: "17:00", phone: null, city: "Bekasi" },
  { name: "Puskesmas Sumur Batu", type: "puskesmas", lat: -6.2280, lng: 106.9720, address: "Jl. Raya Sumur Batu, Bekasi Timur", open: "07:30", close: "17:00", phone: null, city: "Bekasi" },
  { name: "Summarecon Mall Bekasi", type: "mall", lat: -6.2380, lng: 106.9850, address: "Jl. Boulevard Ahmad Yani No.1, Bekasi", open: "10:00", close: "22:00", phone: null, city: "Bekasi" },
  { name: "Grand Metropolitan Mall", type: "mall", lat: -6.2410, lng: 106.9810, address: "Jl. K.H. Agus Salim No.1, Bekasi", open: "10:00", close: "22:00", phone: null, city: "Bekasi" },
  { name: "Stasiun Bekasi (KAI)", type: "stasiun", lat: -6.2380, lng: 106.9920, address: "Jl. Stasiun, Bekasi", open: "04:00", close: "23:00", phone: null, city: "Bekasi" },
  { name: "Masjid Agung Al-Barkah", type: "masjid", lat: -6.2350, lng: 106.9780, address: "Jl. Ahmad Yani, Bekasi", open: "04:00", close: "21:00", phone: null, city: "Bekasi" },
  { name: "Masjid Raya Al-Azhar Grand Mosque", type: "masjid", lat: -6.2300, lng: 106.9900, address: "Jl. A. Yani, Bekasi Timur", open: "04:00", close: "21:00", phone: null, city: "Bekasi" },
  { name: "Pos Keamanan Summarecon", type: "pos_keamanan", lat: -6.2400, lng: 106.9870, address: "Jl. Boulevard, Bekasi", open: "00:00", close: "00:00", phone: null, city: "Bekasi" },
  { name: "Pos Keamanan Kemang Pratama", type: "pos_keamanan", lat: -6.2580, lng: 106.9690, address: "Kemang Pratama, Bekasi Selatan", open: "06:00", close: "23:00", phone: null, city: "Bekasi" },
  { name: "Indomaret Jalan Ahmad Yani", type: "toko", lat: -6.2390, lng: 106.9790, address: "Jl. Ahmad Yani, Bekasi", open: "00:00", close: "00:00", phone: null, city: "Bekasi" },
  { name: "Alfamart Caman Raya", type: "toko", lat: -6.2440, lng: 106.9900, address: "Jl. Caman Raya, Bekasi Timur", open: "06:00", close: "23:00", phone: null, city: "Bekasi" },
  { name: "Pasar Kranji (Pengamanan)", type: "pos_keamanan", lat: -6.2200, lng: 106.9840, address: "Kranji, Bekasi Barat", open: "05:00", close: "20:00", phone: null, city: "Bekasi" },
  { name: "DAMRI Kartini (Angkutan Umum)", type: "stasiun", lat: -6.2330, lng: 106.9800, address: "Jl. Kartini, Bekasi", open: "05:00", close: "21:00", phone: null, city: "Bekasi" },
  { name: "Transmart Bekasi (Pintu Timur)", type: "mall", lat: -6.2350, lng: 106.9950, address: "Jl. Ahmad Yani, Bekasi Timur", open: "10:00", close: "22:00", phone: null, city: "Bekasi" },
];

// ─── Panduan (guides) ───
const GUIDES = [
  {
    slug: "saat-banjir",
    title: "Saat Banjir: Langkah Pertama yang Aman",
    category: "banjir",
    icon: "🌊",
    order: 1,
    content: [
      "## Sebelum banjir datang",
      "- Simpan dokumen penting dalam plastik kedap air",
      "- Isi daya HP penuh dan siapkan senter",
      "- Hafalkan nomor darurat: **112** (satu nomor untuk semua)",
      "## Saat banjir datang",
      "- **Segera pindah ke tempat tinggi** — jangan menunggu",
      "- Jangan berjalan atau berkendara melintasi air mengalir 15 cm — Anda bisa terseret",
      "- Matikan listrik dari MCB bila air mulai masuk rumah",
      "## Untuk lansia & disabilitas",
      "- Minta bantuan tetangga lebih awal — jangan tunggu air tinggi",
      "- Gunakan tombol **DARURAT** di RUAN: sistem menunjukkan rute ke tempat ramai/aman terdekat",
      "- Bawa tongkat/kursi roda hanya bila aman; keselamatan diri nomor satu",
      "## Untuk orang tua & anak",
      "- Ajari anak: **ikuti orang dewasa, jangan main air**",
      "- Cek info bahaya terverifikasi di RUAN sebelum berangkat sekolah",
    ].join("\n\n"),
  },
  {
    slug: "saat-kebakaran",
    title: "Saat Kebakaran: Keluar dengan Cepat dan Tepat",
    category: "kebakaran",
    icon: "🔥",
    order: 2,
    content: [
      "## Prinsip utama",
      "- **Nyawa lebih berharga dari barang** — keluar segera",
      "- Jangan pernah kembali ke dalam untuk mengambil apa pun",
      "## Saat terjebak asap",
      "- Merangkak rendah — udara bersih ada di bawah",
      "- Basahi kain, tutup hidung dan mulut",
      "## Untuk lansia & disabilitas",
      "- Gunakan tombol **DARURAT** RUAN — bagikan lokasi Anda ke orang terdekat",
      "- Bila kursi roda tak bisa lewat tangga darurat: tunggu di area aman terdekat, buka jendela, beri tanda ke penyelamat",
      "- Penyandang tuli: pasang alarm asap visual (lampu kedip) di rumah",
      "## Mencegah di rumah",
      "- Jangan mengisi daya HP di kasur/kursi berbahan mudah terbakar",
      "- Cabut colokan bila rumah akan ditinggal lama",
    ].join("\n\n"),
  },
  {
    slug: "aman-di-jalan",
    title: "Aman Beraktivitas di Jalan",
    category: "kejahatan",
    icon: "🚨",
    order: 3,
    content: [
      "## Pilih rute yang terpantau",
      "- Lihat **Crowd Beacon** di peta RUAN — titik ramai warga cenderung lebih aman",
      "- Pilih jalan yang terang dan ada orang, hindari jalan sepi meski lebih dekat",
      "## Perhatikan sekitar",
      "- Jangan gunakan earphone kedua telinga saat berjalan malam",
      "- Pegang tas di sisi dalam, menjauh dari arah lalu lintas",
      "## Bila merasa diikuti",
      "- Masuk ke tempat ramai: minimarket, masjid, mal — lihat yang **sedang buka** di RUAN",
      "- Tekan tombol **DARURAT**: sistem menunjukkan tempat aman terdekat",
      "## Untuk anak-anak",
      "- Ajari: menolak ajakan orang asing, lari ke tempat ramai, teriak **TOLONG**",
      "- Anak sebaiknya beraktivitas berkelompok, bukan sendirian",
    ].join("\n\n"),
  },
  {
    slug: "anak-anak",
    title: "Panduan Keselamatan untuk Anak",
    category: "anak",
    icon: "🧒",
    order: 4,
    content: [
      "## Aturan emas",
      "- Selalu bersama teman atau orang dewasa — jangan sendirian",
      "- Hafalkan nama lengkap dan nomor HP orang tua",
      "## Bila tersesat",
      "- Cari **orang berseragam**: polisi, petugas mal, satpam",
      "- Atau pergi ke minimarket terdekat — minta bantuan menelpon orang tua",
      "- Jangan ikut orang yang mengaku kenal orang tua bila tidak yakin",
      "## Bila ada orang asing mengajak",
      "- **Tidak — Lari - Lapor**. Bilang tidak, lari ke tempat ramai, lapor ke orang tua",
      "## Buat bersama orang tua",
      "- Tentukan **titik temu** keluarga bila terpisah di mall/pasar",
      "- Ajari anak membuka RUAN: tombol besar **DARURAT** mudah ditekan anak",
    ].join("\n\n"),
  },
  {
    slug: "lansia",
    title: "Panduan Keselamatan untuk Lansia",
    category: "lansia",
    icon: "👵",
    order: 5,
    content: [
      "## Sebelum keluar rumah",
      "- Nyalakan **Mode Teks Besar** dan **Kontras Tinggi** di RUAN (Akun > Pengaturan) agar mudah dibaca",
      "- Bawa HP dengan daya cukup dan nomor keluarga yang mudah dihubungi",
      "## Berjalan outdoor",
      "- Gunakan rute **beacon ramai** — banyak orang, lebih mudah minta tolong",
      "- Hindari jam sibuk kendaraan bila menggunakan kursi roda/tongkat",
      "## Darurat",
      "- Tombol **DARURAT** RUAN sengaja dibuat besar dan mudah ditekan",
      "- Sistem langsung menunjukkan tempat aman terdekat + tombol panggilan **112**",
      "## Kesehatan",
      "- Bawa obat rutin saat beraktivitas lama",
      "- Jika merasa pusing: duduk dulu, minta tolong orang terdekat, jangan memaksa berjalan",
    ].join("\n\n"),
  },
  {
    slug: "penyandang-disabilitas",
    title: "Panduan untuk Penyandang Disabilitas",
    category: "disabilitas",
    icon: "♿",
    order: 6,
    content: [
      "## RUAN untuk Anda",
      "- **Mode Kontras Tinggi & Teks Besar**: Akun > Pengaturan",
      "- Tombol besar dengan **ikon + teks** — tidak ada ikon tanpa label",
      "- Seluruh tombol dapat diakses keyboard dan pembaca layar (screen reader)",
      "## Penyandang gangguan penglihatan",
      "- Aktifkan **Suara Peringatan** untuk info beacon/darurat",
      "- Tombol DARURAT mengarahkan ke panggilan langsung **112**",
      "## Penyandang gangguan pendengaran",
      "- Semua peringatan RUAN **visual**, bukan hanya suara",
      "- Simpan nomor darurat SMS/wa keluarga di kontak cepat",
      "## Pengguna kursi roda",
      "- Prioritaskan tempat bantuan yang datar dan ramai (mal, puskesmas, stasiun)",
      "- Bila memungkinkan, ajak teman/keluarga saat beraktivitas ke area baru",
    ].join("\n\n"),
  },
  {
    slug: "gempa",
    title: "Saat Gempa Bumi: Berlindung yang Benar",
    category: "umum",
    icon: "🛡️",
    order: 7,
    content: [
      "## Saat guncangan",
      "- **BERLINDUNG di bawah meja kuat**, lindungi kepala dan leher",
      "- Jauhi jendela, kaca, rak tinggi",
      "- JANGAN berlari keluar saat masih guncang — benda jatuh lebih berbahaya",
      "## Setelah guncangan berhenti",
      "- Keluar lewat tangga, bukan lift",
      "- Ke area terbuka, jauhi bangunan tinggi dan tiang listrik",
      "## Untuk disabilitas & lansia",
      "- Pengguna kursi roda: rem-kursi, lindungi kepala dengan bantal/tangan, tunggu guncangan selesai",
      "- Siapkan **tas siap pakai** berisi air, obat, dokumen — mudah dijangkau",
      "## Ikuti info",
      "- Cek feed **Info Bahaya** RUAN untuk info kerusakan terverifikasi admin",
    ].join("\n\n"),
  },
];

// ─── Laporan demo (reports) ───
const REPORTS = [
  {
    type: "banjir",
    title: "Banjir setinggi lutut di Jalan Caman Raya",
    description:
      "Genangan setinggi lutut sejak pukul 15:00. Warga diminta hindari rute ini dan memilih jalan alternatif via Ahmad Yani. Kendaraan roda dua tidak disarankan lewat.",
    lat: -6.2455, lng: 106.9925, status: "verified",
    reporterName: "Warga Bekasi Timur", city: "Bekasi",
    ageHours: 3,
  },
  {
    type: "jalan_rusak",
    title: "Jalan berlubang besar di Jalan Kartini",
    description:
      "Lubang diameter ±1 meter tertutup genangan, sangat berbahaya untuk motor terutama malam hari. Sudah ada 2 motor terjatuh hari ini.",
    lat: -6.2330, lng: 106.9795, status: "verified",
    reporterName: "Warga Bekasi", city: "Bekasi",
    ageHours: 7,
  },
  {
    type: "kejahatan",
    title: "Waspada pencopet di area Pasar Kranji",
    description:
      "Laporan pencopetan meningkat jam 16:00-18:00 di sekitar pasar. Warga diminta menjaga tas di sisi dalam dan menghindari kerumunan rapat.",
    lat: -6.2205, lng: 106.9845, status: "verified",
    reporterName: "Warga Bekasi Barat", city: "Bekasi",
    ageHours: 26,
  },
  {
    type: "kebakaran",
    title: "Pemadaman listrik bergilir di Bekasi Selatan",
    description:
      "Pemadaman bergilir malam ini membuat beberapa jalan gelap. Warga dihimbau berhati-hati bila keluar malam dan memilih rute ramai (lihat beacon di peta RUAN).",
    lat: -6.2605, lng: 106.9825, status: "verified",
    reporterName: "Warga Bekasi Selatan", city: "Bekasi",
    ageHours: 12,
  },
  {
    type: "banjir",
    title: "Kemacetan parah + genangan di flyover Ahmad Yani",
    description:
      "Hujan deras 1 jam menyebabkan genangan di bawah flyover. Kendaraan tertahan ±40 menit. Gunakan rute alternatif Metro Permai.",
    lat: -6.2390, lng: 106.9870, status: "pending",
    reporterName: "Warga Bekasi", city: "Bekasi",
    ageHours: 1,
  },
  {
    type: "kejahatan",
    title: "Motor bermotor merampas HP di Jalan Pahlawan",
    description:
      "Kendaraan Honda Hitam tanpa plat merampas HP pejalan kaki pukul 20:30 di depan toko bangunan. Pelaku kabur ke arah selatan.",
    lat: -6.2430, lng: 106.9665, status: "pending",
    reporterName: "Warga Bekasi Barat", city: "Bekasi",
    ageHours: 2,
  },
  // ─── Laporan begal demo (verified, umur < 7 hari) — koridor jalan utama
  //     supaya algoritma Rute Aman terlihat menghindarinya saat gladi/demo.
  //     CATATAN: window kejahatan 7 hari — JALANKAN ULANG `npm run seed`
  //     sebelum hari demo agar umur tetap segar.
  {
    type: "kejahatan",
    title: "Begal motor di Jalan Ahmad Yani dekat Al-Barkah",
    description:
      "Pria motor tanpa helm merampas tas pejalan kaki pukul 21:10. Kawasan ini sepi setelah mall tutup — hindari bila sendirian, pilih jalur selatan yang lebih ramai.",
    lat: -6.2360, lng: 106.9820, status: "verified",
    reporterName: "Warga Bekasi Timur", city: "Bekasi",
    ageHours: 5,
  },
  {
    type: "kejahatan",
    title: "Begal jam malam di Jalan Kartini dekat Metro",
    description:
      "Dua pelaku motor menodongkan benda tajam merampas HP warga pulang kerja pukul 22:40. Sering terjadi di sepanjang Kartini utara — disarankan lewat Veterans yang ramai.",
    lat: -6.2395, lng: 106.9805, status: "verified",
    reporterName: "Warga Bekasi", city: "Bekasi",
    ageHours: 9,
  },
  {
    type: "kejahatan",
    title: "Perampasan di gang menuju Stasiun Bekasi",
    description:
      "Gang sempit penghubung menuju stasiun jadi titik rawan begal subuh (04:30-05:30) terhadap pejalan naik kerja pagi. Gunakan jalur utama Stasiun yang terang.",
    lat: -6.2370, lng: 106.9900, status: "verified",
    reporterName: "Warga Kranji", city: "Bekasi",
    ageHours: 30,
  },
];

async function seed() {
  const batch = db.batch();

  // places
  const placesCol = db.collection("places");
  const placesSnap = await placesCol.get();
  if (!placesSnap.empty) {
    placesSnap.forEach((d) => batch.delete(d.ref));
  }
  PLACES.forEach((p) => {
    batch.set(placesCol.doc(), { ...p });
  });

  // guides
  const guidesCol = db.collection("guides");
  const guidesSnap = await guidesCol.get();
  if (!guidesSnap.empty) guidesSnap.forEach((d) => batch.delete(d.ref));
  GUIDES.forEach((g) => {
    const { slug, ...rest } = g;
    batch.set(guidesCol.doc(slug), rest);
  });

  // reports
  const reportsCol = db.collection("reports");
  const reportsSnap = await reportsCol.get();
  if (!reportsSnap.empty) reportsSnap.forEach((d) => batch.delete(d.ref));
  REPORTS.forEach((r) => {
    const { ageHours, ...rest } = r;
    batch.set(reportsCol.doc(), {
      ...rest,
      photoURL: null,
      reporterUid: "seed",
      createdAt: Date.now() - ageHours * 3600 * 1000,
      verifiedBy: rest.status === "verified" ? "seed-admin" : null,
      verifiedAt: rest.status === "verified" ? Date.now() - ageHours * 3600 * 1000 + 600000 : null,
    });
  });

  await batch.commit();
  console.log(
    `✅ Seed selesai: ${PLACES.length} places, ${GUIDES.length} guides, ${REPORTS.length} reports`
  );

  // naikkan role admin berdasarkan email whitelist
  const users = await db.collection("users").get();
  let promoted = 0;
  for (const d of users.docs) {
    if (ADMIN_EMAILS.includes(d.data().email)) {
      await d.ref.update({ role: "admin", city: "Bekasi" });
      promoted++;
      console.log(`🛠️  Admin: ${d.data().email}`);
    }
  }
  if (promoted === 0) {
    console.log(
      "ℹ️  Belum ada dokumen users untuk email admin. Login sekali dengan akun admin lalu jalankan seed lagi — atau role akan otomatis 'admin' saat ensureUserDoc (whitelist klien)."
    );
  }
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Seed gagal:", e);
  process.exit(1);
});
