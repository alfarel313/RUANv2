# RUAN — Rute Aman Bekasi

> Platform keselamatan perkotaan berbasis komunikasi untuk Kota Bekasi.
> Lomba **Exasti** — tema SDG 11 *Public Safe Space*, subtema akses real-time & inklusivitas (disabilitas, lansia, anak-anak).

RUAN membantu warga bergerak aman: melihat keramaian (crowd beacon) secara live, menghindari titik bahaya terverifikasi, dan mendapat **Rute Aman** — rute motor tercepat yang otomatis menghindari titik begal/banjir/jalan rusak — semuanya dalam satu app, tanpa keluar ke Google Maps.

---
**RUAN DIBUAT OLEH :**

**Universitas Gunadarma**

- Subkhan Ravi Ramadhan
- Muhammad Alfarel
- Ridwan Dwi Saputro
- Ramadhan Dwi Saputra
  
---

## Fitur Utama

### 🗺️ Peta Live (halaman utama)
- Peta Kota Bekasi dengan mask gelap di luar batas kota (fokus visual)
- **20 tempat aman nyata** (polisi, RS, puskesmas, masjid, mal, minimarket, stasiun, pos keamanan) — koordinat terverifikasi OSM, status buka/tutup real-time per jam operasional
- **Laporan bahaya terverifikasi tampil di peta** (marker amber per jenis) — live: admin verifikasi → marker langsung muncul
- **Filter kategori peta** — 2 dropdown di kanan-atas: "📍 Tempat Aman" (8 kategori + beacon) dan "⚠️ Kejadian" (6 jenis + insiden rute); murni visual, tidak memengaruhi kandidat SOS/rute
- **Titik biru posisi Anda** (live via GPS) + lingkaran akurasi + auto-follow pintar (follow mati otomatis saat Anda menggeser peta)
- **Crowd beacon**: check-in → kehadiran Anda terdeteksi warga lain di sekitar (mode demo: 1 orang cukup membentuk beacon; produksi: ≥4 orang ≤15 m)

### 🧭 Rute Aman (fitur inti)
Klik tempat mana pun → **"🧭 Rute Aman ke sini"** → sistem menghitung seperti ini:

1. Ambil hingga **3 kandidat rute** dari OSRM (OpenStreetMap routing — gratis, tanpa API key; profil kendaraan/motor)
2. Untuk tiap kandidat, deteksi **laporan bahaya terverifikasi dalam buffer 75 m di sekitar rute** (bukan hanya yang tepat di jalur — kejadian terdekat ikut dihukum) dan masih dalam masa relevan
3. Skor rute = `durasi motor (jarak / 400 m/mnt = 24 km/jam) + Σ penalti bahaya` → **pilih skor terkecil**

| Jenis bahaya | Penalti | Masa relevan |
|---|---|---|
| Kejahatan/begal | +3 menit | 7 hari |
| Banjir | +4 menit | 2 hari |
| Jalan gelap/lainnya/kebakaran | +1 menit | 7 hari |
| Jalan rusak / kehilangan | +0,4 menit | 7 hari |

Intinya: *"lebih baik motor 3 menit lebih lama daripada lewat titik begal kemarin."*

Hasilnya digambar langsung di peta: **polyline teal** (rute terpilih), **marker merah** (bahaya yang berhasil dihindari), **marker amber** (bahaya yang tetap di jalur — waspada), tombol **Bandingkan** (tampilkan rute tercepat sebagai garis pudar untuk perbandingan). Bila jaringan routing mati → fallback garis lurus, app tetap berfungsi.

### 🆘 SOS / Darurat
Pilih jenis darurat → sistem mencari **bantuan terdekat** (beacon keramaian aktif + tempat aman yang sedang BUKA) → tampilkan Rute Aman ke sana, tombol **panggilan 112**, bagikan lokasi (Web Share), dan link Google Maps sebagai cadangan.

### 📢 Lapor Kejadian
Form lapor dengan **peta pemilih lokasi** — ketuk peta atau geser pin 📌 (pin menolak keluar batas Kota Bekasi). Foto opsional (dikompres otomatis). GPS gagal → ada peringatan jelas dan kirim ditolak sampai lokasi ditandai manual (tidak ada laporan dengan lokasi karangan). Laporan tampil publik **setelah diverifikasi admin** — menjaga info bahaya terpercaya.

### ⚠️ Info Bahaya (feed)
Feed laporan terverifikasi terbaru, real-time (Firestore onSnapshot).

### 📚 Panduan Keselamatan
7 panduan siap baca: banjir, kebakaran, aman di jalan, anak-anak, lansia, penyandang disabilitas, gempa.

### ♿ Aksesibilitas
- **Teks Besar** & **Mode Malam** — toggle di halaman Akun, langsung efek di seluruh app, persist (Firestore untuk login / localStorage untuk guest)
- Semua tombol: ikon + teks, target sentuh ≥48px (tombol SOS ≥72px), Bahasa Indonesia sederhana

### 🛡️ Admin
Verifikasi laporan (pending → verified/rejected) via panel `/admin` (khusus akun whitelist admin).

---

## Stack

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript |
| Style | Tailwind CSS v4 |
| Backend | Firebase (Spark, gratis): Auth Google + Firestore real-time |
| Peta | React-Leaflet 5 + tiles OpenStreetMap (tanpa API key) |
| Routing jalan | OSRM public demo API (`driving` profile, motor) — tanpa API key |
| Geocoding tempat | Overpass API / Nominatim (OSM) — skrip seed-time |

Tanpa backend sendiri, tanpa API key berbayar — seluruh layanan publik/gratis.

---

## Struktur Proyek

```
ruan/
├── src/
│   ├── app/                  # Halaman: / (peta), /lapor, /bahaya, /panduan, /akun, /admin
│   ├── components/
│   │   ├── MapShell.tsx      # Container peta + mask batas Kota Bekasi
│   │   ├── LiveMap.tsx       # Komposisi layer + kartu rute
│   │   ├── PlaceLayer.tsx    # Marker tempat + tombol "Rute Aman ke sini"
│   │   ├── BeaconLayer.tsx   # Marker keramaian (pulse)
│   │   ├── RouteLayer.tsx    # Polyline rute + marker insiden + flyTo
│   │   ├── UserLocationLayer.tsx  # Titik biru + akurasi + follow pintar
│   │   ├── RouteContext.tsx  # State rute antar-komponen
│   │   ├── LiveLocationContext.tsx # SATU watcher GPS untuk seluruh app
│   │   ├── SOSButton.tsx, CheckInButton.tsx, ReportForm.tsx, LocationPicker.tsx
│   │   └── AppShell.tsx      # Nav + bottom-nav mobile + class aksesibilitas
│   ├── hooks/
│   │   ├── useAuth.ts        # Auth Google + onSnapshot users/{uid}
│   │   ├── usePresence.ts    # Beacon engine: heartbeat, cluster, dissolve
│   │   └── useLiveLocation.ts # watchPosition GPS, auto-stop 30 menit
│   └── lib/
│       ├── routing.ts        # ⭐ Mesin Rute Aman (murni, 15/15 unit test)
│       ├── geo.ts            # Haversine, union-find clustering, isOpenNow
│       ├── reports.ts        # fetchAllReports (satu sumber)
│       ├── firebase.ts, user.ts, types.ts, batas-bekasi.ts
├── scripts/
│   ├── seed.js               # Seed Firestore (idempotent)
│   ├── geocode-overpass.js   # Sinkron koordinat tempat ke POI OSM
│   ├── test-routing.ts       # Unit test mesin Rute Aman
│   └── find-poi.js           # Debug: cari POI di Overpass
├── firestore.rules           # Security rules (sinkron dengan console)
└── .env.local                # Konfigurasi Firebase (jangan commit)
```

---

## Setup & Menjalankan

**Prasyarat:** Node.js 20+, akun Firebase, browser modern (geolocation butuh HTTPS atau localhost).

```bash
cd ruan
npm install
```

1. Buat proyek Firebase → aktifkan **Authentication (Google)** + **Firestore**
2. Salin `.env.example` → `.env.local`, isi konfigurasi web app Anda
3. Salin `firestore.rules` ke console Firebase (atau `firebase deploy --only firestore:rules`)
4. (Opsional, untuk verifikasi admin) Letakkan `serviceAccountKey.json` di `ruan/` — sudah di-gitignore
5. Jalankan:

```bash
npm run dev        # → http://localhost:3000
```

### Perintah

```
npm run dev        # Dev server
npm run build      # Production build
npm run lint       # ESLint
npm run seed       # Isi Firestore: 20 tempat, 7 panduan, 9 laporan demo + promote admin
npm run test       # — (unit test via: npx tsx scripts/test-routing.ts)
```

> **Penting sebelum demo/lomba:** jalankan `npm run seed` ulang — laporan begal demo bermasa relevan 7 hari (banjir 2 hari), umurnya berjalan sejak seed terakhir.

### Konfigurasi Admin

Email admin di-whitelist di dua tempat (harus sama):
- `src/lib/user.ts` → `ADMIN_EMAILS`
- `firestore.rules` → fungsi `isWhitelistedAdminEmail()`

---

## Cara Menggunakan (Panduan Pengguna)

1. **Masuk** — tombol login Google di halaman utama
2. **Lihat peta** — izinkan akses lokasi → titik biru posisi Anda muncul; ketuk ikon tempat untuk detail (jam buka, telepon)
3. **Check-In** — tombol "📍 Check-In di Sini" → kehadiran Anda terlihat warga lain (mode demo: beacon langsung terbentuk)
4. **Cari Rute Aman** — ketuk tempat → "🧭 Rute Aman ke sini" → rute digambar + alasan ("Menghindari 2 titik bahaya, hanya +4 menit"). Tekan "Bandingkan rute" untuk melihat rute tercepat (garis pudar)
5. **Lapor bahaya** — menu Lapor → pilih jenis → isi judul/deskripsi → geser pin di peta → (opsional foto) → kirim. Laporan tampil setelah admin verifikasi
6. **SOS** — tombol merah 🆘 → pilih jenis darurat → bantuan terdekat + rute aman + panggil 112
7. **Aksesibilitas** — Akun → aktifkan Teks Besar / Mode Malam

---

## Deploy (Vercel)

1. Push repo ke GitHub
2. Import di Vercel → set env `NEXT_PUBLIC_FIREBASE_*` (7 variabel)
3. Tambahkan domain Vercel ke **Authorized domains** Firebase Auth
4. Smoke test di URL live

---

## Catatan Desain

- **Verifikasi admin** = quality gate manusia untuk info bahaya; data pending tak tampil publik
- **Anti gagal demo**: OSRM mati → fallback garis lurus; Firestore reports gagal → rute tanpa insiden; semua error tertelan dengan UI jujur
- **Privacy**: lokasi hanya dikirim saat check-in/SOS aktif; kehadiran (presence) dihapus saat check-out
- Detail keputusan: `docs/SPEC.md`, `docs/SPEC-live-nav.md`, `docs/HANDOFF.md`, `tasks/plan.md`

---

© 2026 Tim RUAN — Exasti. Data peta © OpenStreetMap contributors.
