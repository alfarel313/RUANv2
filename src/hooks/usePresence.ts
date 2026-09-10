"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { BeaconData } from "@/lib/types";
import {
  clusterPresences,
  clustersToBeacons,
  haversineM,
  BEACON_DISSOLVE_BELOW,
  BEACON_DISSOLVE_MS,
  PRESENCE_TTL_MS,
} from "@/lib/geo";

const HEARTBEAT_MS = 10_000;
const BEACON_SWEEP_MS = 5_000;

export interface UsePresenceResult {
  active: boolean
  activeCount: number // jumlah orang dalam klaster pengguna (termasuk diri)
  beacons: BeaconView[]
  error: string | null
  start: () => Promise<void>
  stop: () => void
}

/** Tipe render beacon — lowSince dipakai untuk countdown dissolve di UI */
export interface BeaconView extends BeaconData {
  lowSince?: number | null
}

async function getPosition(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
    );
  });
}

function beaconIdFor(lat: number, lng: number): string {
  // id stabil per grid ~50m — klaster berdekatan menulis dokumen sama
  const gx = Math.round(lat * 1000);
  const gy = Math.round(lng * 1000);
  return `b_${gx}_${gy}`;
}

/**
 * Check-in + heartbeat + pemeliharaan beacon oleh semua klien aktif (last-writer-win).
 * MODE DEMO (lihat geo.ts): 1 orang cukup membentuk beacon; beacon hilang saat 0 orang
 * selama BEACON_DISSOLVE_MS. Kontrak produksi (SPEC.md): ≥4 orang ≤15m; ≤3 org 2 menit → hilang.
 */
export function usePresence(): UsePresenceResult {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [beacons, setBeacons] = useState<BeaconView[]>([]);
  const [error, setError] = useState<string | null>(null);

  const beatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sweepRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubBeaconRef = useRef<(() => void) | null>(null);
  const activeRef = useRef(false);
  const lowSinceRef = useRef<Map<string, number>>(new Map());

  // tulis presence diri
  const heartbeat = useCallback(async () => {
    if (!user || !activeRef.current) return;
    const pos = await getPosition();
    if (!pos) return;
    try {
      await setDoc(doc(db, "presence", user.uid), {
        lat: pos.lat,
        lng: pos.lng,
        city: "Bekasi",
        updatedAt: Date.now(),
      });
    } catch {
      setError("Gagal mengirim lokasi. Periksa koneksi Anda.");
    }
  }, [user]);

  // sweep: cluster presence → sinkron dokumen beacons
  const sweep = useCallback(async () => {
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, "presence"));
      const now = Date.now();
      const points = new Map<string, { lat: number; lng: number; updatedAt: number }>();
      snap.forEach((d) => {
        const p = d.data() as { lat: number; lng: number; updatedAt: number };
        points.set(d.id, p);
      });

      const all = clusterPresences(points, now);
      const valid = clustersToBeacons(all);

      // klaster milik pengguna ini (untuk activeCount)
      if (activeRef.current && user) {
        const mine = all.find((c) => c.memberKeys.includes(user.uid));
        setActiveCount(mine ? mine.count : 1);
      }

      // upsert beacon valid
      const validIds = new Set<string>();
      for (const c of valid) {
        const id = beaconIdFor(c.lat, c.lng);
        validIds.add(id);
        const lowSince = lowSinceRef.current.get(id) ?? null;
        await setDoc(
          doc(db, "beacons", id),
          {
            lat: c.lat,
            lng: c.lng,
            count: c.count,
            city: "Bekasi",
            updatedAt: now,
            ...(lowSince ? { lowSince } : {}),
          },
          { merge: true }
        );
      }

      // dissolve: dokumen beacon yang klaster-nya tak lagi valid
      const beaconSnap = await getDocs(collection(db, "beacons"));
      beaconSnap.forEach(async (d) => {
        const id = d.id;
        if (validIds.has(id)) {
          lowSinceRef.current.delete(id);
          return;
        }
        const b = d.data() as BeaconData & { lowSince?: number | null };
        // beacon tak punya klaster valid lagi: mulai hitungan dissolve bila 0 orang tersisa
        const countNow = b.count ?? 0;
        if (countNow > BEACON_DISSOLVE_BELOW) {
          lowSinceRef.current.delete(id);
          return;
        }
        const since = lowSinceRef.current.get(id) ?? b.lowSince ?? now;
        lowSinceRef.current.set(id, since);
        if (now - since >= BEACON_DISSOLVE_MS) {
          await deleteDoc(doc(db, "beacons", id));
          lowSinceRef.current.delete(id);
        } else {
          await setDoc(
            doc(db, "beacons", id),
            { lowSince: since, count: countNow },
            { merge: true }
          );
        }
      });
    } catch {
      /* sweep best-effort; error kecil tak perlu ganggu UI */
    }
  }, [user]);

  // subscribe beacon untuk render peta (semua pengguna, aktif atau tidak)
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "beacons"), (snap) => {
      const now = Date.now();
      const list: BeaconView[] = [];
      snap.forEach((d) => {
        const b = d.data() as BeaconData & { lowSince?: number | null };
        // lowSince → UI countdown dissolve ("beacon hilang ±X mnt")
        list.push({
          lat: b.lat,
          lng: b.lng,
          count: b.count,
          city: b.city,
          updatedAt: b.updatedAt ?? now,
          lowSince: b.lowSince ?? null,
        });
      });
      setBeacons(list);
    });
    unsubBeaconRef.current = unsub;
    return () => {
      unsub();
      unsubBeaconRef.current = null;
    };
  }, [user]);

  // start/stop
  const start = useCallback(async () => {
    if (!user) {
      setError("Masuk dulu untuk check-in.");
      return;
    }
    setError(null);
    activeRef.current = true;
    setActive(true);
    await heartbeat();
    await sweep();
    beatRef.current = setInterval(heartbeat, HEARTBEAT_MS);
    sweepRef.current = setInterval(sweep, BEACON_SWEEP_MS);
  }, [user, heartbeat, sweep]);

  const stop = useCallback(async () => {
    activeRef.current = false;
    setActive(false);
    setActiveCount(0);
    if (beatRef.current) clearInterval(beatRef.current);
    if (sweepRef.current) clearInterval(sweepRef.current);
    beatRef.current = null;
    sweepRef.current = null;
    if (user) {
      try {
        await deleteDoc(doc(db, "presence", user.uid));
      } catch {
        /* best-effort */
      }
      await sweep();
    }
  }, [user, sweep]);

  // cleanup total saat unmount/logout
  useEffect(() => {
    return () => {
      if (beatRef.current) clearInterval(beatRef.current);
      if (sweepRef.current) clearInterval(sweepRef.current);
      unsubBeaconRef.current?.();
    };
  }, []);

  return {
    active,
    activeCount,
    beacons,
    error,
    start: () => start(),
    stop: () => stop(),
  };
}

export { HEARTBEAT_MS, BEACON_SWEEP_MS, haversineM, PRESENCE_TTL_MS };
