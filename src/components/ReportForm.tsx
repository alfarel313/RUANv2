"use client";

import { FormEvent, useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import type { ReportType } from "@/lib/types";
import { loginGoogle } from "@/lib/firebase";
import dynamicImport from "next/dynamic";

// Peta (leaflet) WAJIB client-only — ssr:false seperti LiveMap
const LocationPicker = dynamicImport(
  () => import("@/components/LocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-100">
        <p className="animate-pulse text-sm font-semibold text-slate-500">
          Memuat peta…
        </p>
      </div>
    ),
  }
);

const TYPES: { value: ReportType; label: string; icon: string }[] = [
  { value: "banjir", label: "Banjir", icon: "🌊" },
  { value: "kebakaran", label: "Kebakaran", icon: "🔥" },
  { value: "kejahatan", label: "Kejahatan", icon: "🚨" },
  { value: "jalan_rusak", label: "Jalan Rusak", icon: "🕳️" },
  { value: "kehilangan", label: "Kehilangan", icon: "❓" },
  { value: "lainnya", label: "Lainnya", icon: "📋" },
];

async function getPos(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null), // jujur: tanpa koordinat palsu — UI yang menangani
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

export default function ReportForm() {
  const { user, userData } = useAuth();
  const [type, setType] = useState<ReportType>("banjir");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [posSource, setPosSource] = useState<"gps" | "peta">("gps");
  const [gpsFailed, setGpsFailed] = useState(false);
  const [pinMoved, setPinMoved] = useState(false); // pin pernah digeser/ketuk user?
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ambil posisi GPS sekali saat form dibuka. Gagal → jujur: tandai via peta
  // (pin default pusat Bekasi, label "peta"), BUKAN koordinat palsu senyap.
  useEffect(() => {
    getPos().then((p) => {
      if (p) {
        setPos((cur) => (cur ? cur : p));
      } else {
        setGpsFailed(true);
        setPosSource("peta");
        setPos({ lat: -6.2382, lng: 106.9756 }); // pusat peta — WAJIB digeser user
      }
    });
  }, []);

  if (!user) {
    return (
      <button
        onClick={() => loginGoogle()}
        className="mx-auto flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-brand px-6 text-base font-bold text-white hover:bg-brand-dark"
      >
        🔐 Masuk dengan Google untuk Melapor
      </button>
    );
  }

  const onPhoto = (f: File | null) => {
    if (!f) return setPhoto(null);
    // kompres kecil → base64 (Firestore doc-friendly)
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 640;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(f);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Judul dan deskripsi wajib diisi.");
      return;
    }
    if (!pos) {
      setError("Lokasi belum terdeteksi — tunggu GPS atau tandai lokasi di peta.");
      return;
    }
    if (gpsFailed && posSource !== "peta") {
      // mustahil lewat UI (label sudah "peta" saat gagal), tapi jaga-jaga
      setError("GPS tidak tersedia — tandai lokasi kejadian di peta dulu.");
      return;
    }
    if (gpsFailed && !pinMoved) {
      setError("Tandai lokasi kejadian di peta dulu — pin masih di posisi awal.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addDoc(collection(db, "reports"), {
        type,
        title: title.trim(),
        description: description.trim(),
        lat: pos.lat,
        lng: pos.lng,
        photoURL: photo,
        status: "pending",
        reporterUid: user.uid,
        reporterName: userData?.displayName ?? "Warga",
        city: "Bekasi",
        createdAt: Date.now(),
        verifiedBy: null,
        verifiedAt: null,
        serverCreatedAt: serverTimestamp(),
      });
      setDone(true);
      setTitle("");
      setDescription("");
      setPhoto(null);
      setPosSource("gps");
      setGpsFailed(false);
      setPinMoved(false);
    } catch {
      setError("Gagal mengirim laporan. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div
        className="rounded-2xl border-2 border-brand bg-white p-6 text-center shadow"
        role="status"
      >
        <p className="text-3xl" aria-hidden="true">
          ✅
        </p>
        <h2 className="mt-2 text-lg font-extrabold text-slate-900">
          Laporan Terkirim
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Laporan Anda menunggu verifikasi admin Kota Bekasi. Setelah
          terverifikasi, laporan tampil di peta dan feed Info Bahaya untuk
          semua warga.
        </p>
        <button
          onClick={() => setDone(false)}
          className="mt-4 min-h-[48px] rounded-xl border-2 border-brand px-5 text-sm font-bold text-brand hover:bg-brand/5"
        >
          Lapor Kejadian Lain
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow"
    >
      <fieldset className="mb-4">
        <legend className="text-sm font-bold text-slate-800">
          1. Pilih jenis kejadian
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              aria-pressed={type === t.value}
              className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-2 text-sm font-bold transition-colors ${
                type === t.value
                  ? "border-brand bg-brand text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand/50"
              }`}
            >
              <span aria-hidden="true" className="text-2xl">
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-bold text-slate-800" htmlFor="judul">
        2. Judul singkat
      </label>
      <input
        id="judul"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        required
        placeholder="Contoh: Banjir setinggi lutut di Jalan Ahmad Yani"
        className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-base focus:border-brand"
      />

      <label
        className="mt-4 block text-sm font-bold text-slate-800"
        htmlFor="deskripsi"
      >
        3. Ceritakan detailnya
      </label>
      <textarea
        id="deskripsi"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={2000}
        required
        rows={4}
        placeholder="Apa yang terjadi, sejak kapan, apakah ada korban…"
        className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-base focus:border-brand"
      />

      <label
        className="mt-4 block text-sm font-bold text-slate-800"
        htmlFor="foto"
      >
        4. Foto (opsional)
      </label>
      <input
        id="foto"
        type="file"
        accept="image/*"
        onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
        className="mt-1 w-full rounded-xl border-2 border-dashed border-slate-300 px-3 py-3 text-sm"
      />
      {photo && (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt="Pratinjau foto laporan"
            className="max-h-40 rounded-xl border border-slate-200"
          />
        </div>
      )}

      <label className="mt-4 block text-sm font-bold text-slate-800">
        5. Lokasi kejadian
      </label>
      <p
        className={`mt-1 text-xs font-semibold ${gpsFailed ? "text-sos" : "text-slate-600"}`}
        role={gpsFailed ? "alert" : undefined}
      >
        {gpsFailed
          ? "⚠️ GPS tidak terdeteksi — geser pin 📌 di peta ke lokasi kejadian (wajib sebelum kirim)."
          : posSource === "gps"
            ? "📍 Menggunakan posisi GPS Anda — bisa diganti dengan menandai peta."
            : "📌 Menggunakan penanda yang Anda pilih di peta."}
      </p>
      {pos && (
        <div className="mt-2">
          <LocationPicker
            value={pos}
            onChange={(v) => {
              setPos(v);
              setPosSource("peta");
              setPinMoved(true);
            }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-bold text-sos">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 min-h-[56px] w-full rounded-xl bg-brand text-base font-bold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? "Mengirim…" : "📢 Kirim Laporan"}
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">
        Laporan tampil publik setelah diverifikasi admin — menjaga info
        bahaya selalu dapat dipercaya.
      </p>
    </form>
  );
}
