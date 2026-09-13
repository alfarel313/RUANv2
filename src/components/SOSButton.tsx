"use client";

import { useState } from "react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { usePresenceCtx } from "@/components/PresenceContext";
import { computeAndSetRoute, useRouteCtx } from "@/components/RouteContext";
import { useLiveLocationCtx } from "@/components/LiveLocationContext";
import { db } from "@/lib/firebase";
import { fetchAllReports } from "@/lib/reports";
import type {
  EmergencyType,
  NearestHelp,
  PlaceData,
} from "@/lib/types";
import { haversineM, isOpenNow, motoMinutes, formatDistance } from "@/lib/geo";
import InfoDot from "@/components/InfoDot";
import Modal from "@/components/Modal";
import {
  HeartPulse,
  Map as MapIcon,
  Navigation,
  Phone,
  Siren,
  Share2,
  ShieldCheck,
  CarFront,
  Flame,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TYPES: { value: EmergencyType; label: string; Icon: LucideIcon }[] = [
  { value: "medis", label: "Medis", Icon: HeartPulse },
  { value: "kejahatan", label: "Kejahatan", Icon: Siren },
  { value: "kecelakaan", label: "Kecelakaan", Icon: CarFront },
  { value: "kebakaran", label: "Kebakaran", Icon: Flame },
];

export default function SOSButton() {
  const { user, userData } = useAuth();
  const { beacons } = usePresenceCtx();
  const { setRoute, setLoading } = useRouteCtx();
  const { pos: livePos } = useLiveLocationCtx();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState<NearestHelp | null>(null);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [routing, setRouting] = useState(false);
  const [locError, setLocError] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  if (!user) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-[64px] flex-1 items-center justify-center gap-2 rounded-2xl bg-sos px-4 text-base font-bold text-white shadow-md hover:bg-sos-dark"
        aria-label="Darurat — buka bantuan"
      >
        <Siren aria-hidden="true" className="h-6 w-6" /> DARURAT
      </button>
    );
  }

  const pick = async (type: EmergencyType) => {
    setBusy(true);
    setPickError(null);
    try {
      // 1. posisi — dari live watcher; bila belum ada, ambil sekali (TANPA fallback koordinat palsu)
      const pos =
        livePos ??
        (await new Promise<{ lat: number; lng: number } | null>((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 8000 }
          );
        }));
      if (!pos) {
        setLocError(true);
        return;
      }
      setLocError(false);
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
        createdAt: Date.now(), // eslint-disable-line react-hooks/purity -- event handler, bukan render
        resolvedAt: null,
      });
    } catch {
      // jujur: jangan biarkan rejection bocor ke window (unhandledRejection)
      setPickError("Gagal mencari bantuan — periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!myPos) return;
    const text = `SOS! BUTUH BANTUAN! Lokasi saya: https://maps.google.com/?q=${myPos.lat},${myPos.lng}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "SOS RUAN", text });
      } catch {
        /* dibatalkan pengguna */
      }
    } else {
      try {
        await navigator.clipboard?.writeText(text);
      } catch {
        /* clipboard bisa ditolak izin — jangan crash */
      }
    }
  };

  // Rute aman in-app ke bantuan terdekat (dihitung penuh, bukan sekadar flyTo)
  const showSafeRoute = async () => {
    if (!help || !myPos) return;
    setRouting(true);
    try {
      const reports = await fetchAllReports();
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
    setLocError(false);
    setPickError(null);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-[64px] flex-1 items-center justify-center gap-2 rounded-2xl bg-sos px-4 text-base font-bold text-white shadow-md transition-colors hover:bg-sos-dark"
        aria-label="Darurat — buka bantuan"
      >
        <Siren aria-hidden="true" className="h-6 w-6" /> DARURAT
      </button>

      {open && (
        <Modal label="Pusat bantuan darurat" onClose={close}>
          <div className="w-full max-w-md">
            {!help ? (
              <>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-sos">
                  <Siren aria-hidden="true" className="h-6 w-6" /> Apa daruratnya?
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
                      <t.Icon aria-hidden="true" className="h-7 w-7" />
                      {busy ? "Mencari…" : t.label}
                    </button>
                  ))}
                </div>
                {locError && (
                  <p
                    role="alert"
                    className="mt-3 rounded-xl bg-sos/10 px-3 py-2 text-sm font-bold text-sos"
                  >
                    Lokasi Anda tidak terdeteksi. Izinkan akses lokasi di
                    browser (ikon gembok di address bar) lalu coba lagi — bantuan
                    terdekat dihitung dari posisi Anda.
                  </p>
                )}
                {pickError && (
                  <p
                    role="alert"
                    className="mt-3 rounded-xl bg-sos/10 px-3 py-2 text-sm font-bold text-sos"
                  >
                    {pickError}
                  </p>
                )}
                <button
                  onClick={close}
                  className="mt-3 min-h-[48px] w-full rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal — saya aman
                </button>
              </>
            ) : (
              <>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                  <Navigation aria-hidden="true" className="h-5 w-5 text-brand" />
                  Bantuan Terdekat{" "}
                  <InfoDot text="Kandidat bantuan = keramaian warga aktif (beacon) + tempat aman yang sedang BUKA menurut jam operasionalnya. Sistem memilih yang terdekat dari posisi Anda, lalu menghitung Rute Aman ke sana." />
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
                      ± {motoMinutes(help.distanceM)} menit motor
                    </span>
                  </p>
                </div>
                {myPos && (
                  <button
                    onClick={showSafeRoute}
                    disabled={routing}
                    className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    <Navigation aria-hidden="true" className="h-4 w-4" />
                    {routing ? "Menghitung rute…" : "Tampilkan Rute Aman di Peta"}
                  </button>
                )}
                {myPos && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${myPos.lat},${myPos.lng}&destination=${help.lat},${help.lng}&travelmode=two-wheeler`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-slate-200 py-3 text-center text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    <MapIcon aria-hidden="true" className="h-4 w-4" />
                    Cadangan: buka di Google Maps
                  </a>
                )}
                <a
                  href="tel:112"
                  className="mt-2 flex min-h-[60px] items-center justify-center gap-2 rounded-2xl bg-sos py-4 text-center text-lg font-extrabold text-white hover:bg-sos-dark"
                >
                  <Phone aria-hidden="true" className="h-6 w-6" /> PANGGIL 112
                </a>
                <button
                  onClick={share}
                  className="mt-2 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Share2 aria-hidden="true" className="h-4 w-4" /> Bagikan Lokasi Saya
                </button>
                <button
                  onClick={close}
                  className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark"
                >
                  <ShieldCheck aria-hidden="true" className="h-4 w-4" /> Saya Sudah Aman
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
