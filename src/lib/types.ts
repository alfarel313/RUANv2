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
  highContrast: boolean
  audioAlert: boolean
  notifications: boolean
}

export interface UserData {
  displayName: string
  email: string
  photoURL: string
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
  photoURL: string | null
  status: ReportStatus
  reporterUid: string
  reporterName: string
  city: string
  createdAt: number // epoch ms
  verifiedBy: string | null
  verifiedAt: number | null
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
