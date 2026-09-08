// Geospasial murni — unit-testable tanpa Firebase

export const BEACON_RADIUS_M = 15 // radius penggabungan klaster (±10–15 m)
export const BEACON_MIN_PEOPLE = 1 // MODE DEMO: 1 orang cukup membentuk beacon (aslinya 4 — kembalikan saat produksi)
export const BEACON_DISSOLVE_BELOW = 1 // MODE DEMO: beacon hilang saat 0 orang tersisa (aslinya 3)
export const BEACON_DISSOLVE_MS = 2 * 60 * 1000 // 2 menit
export const PRESENCE_TTL_MS = 60 * 1000 // heartbeat dianggap mati >60 detik

export function haversineM(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const R = 6371000
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export interface PresenceLike {
  lat: number
  lng: number
  updatedAt: number
}

export interface ClusterResult {
  lat: number // centroid
  lng: number
  count: number
  memberKeys: string[]
}

/**
 * Union-find clustering: dua titik satu klaster bila jarak ≤ BEACON_RADIUS_M
 * (transitif — rantai orang berdekatan tetap satu klaster, sesuai "radius ±10–15 meter").
 * Hanya presence yang heartbeat-nya masih segar (now - updatedAt < ttl).
 */
export function clusterPresences(
  points: Map<string, PresenceLike>,
  now: number = Date.now(),
  ttlMs: number = PRESENCE_TTL_MS,
  radiusM: number = BEACON_RADIUS_M
): ClusterResult[] {
  const keys = [...points.keys()].filter((k) => {
    const p = points.get(k)!
    return now - p.updatedAt < ttlMs
  })

  const parent = new Map<string, string>()
  keys.forEach((k) => parent.set(k, k))
  const find = (k: string): string => {
    let root = k
    while (parent.get(root)! !== root) root = parent.get(root)!
    return root
  }
  const union = (a: string, b: string) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }

  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = points.get(keys[i])!
      const b = points.get(keys[j])!
      if (haversineM(a.lat, a.lng, b.lat, b.lng) <= radiusM) {
        union(keys[i], keys[j])
      }
    }
  }

  const clusters = new Map<string, string[]>()
  keys.forEach((k) => {
    const root = find(k)
    const arr = clusters.get(root) ?? []
    arr.push(k)
    clusters.set(root, arr)
  })

  return [...clusters.values()].map((members) => {
    const pts = members.map((m) => points.get(m)!)
    return {
      lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
      lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
      count: members.length,
      memberKeys: members,
    }
  })
}

/** Beacon hanya valid bila klaster ≥ BEACON_MIN_PEOPLE */
export function clustersToBeacons(clusters: ClusterResult[]): ClusterResult[] {
  return clusters.filter((c) => c.count >= BEACON_MIN_PEOPLE)
}

/** "HH:MM" → menit sejak tengah malam */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10))
  return h * 60 + m
}

/** Status buka tempat vs waktu sekarang (menangani lintas tengah malam) */
export function isOpenNow(open: string, close: string, now: Date): boolean {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const o = hhmmToMinutes(open)
  const c = hhmmToMinutes(close)
  if (o === c) return true // 24 jam
  if (o < c) return nowMin >= o && nowMin < c
  return nowMin >= o || nowMin < c // lintas tengah malam (mis. 18:00–02:00)
}

/** Jarak tempuh jalan kaki (estimasi): 80 m/menit, dibulatkan ke 1 desimal */
export function walkMinutes(distanceM: number): number {
  return Math.round((distanceM / 80) * 10) / 10
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(1)} km`
}
