# RUAN — Rute Aman Bekasi (web app)

Next.js 16 + Tailwind v4 + Firebase (Auth Google, Firestore real-time) + React-Leaflet.

## Setup

1. `npm install`
2. Salin `.env.example` → `.env.local`, isi nilai Firebase Console Anda.
3. `npm run dev` → http://localhost:3000

## Perintah

```
npm run dev        # dev server
npm run build      # production build
npm run lint       # eslint
npm run seed       # seed Firestore (places, guides, reports demo, admin) — butuh service account
```

## Deploy

Vercel: set env `NEXT_PUBLIC_FIREBASE_*` di project settings, deploy dari repo ini.
Firestore rules & indexes: `firebase deploy --only firestore:rules,firestore:indexes` (butuh Firebase CLI + project `ruan-bekasi`).
