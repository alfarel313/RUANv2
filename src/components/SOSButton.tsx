"use client";

import { useState } from "react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { usePresenceCtx } from "@/components/PresenceContext";
import { computeAndSetRoute, useRouteCtx } from "@/components/RouteContext";
import { db } from "@/lib/firebase";
import type {
  EmergencyType,
  NearestHelp,
  PlaceData,
  ReportData,
} from "@/lib/types";
import { haversineM, isOpenNow, walkMinutes, formatDistance } from "@/lib/geo";

const TYPES: { value: EmergencyType; label: string; icon: string }[] = [
  { value: "medis", label: "Medis", icon: "🏥" },
  { value: "kejahatan", label: "Kejahatan", icon: "🚨" },
  { value: "kecelakaan", label: "Kecelakaan", icon: "💥" },
  { value: "kebakaran", label: "Kebakaran", icon: "🔥" },
];

export default function SOSButton() {
  const { user, userData } = useAuth();
  const { beacons } = usePresenceCtx();
  const { setRoute, setLoading } = useRouteCtx();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState<NearestHelp | null>(null);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [routing, setRouting] = useState(false);

  if (!user) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="min-h-[64px] flex-1 rounded-2xl bg-sos px-4 text-base font-bold text-white shadow-md hover:bg-sos-dark"
        aria-label="Darurat — buka bantuan"
      >
        🆘 DARURAT
      </button>
    );
  }

  const pick = async (type: EmergencyType) => {
    setBusy(true);
    try {
      // 1. posisi
      const pos = await new Promise<{ lat: number; lng: number }>((resolve) => {
        navigator.geolocation?.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve({ lat: -6.2382, lng: 106.9756 }),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
      setMyPos(pos);

      // 2. kandidat bantuan: beacon aktif + tempat yang masih buka
      const snap = await getDocs(collection(db, "places"));
      const now = new Date();
      const candidates: NearestHelp[] = [];

      beacons.forEach((b) => {
        candidates.push({
          name: `Keramaian ${b.count} orang`,
          kind: "beacon",
          lat: b.lat,
          lng: b.lng,
          distanceM: haversineM(pos.lat, pos.lng, b.lat, b.lng),
        });
      });
      snap.forEach((d) => {
        const p = d.data() as PlaceData;
        if (isOpenNow(p.open, p.close, now)) {
          candidates.push({
            name: p.name,
            kind: "place",
            lat: p.lat,
            lng: p.lng,
            distanceM: haversineM(pos.lat, pos.lng, p.lat, p.lng),
          });
        }
      });

      const nearest =
        candidates.length > 0
          ? candidates.reduce((a, b) => (a.distanceM < b.distanceM ? a : b))
          : null;
      setHelp(nearest);

      // 3. log darurat (kesadaran platform)
      await addDoc(collection(db, "emergencies"), {
        uid: user.uid,
        userName: userData?.displayName ?? "Warga",
        type,
        lat: pos.lat,
        lng: pos.lng,
        nearestHelp: nearest
          ? {
              name: nearest.name,
              lat: nearest.lat,
              lng: nearest.lng,
              distanceM: nearest.distanceM,
            }
          : null,
        status: "active",
        createdAt: Date.now(),
        resolvedAt: null,
      });
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!myPos) return;
    const text = `🆘 BUTUH BANTUAN! Lokasi saya: https://maps.google.com/?q=${myPos.lat},${myPos.lng}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "SOS RUAN", text });
      } catch {
        /* dibatalkan pengguna */
      }
    } else {
      await navigator.clipboard?.writeText(text);
    }
  };

  // Rute aman in-app ke bantuan terdekat (dihitung penuh, bukan sekadar flyTo)
  const showSafeRoute = async () => {
    if (!help || !myPos) return;
    setRouting(true);
    try {
      let reports: ReportData[] = [];
      try {
        const snap = await getDocs(collection(db, "reports"));
        reports = snap.docs.map((d) => d.data() as ReportData);
      } catch {
        reports = [];
      }
      await computeAndSetRoute(
        myPos,
        { lat: help.lat, lng: help.lng },
        help.name,
        reports,
        setRoute,
        setLoading
      );
      setOpen(false); // tutup dialog → peta menampilkan rute
    } finally {
      setRouting(false);
    }
  };

  const close = () => {
    setOpen(false);
    setHelp(null);
    setMyPos(null);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="min-h-[64px] flex-1 rounded-2xl bg-sos px-4 text-base font-bold text-white shadow-md transition-colors hover:bg-sos-dark"
        aria-label="Darurat — buka bantuan"
      >
        🆘 DARURAT
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pusat bantuan darurat"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 sm:items-center"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            {!help ? (
              <>
                <h2 className="text-xl font-extrabold text-sos">
                  🆘 Apa daruratnya?
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Pilih jenis darurat — sistem langsung mencari bantuan
                  terdekat yang tersedia sekarang.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => pick(t.value)}
                      disabled={busy}
                      className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-slate-200 text-sm font-bold text-slate-800 hover:border-sos hover:bg-sos/5 disabled:opacity-50"
                    >
                      <span aria-hidden="true" className="text-3xl">
                        {t.icon}
                      </span>
                      {busy ? "Mencari…" : t.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={close}
                  className="mt-3 min-h-[48px] w-full rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal — saya aman
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-extrabold text-slate-900">
                  🧭 Bantuan Terdekat
                </h2>
                <div className="mt-3 rounded-2xl border-2 border-brand bg-brand/5 p-4">
                  <p className="text-lg font-extrabold text-brand">
                    {help.name}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {help.kind === "beacon"
                      ? "Keramaian warga aktif — area ramai lebih aman"
                      : "Tempat aman yang sedang buka"}
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">
                    {formatDistance(help.distanceM)}
                    <span className="ml-2 text-sm font-semibold text-slate-600">
                      ± {walkMinutes(help.distanceM)} menit jalan kaki
                    </span>
                  </p>
                </div>
                {myPos && (
                  <button
                    onClick={showSafeRoute}
                    disabled={routing}
                    className="mt-3 block min-h-[52px] w-full rounded-xl bg-slate-900 py-3 text-center text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {routing ? "Menghitung rute…" : "🧭 Tampilkan Rute Aman di Peta"}
                  </button>
                )}
                {myPos && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${myPos.lat},${myPos.lng}&destination=${help.lat},${help.lng}&travelmode=walking`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block min-h-[48px] rounded-xl border-2 border-slate-200 py-3 text-center text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    🗺️ Cadangan: buka di Google Maps
                  </a>
                )}
                <a
                  href="tel:112"
                  className="mt-2 block min-h-[60px] rounded-2xl bg-sos py-4 text-center text-lg font-extrabold text-white hover:bg-sos-dark"
                >
                  📞 PANGGIL 112
                </a>
                <button
                  onClick={share}
                  className="mt-2 block min-h-[52px] w-full rounded-xl border-2 border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  📤 Bagikan Lokasi Saya
                </button>
                <button
                  onClick={close}
                  className="mt-3 block min-h-[48px] w-full rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark"
                >
                  ✅ Saya Sudah Aman
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
