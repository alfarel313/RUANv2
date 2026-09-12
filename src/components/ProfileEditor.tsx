"use client";

import { useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import {
  Camera,
  Check,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";

/** Kompres gambar profil → base64 kecil (256px, jpeg 80%) — hemat dokumen Firestore */
function compressAvatar(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 256;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas
          .getContext("2d")!
          .drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => resolve(null);
      img.src = String(reader.result);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Edit profil: nama tampilan + foto — langsung tersimpan ke users/{uid};
 * nama dipakai di laporan/check-in/beacon, foto tampil di halaman akun.
 */
export default function ProfileEditor() {
  const { user, userData } = useAuth();
  // Prа-isi lazy-init saat mount; parent (halaman akun) me-render komponen ini
  // dengan key identitas userData → setiap perubahan tersimpan me-remount form.
  const [name, setName] = useState(() => userData?.displayName ?? "");
  const [avatar, setAvatar] = useState<string | null>(
    () => userData?.photoURL ?? null
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const dirty =
    !!userData &&
    (name.trim() !== userData.displayName || avatar !== (userData.photoURL ?? null));

  const save = async () => {
    const clean = name.trim();
    if (clean.length < 1) {
      setError("Nama tidak boleh kosong.");
      return;
    }
    if (clean.length > 60) {
      setError("Nama maksimal 60 karakter.");
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: clean,
        photoURL: avatar, // base64 kecil atau null (kembali pakai default)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Gagal menyimpan — periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-label="Edit profil"
      className="mt-5 rounded-2xl border-2 border-slate-200 bg-white p-4"
    >
      <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-800">
        <Pencil aria-hidden="true" className="h-5 w-5" /> Edit Profil
      </h2>
      <p className="mt-0.5 text-xs font-semibold text-slate-500">
        Nama & foto dipakai di laporan, check-in, dan identitas Anda di RUAN.
      </p>

      <div className="mt-3 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar ?? "/logo-96.png"}
          alt="Foto profil Anda"
          className="h-16 w-16 rounded-2xl border-2 border-brand object-cover"
        />
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-brand px-4 text-xs font-bold text-brand hover:bg-brand/10"
          >
            <Camera aria-hidden="true" className="h-4 w-4" /> Pilih Foto
          </button>
          {avatar && (
            <button
              type="button"
              onClick={() => setAvatar(null)}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-slate-300 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" /> Hapus Foto
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = ""; // biar file sama bisa dipilih ulang
              if (!f) return;
              const c = await compressAvatar(f);
              if (!c) {
                setError("Foto tidak terbaca — coba file lain.");
                return;
              }
              setError(null);
              setAvatar(c);
            }}
          />
        </div>
      </div>

      <label
        htmlFor="profile-name"
        className="mt-3 block text-xs font-bold text-slate-700"
      >
        Nama tampilan
      </label>
      <input
        id="profile-name"
        type="text"
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
        className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-200 px-3 text-sm font-semibold text-slate-800 focus:border-brand focus:outline-none"
        placeholder="Nama Anda"
      />

      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-sos">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="mt-2 flex items-center gap-1 text-sm font-bold text-brand">
          <Check aria-hidden="true" className="h-4 w-4" /> Profil tersimpan.
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={busy || !dirty}
        className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        <Save aria-hidden="true" className="h-4 w-4" />
        {busy ? "Menyimpan…" : "Simpan Profil"}
      </button>
    </section>
  );
}
