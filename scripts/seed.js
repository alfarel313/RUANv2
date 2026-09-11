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

// ─── Tempat aman (places) — KOORDINAT VERIFIKASI OSM (Overpass/Nominatim, 2026-09-08) ───
// Semua koordinat diambil dari POI OSM sungguhan (konsisten dengan tiles peta) dan
// telah divalidasi berada di dalam polygon Kota Bekasi. Lihat scripts/geocode-overpass.js
const PLACES = [
  { name: "Polres Metro Bekasi Kota", type: "polisi", lat: -6.2444689, lng: 106.9995275, address: "Jl. Ahmad Yani, Bekasi", open: "00:00", close: "00:00", phone: "110", city: "Bekasi" },
  { name: "Polsek Bekasi Selatan", type: "polisi", lat: -6.2672360, lng: 106.9753370, address: "Bekasi Selatan", open: "00:00", close: "00:00", phone: "110", city: "Bekasi" },
  { name: "Polsek Pondok Gede", type: "polisi", lat: -6.2832520, lng: 106.9136260, address: "Jl. Pahlawan, Bekasi", open: "00:00", close: "00:00", phone: "110", city: "Bekasi" },
  { name: "RSUD dr. Chasbullah Abdul Majid", type: "rumah_sakit", lat: -6.2421600, lng: 107.0015520, address: "Jl. Mayor Oking, Bekasi", open: "00:00", close: "00:00", phone: "119", city: "Bekasi" },
  { name: "RS Bhakti Kartini", type: "rumah_sakit", lat: -6.2480820, lng: 107.0015540, address: "Jl. Veteran Raya, Bekasi", open: "00:00", close: "00:00", phone: "119", city: "Bekasi" },
  { name: "RS Siloam Bekasi", type: "rumah_sakit", lat: -6.2425970, lng: 107.0260560, address: "Jl. Jenderal Sudirman, Bekasi", open: "00:00", close: "00:00", phone: "1500169", city: "Bekasi" },
  { name: "UPTD Puskesmas Pekayon Jaya", type: "puskesmas", lat: -6.2668900, lng: 106.9748120, address: "Jl. Raya Pekayon, Bekasi Selatan", open: "07:30", close: "17:00", phone: null, city: "Bekasi" },
  { name: "UPTD Puskesmas Sumur Batu", type: "puskesmas", lat: -6.3438671, lng: 107.0048226, address: "Jl. Pangkalan 2, Sumurbatu", open: "07:30", close: "17:00", phone: null, city: "Bekasi" },
  { name: "Summarecon Mall Bekasi", type: "mall", lat: -6.2260430, lng: 107.0002260, address: "Jl. Boulevard Ahmad Yani, Bekasi", open: "10:00", close: "22:00", phone: null, city: "Bekasi" },
  { name: "Grand Metropolitan", type: "mall", lat: -6.2487620, lng: 106.9844380, address: "Jl. K.H. Agus Salim, Bekasi", open: "10:00", close: "22:00", phone: null, city: "Bekasi" },
  { name: "Stasiun Bekasi", type: "stasiun", lat: -6.2362140, lng: 106.9987440, address: "Jl. Insinyur H. Juanda, Bekasi", open: "04:00", close: "23:00", phone: null, city: "Bekasi" },
  { name: "Masjid Agung Al-Barkah", type: "masjid", lat: -6.2407680, lng: 106.9995370, address: "Jl. Ahmad Yani, Bekasi", open: "04:00", close: "21:00", phone: null, city: "Bekasi" },
  { name: "Masjid Jami Al-Azhar Jakapermai", type: "masjid", lat: -6.2482080, lng: 106.9728400, address: "Jl. Cemara Raya, Jakapermai", open: "04:00", close: "21:00", phone: null, city: "Bekasi" },
  { name: "Pos Keamanan Summarecon", type: "pos_keamanan", lat: -6.2265000, lng: 106.9998000, address: "Jl. Boulevard, Bekasi", open: "00:00", close: "00:00", phone: null, city: "Bekasi" },
  { name: "Pos Keamanan Kemang Pratama", type: "pos_keamanan", lat: -6.2580000, lng: 106.9690000, address: "Kemang Pratama, Bekasi Selatan", open: "06:00", close: "23:00", phone: null, city: "Bekasi" },
  { name: "Indomaret Gabus", type: "toko", lat: -6.2468250, lng: 106.9846400, address: "Jl. Ahmad Yani, Bekasi", open: "00:00", close: "00:00", phone: null, city: "Bekasi" },
  { name: "Alfamart", type: "toko", lat: -6.2470280, lng: 106.9846510, address: "Jl. Caman Raya, Bekasi Timur", open: "06:00", close: "23:00", phone: null, city: "Bekasi" },
  { name: "Stasiun Kranji", type: "stasiun", lat: -6.2245130, lng: 106.9798270, address: "Kranji, Bekasi Barat", open: "05:00", close: "20:00", phone: null, city: "Bekasi" },
  { name: "Terminal Damri Kayuringin", type: "stasiun", lat: -6.2443330, lng: 106.9906030, address: "Jl. Kartini, Kayuringin, Bekasi", open: "05:00", close: "21:00", phone: null, city: "Bekasi" },
  { name: "Transmart Juanda Bekasi", type: "mall", lat: -6.2492030, lng: 107.0169280, address: "Jl. Ahmad Yani, Bekasi Timur", open: "10:00", close: "22:00", phone: null, city: "Bekasi" },
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
      "- Nyalakan **Mode Teks Besar** dan **Mode Malam** di RUAN (Akun > Pengaturan) agar mudah dibaca",
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
      "- **Mode Malam & Teks Besar**: Akun > Pengaturan",
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
  // ─── Laporan begal demo (verified, umur < 7 hari) — TITIK MENEMPEL DI JALAN ASLI
  //     Koordinat diambil dari geometri rute OSRM Metro→Transmart (rute tercepat,
  //     koridor Agus Salim–Juanda), sengaja TIDAK menyentuh rute alternatif selatan
  //     (Pekayon) supaya algoritma Rute Aman benar-benar menghindarinya saat demo:
  //     jalur Metro→Transmart, rute alternatif +1.3 km (≈+16 mnt) vs penalti begal
  //     15 mnt → skor alternatif menang → polyline membelok selatan + marker merah.
  //     CATATAN: window kejahatan 7 hari — JALANKAN ULANG `npm run seed` sebelum hari demo.
  {
    type: "kejahatan",
    title: "Begal motor di Jl. Agus Salim dekat Metro",
    description:
      "Pria motor tanpa helm merampas tas pejalan kaki pukul 21:10. Koridor Agus Salim rawan setelah mal tutup — bila sendirian, pilih jalur selatan (Pekayon) yang lebih ramai.",
    lat: -6.2498020, lng: 106.9983120, status: "verified",
    reporterName: "Warga Bekasi Timur", city: "Bekasi",
    ageHours: 5,
  },
  {
    type: "kejahatan",
    title: "Perampasan di koridor Juanda timur",
    description:
      "Dua pelaku motor menodongkan benda tajam merampas HP warga pulang kerja pukul 22:40. Sering terjadi di koridor Juanda bagian timur malam hari — waspada bila lewat sendirian.",
    lat: -6.2556060, lng: 107.0040510, status: "verified",
    reporterName: "Warga Bekasi", city: "Bekasi",
    ageHours: 9,
  },
  {
    type: "kejahatan",
    title: "Perampasan di gang menuju Stasiun Bekasi",
    description:
      "Gang sempit penghubung menuju stasiun jadi titik rawan begal subuh (04:30-05:30) terhadap pejalan naik kerja pagi. Gunakan jalur utama Stasiun yang terang.",
    lat: -6.2372680, lng: 107.0002100, status: "verified",
    reporterName: "Warga Kranji", city: "Bekasi",
    ageHours: 30,
  },
  // ─── 15 LAPORAN SEBARAN KOTA (verified, tersebar 12 kecamatan, koordinat
  //     menempel jalan utama asli via Overpass scripts/_roads.js — JAUH dari
  //     koridor demo Metro→Transmart agar algoritma demo tak terganggu;
  //     Pekayon (rute alternatif demo) SENGAJA TIDAK diberi insiden) ───
  {
    type: "jalan_rusak",
    title: "Aspal rusak berlubang di Jalan Caman Raya",
    description:
      "Bekas galian pipa belum diratakan, lubang memanjang 5 meter di lajur kiri. Motor tergelincir saat hujan — kurangi kecepatan.",
    lat: -6.256381, lng: 106.951186, status: "verified",
    reporterName: "Warga Caman", city: "Bekasi",
    ageHours: 20,
  },
  {
    type: "kejahatan",
    title: "HP dirampas dua motor di Boulevard Raya Barat",
    description:
      "Dua pelaku motor menutup lajur dan merampas HP pejalan kaki malam hari (21:00-23:00). Hindari trotoar sepi, pilih jalur dekat minimarket.",
    lat: -6.277288, lng: 106.974349, status: "verified",
    reporterName: "Warga Bekasi Selatan", city: "Bekasi",
    ageHours: 18,
  },
  {
    type: "banjir",
    title: "Genangan pinggir jalan Jatibening",
    description:
      "Drainase tersumbat sampah, genangan 20 cm memutup bahu jalan sejak sore. Motor disarankan jalur tengah, waspada mobil cipratan.",
    lat: -6.249895, lng: 106.943883, status: "verified",
    reporterName: "Warga Jatibening", city: "Bekasi",
    ageHours: 5,
  },
  {
    type: "kehilangan",
    title: "Dompet hilang di sekitar Jalan RA. Kartini",
    description:
      "Dompet berisi KTP dan kartu bank hilang di area pertokoan, kemungkinan jatuh atau dicopet saat ramai. Pemilik berharap dikembalikan via warga sekitar.",
    lat: -6.249415, lng: 107.000467, status: "verified",
    reporterName: "Warga Kayuringin", city: "Bekasi",
    ageHours: 10,
  },  {
    type: "jalan_rusak",
    title: "Marka pudar + aspal bergelombang di Jenderal Sudirman",
    description:
      "Permukaan bergelombang dan marka memudar di beberapa titik terang. Rawan kecelakaan saat sore matahari condong — nyalakan lampu lebih awal.",
    lat: -6.224503, lng: 106.978172, status: "verified",
    reporterName: "Warga Bekasi Barat", city: "Bekasi",
    ageHours: 40,
  },
  {
    type: "kejahatan",
    title: "Begal motor di Jalan Nusantara sepulang kerja",
    description:
      "Pelaku tunggal motor mengejar pejalan kaki dan merampas tas pukul 22:00 di depan ruko sepi. Koridor ini gelap setelah toko tutup — pilih jalur Ahmad Yani.",
    lat: -6.244725, lng: 107.040345, status: "verified",
    reporterName: "Warga Bekasi Timur", city: "Bekasi",
    ageHours: 14,
  },
  {
    type: "lainnya",
    title: "Lampu jalan mati beramai-ramai Grand Lake Boulevard",
    description:
      "Lima tiang lampu jalan mati berurutan membuat koridor gelap total setelah pukul 19:00. Warga malam dianjurkan lewat jalur utama yang terang.",
    lat: -6.299526, lng: 107.063491, status: "verified",
    reporterName: "Warga Galaxy", city: "Bekasi",
    ageHours: 26,
  },
  {
    type: "kejahatan",
    title: "Pencurian motor di parkiran Jalan Pahlawan",
    description:
      "Dua motor hilang dalam seminggu dari parkiran liar tanpa penjaga (22:00-04:00). Gunakan parkiran berjaga atau area dekat pos keamanan.",
    lat: -6.236625, lng: 107.027406, status: "verified",
    reporterName: "Warga Duren Jaya", city: "Bekasi",
    ageHours: 22,
  },
  {
    type: "banjir",
    title: "Air meluap ke jalan di Jatibening 2",
    description:
      "Luapan kali kecil menutup satu lajur setelah hujan 2 jam. Kedalaman memutih di tikungan — motor disarankan berbalik arah via Jatibening Raya.",
    lat: -6.257934, lng: 106.942055, status: "verified",
    reporterName: "Warga Jatibening", city: "Bekasi",
    ageHours: 3,
  },
  {
    type: "kebakaran",
    title: "Kebakaran kecil kios terjaga di Celebration Boulevard",
    description:
      "Kios kelontong terbakar akibat konslet listrik, padam dalam 15 menit. Asap sempat menutup jalan — hindari area saat evakuasi berlangsung.",
    lat: -6.291403, lng: 107.045045, status: "verified",
    reporterName: "Warga Bekasi Selatan", city: "Bekasi",
    ageHours: 28,
  },
  {
    type: "jalan_rusak",
    title: "Trotoar retak & ambles di West Gateway Boulevard",
    description:
      "Trotoar ambles di dua titik bekas saluran air, berbahaya untuk kursi roda dan lansia. Penyandang disabilitas disarankan jalur dalam ruko.",
    lat: -6.278285, lng: 107.047664, status: "verified",
    reporterName: "Warga Mustika Jaya", city: "Bekasi",
    ageHours: 35,
  },
  {
    type: "kejahatan",
    title: "Terkutilat tipu pinjam HP di Boulevard Hijau Raya",
    description:
      "Modus pinjam HP 'telepon darurat' lalu kabur — dua korban dalam sepekan di sekitar kompleks. Tolak permintaan barang dari orang asing.",
    lat: -6.186343, lng: 106.980614, status: "verified",
    reporterName: "Warga Harapan Jaya", city: "Bekasi",
    ageHours: 44,
  },
  {
    type: "kehilangan",
    title: "Motor hilang dari garasi dekat Caman Raya",
    description:
      "Beberapa warga melaporkan sepeda motor hilang dari garasi terbuka malam hari di lingkungan padat. Kunci ganda dan parkir dalam.",
    lat: -6.259900, lng: 106.954800, status: "verified",
    reporterName: "Warga Caman", city: "Bekasi",
    ageHours: 50,
  },
  {
    type: "lainnya",
    title: "Kerumunan preman di ujung Jalan Jatibening",
    description:
      "Kelompok preman meminta uang 'parkir paksa' di ujung jalan menuju pasar sore hari. Hindari konflik, lewat jalur alternatif atau minta bantuan pos keamanan.",
    lat: -6.260944, lng: 106.944378, status: "verified",
    reporterName: "Warga Jatibening", city: "Bekasi",
    ageHours: 12,
  },
  {
    type: "banjir",
    title: "Genangan tinggi flyover Pekayon Raya utara",
    description:
      "Depresi flyover tergenang 30 cm setiap hujan deras, air mengalir deras melintang. Pejalan kaki dan lansia dianjurkan menyeberang lebih awal.",
    lat: -6.252600, lng: 106.995900, status: "verified",
    reporterName: "Warga Pekayon", city: "Bekasi",
    ageHours: 7,
  },
  {
    type: "kejahatan",
    title: "Sander tipu jual elektronik di sudut Kartini",
    description:
      "Penipuan jual HP 'bensin habis' dengan barang palsu menargetkan pejalan kaki. Jangan berhenti bila diberi tanda untuk menawar.",
    lat: -6.254100, lng: 107.000900, status: "verified",
    reporterName: "Warga Bekasi Kota", city: "Bekasi",
    ageHours: 16,
  },
];

async function seed() {
  const batch = db.batch();

  // places — hanya hapus dokumen ber-flag seeded (dokumen hasil kelola admin SELAMAT
  // dari re-seed; admin edit menghapus flag sehingga dokumen jadi milik admin).
  // CATATAN: dokumen seeded yang SUDAH diedit admin kehilangan flag → saat re-seed
  // versi aslinya di-tambah ulang sebagai dokumen seeded baru; itu perilaku yang benar.
  const placesCol = db.collection("places");
  const placesSnap = await placesCol.get();
  if (!placesSnap.empty) {
    placesSnap.forEach((d) => {
      if (d.data().seeded === true) batch.delete(d.ref);
    });
  }
  // 20 tempat kurasi + 121 POI OSM (fetch-places-osm.js) — digabung, seeded:true
  const osmPlaces = fs.existsSync(path.join(__dirname, "places-osm.json"))
    ? JSON.parse(fs.readFileSync(path.join(__dirname, "places-osm.json"), "utf8"))
    : [];
  const allPlaces = [...PLACES, ...osmPlaces];
  allPlaces.forEach((p) => {
    batch.set(placesCol.doc(), { ...p, seeded: true });
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
      photos: [],
      photoURL: null,
      reporterUid: "seed",
      createdAt: Date.now() - ageHours * 3600 * 1000,
      verifiedBy: rest.status === "verified" ? "seed-admin" : null,
      verifiedAt: rest.status === "verified" ? Date.now() - ageHours * 3600 * 1000 + 600000 : null,
    });
  });

  await batch.commit();
  console.log(
    `✅ Seed selesai: ${allPlaces.length} places (20 kurasi + ${osmPlaces.length} OSM), ${GUIDES.length} guides, ${REPORTS.length} reports`
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
