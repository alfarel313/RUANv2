"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { db, loginGoogle, logout } from "@/lib/firebase";
import type { UserSettings } from "@/lib/types";
import ProfileEditor from "@/components/ProfileEditor";
import { SkeletonList } from "@/components/Skeleton";

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 hover:border-brand/50">
      <span>
        <span className="block text-sm font-extrabold text-slate-900">
          {label}
        </span>
        <span className="block text-xs text-slate-600">{desc}</span>
      </span>
      <input
        type="checkbox"
        checked={checked ?? false}
        onChange={(e) => onChange(e.target.checked)}
        className="h-7 w-7 accent-teal-700"
      />
    </label>
  );
}

export default function AkunPage() {
  const { user, userData, loading } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false); // 2-langkah: klik Keluar → konfirmasi

  const effective: UserSettings =
    settings ??
    userData?.settings ?? {
      largeText: false,
      darkMode: false,
      audioAlert: true,
      notifications: true,
    };

  const change = async (key: keyof UserSettings, value: boolean) => {
    const next = { ...effective, [key]: value };
    setSettings(next);
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), { settings: next });
      } catch {
        /* persist gagal (offline/permission) — setting lokal tetap efektif
           untuk sesi ini; jangan crash atau bocorkan rejection */
      }
    } else {
      try {
        localStorage.setItem("ruan-large-text", next.largeText ? "1" : "0");
        localStorage.setItem("ruan-dark", next.darkMode ? "1" : "0");
      } catch {
        /* ignore */
      }
      document.documentElement.classList.toggle("ruan-large-text", next.largeText);
      document.documentElement.classList.toggle("ruan-dark", next.darkMode);
    }
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-extrabold text-slate-900">
        👤 Akun & Pengaturan
      </h1>

      {loading && (
        <div className="mt-4">
          <SkeletonList label="Memuat pengaturan akun" count={1} item="h-14" />
        </div>
      )}

      {!user && !loading && (
        <button
          onClick={() => loginGoogle()}
          className="mt-4 min-h-[56px] w-full rounded-xl bg-brand text-base font-bold text-white hover:bg-brand-dark"
        >
          🔐 Masuk dengan Google
        </button>
      )}

      {user && (
        <section className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.photoURL ?? ""}
            alt=""
            className="h-12 w-12 rounded-full border-2 border-brand"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-slate-900">
              {userData?.displayName ?? user.displayName}
            </p>
            <p className="truncate text-sm text-slate-600">{user.email}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                userData?.role === "admin"
                  ? "bg-amber/10 text-amber"
                  : "bg-brand/10 text-brand"
              }`}
            >
              {userData?.role === "admin"
                ? "🛠️ Admin Kota Bekasi"
                : "Warga Bekasi"}
            </span>
          </div>
        </section>
      )}

      <section aria-label="Preferensi aksesibilitas" className="mt-5 space-y-2">
        <h2 className="text-base font-extrabold text-slate-800">
          ♿ Aksesibilitas & Kenyamanan
        </h2>
        <Toggle
          label="Mode Teks Besar"
          desc="Perbesar seluruh teks — nyaman untuk lansia & low vision"
          checked={effective.largeText}
          onChange={(v) => change("largeText", v)}
        />
        <Toggle
          label="Mode Malam"
          desc="Tampilan gelap nyaman di mata — cocok saat jalan malam"
          checked={effective.darkMode}
          onChange={(v) => change("darkMode", v)}
        />
        <Toggle
          label="Suara Peringatan"
          desc="Bunyi beep saat beacon terbentuk & mode darurat"
          checked={effective.audioAlert}
          onChange={(v) => change("audioAlert", v)}
        />
        <Toggle
          label="Notifikasi"
          desc="Info bahaya terverifikasi di area saya"
          checked={effective.notifications}
          onChange={(v) => change("notifications", v)}
        />
      </section>

      {user && userData && (
        <ProfileEditor key={`${userData.displayName}|${userData.photoURL ?? ""}`} />
      )}

      {user && !confirmLogout && (
        <button
          onClick={() => setConfirmLogout(true)}
          className="mt-6 min-h-[52px] w-full rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Keluar dari Akun
        </button>
      )}
      {user && confirmLogout && (
        <div
          role="alertdialog"
          aria-label="Konfirmasi keluar akun"
          className="mt-6 rounded-2xl border-2 border-sos bg-sos/5 p-4 text-center"
        >
          <p className="text-sm font-bold text-slate-800">
            Yakin keluar dari akun? Check-in aktif akan berhenti dan Anda
            perlu login lagi untuk melapor, check-in, atau tombol DARURAT.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => logout()}
              className="min-h-[48px] flex-1 rounded-xl bg-sos text-sm font-bold text-white hover:bg-sos-dark"
            >
              Ya, Keluar
            </button>
            <button
              onClick={() => setConfirmLogout(false)}
              className="min-h-[48px] flex-1 rounded-xl border-2 border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
