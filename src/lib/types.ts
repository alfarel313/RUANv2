// Tipe data domain RUAN — kontrak seluruh collection Firestore (lihat SPEC.md)

export type Role = "user" | "admin"

export type ReportType =
  | "banjir"
  | "kebakaran"
  | "kejahatan"
  | "jalan_rusak"
  | "kehilangan"
  | "lainnya"

export type ReportStatus = "pending" | "verified" | "rejected"

export type EmergencyType = "medis" | "kejahatan" | "kecelakaan" | "kebakaran"

export type PlaceType =
  | "polisi"
  | "puskesmas"
  | "rumah_sakit"
  | "masjid"
  | "toko"
  | "mall"
  | "stasiun"
  | "pos_keamanan"

export interface UserSettings {
  largeText: boolean
  darkMode: boolean
  audioAlert: boolean
  notifications: boolean
}

export interface UserData {
  displayName: string
  email: string
  photoURL: string | null
  role: Role
  city: string
  settings: UserSettings
}

export interface PresenceData {
  lat: number
  lng: number
  city: string
  updatedAt: number // epoch ms
}

export interface BeaconData {
  lat: number
  lng: number
  count: number
  city: string
  updatedAt: number // epoch ms
}

export interface ReportData {
  type: ReportType
  title: string
  description: string
  lat: number
  lng: number
  /** Maks 3 foto base64 (jpeg terkompresi). Foto tunggal lama tetap terbaca. */
  photos: string[] | null
  /** LEGACY (pra-multi-foto): dipertahankan agar dokumen lama tetap terbaca */
  photoURL: string | null
  /** LEGACY (pra-sourceURL): dokumen lama tak punya field ini — selalu baca via helper */
  sourceURL?: string | null
  status: ReportStatus
  reporterUid: string
  reporterName: string
  city: string
  createdAt: number // epoch ms
  verifiedBy: string | null
  verifiedAt: number | null
}

/** Helper baca foto laporan — dukung format baru (photos[]) & lama (photoURL) */
export function reportPhotos(r: Pick<ReportData, "photos" | "photoURL">): string[] {
  if (r.photos && r.photos.length > 0) return r.photos
  if (r.photoURL) return [r.photoURL]
  return []
}

/** Ekstrak domain dari sourceURL untuk tampilan warga ("detik.com" dengan ikon berita).
 *  Murni client-side — tanpa fetch, aman CORS. Return null bila URL tak sehat. */
export function sourceDomain(r: Pick<ReportData, "sourceURL">): string | null {
  const url = r.sourceURL
  if (!url || !/^https:\/\//i.test(url)) return null
  try {
    const host = new URL(url).hostname
    return host ? host.replace(/^www\./i, "") : null
  } catch {
    return null
  }
}

/** Validasi input link berita admin: wajib https://, maks 300 karakter */
export function validateSourceURL(url: string): string | null {
  const u = url.trim()
  if (u.length === 0) return null // opsional
  if (u.length > 300) return "Link maksimal 300 karakter."
  if (!/^https:\/\//i.test(u)) return "Link harus diawali https://"
  try {
    const parsed = new URL(u)
    if (!parsed.hostname.includes(".")) return "Domain tidak valid."
  } catch {
    return "Link tidak valid."
  }
  return null
}

export interface PlaceData {
  name: string
  type: PlaceType
  lat: number
  lng: number
  address: string
  open: string // "06:00"
  close: string // "22:00"
  phone: string | null
  city: string
}

export interface GuideData {
  title: string
  category: string
  icon: string
  content: string // markdown sederhana
  order: number
}

export interface EmergencyData {
  uid: string
  userName: string
  type: EmergencyType
  lat: number
  lng: number
  nearestHelp: {
    name: string
    lat: number
    lng: number
    distanceM: number
  } | null
  status: "active" | "resolved"
  createdAt: number
  resolvedAt: number | null
}

export interface NearestHelp {
  name: string
  kind: "beacon" | "place"
  lat: number
  lng: number
  distanceM: number
}
