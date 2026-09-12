"use client";

import { FormEvent, useState } from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import dynamicImport from "next/dynamic";
import { db } from "@/lib/firebase";
import {
  PLACE_CATEGORIES,
  validatePlaceDraft,
  type PlaceDraft,
} from "@/lib/places";
import { BEKASI_CENTER } from "@/lib/batas-bekasi";
import { Pencil, Plus, Save } from "lucide-react";

// Peta (leaflet) WAJIB client-only — ssr:false seperti LiveMap/ReportForm
const LocationPicker = dynamicImport(
  () => import("@/components/LocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-64 rounded-xl border-2 border-slate-200 bg-slate-100"
        role="status"
        aria-label="Memuat peta lokasi"
      >
        <div className="flex h-full items-center justify-center">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    ),
  }
);

export interface PlaceFormProps {
  /** null = mode tambah; string = mode edit dokumen places/{id} */
  editId: string | null;
  /** Data awal mode edit — prа-isi form */
  initial?: PlaceDraft;
  onDone: () => void;
  onCancel: () => void;
}

const EMPTY_DRAFT: PlaceDraft = {
  name: "",
  type: "pos_keamanan",
  lat: BEKASI_CENTER[0],
  lng: BEKASI_CENTER[1],
  address: "",
  open: "00:00",
  close: "00:00",
  phone: null,
};

export default function PlaceForm({
  editId,
  initial,
  onDone,
  onCancel,
}: PlaceFormProps) {
  const [draft, setDraft] = useState<PlaceDraft>(initial ?? EMPTY_DRAFT);
  // edit: koordinat awal boleh dipakai langsung; tambah: wajib ketuk/geser dulu
  const [pinMoved, setPinMoved] = useState(editId !== null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof PlaceDraft>(k: K, v: PlaceDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validatePlaceDraft(draft);
    if (err) {
      setError(err);
      return;
    }
    if (!pinMoved) {
      setError("Tandai lokasi di peta dulu — ketuk peta atau geser pin.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = {
        name: draft.name.trim(),
        type: draft.type,
        lat: draft.lat,
        lng: draft.lng,
        address: (draft.address ?? "").trim(),
        open: draft.open,
        close: draft.close,
        phone: draft.phone ? draft.phone.trim() : null,
        city: "Bekasi",
        seeded: false, // kelola admin → SELAMAT dari re-seed (seed hanya hapus seeded:true)
      };
      if (editId) {
        await updateDoc(doc(db, "places", editId), data);
      } else {
        await addDoc(collection(db, "places"), data);
      }
      onDone();
    } catch (err) {
      setError("Gagal menyimpan — periksa koneksi lalu coba lagi.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const isEdit = editId !== null;

  return (
    <form
      onSubmit={submit}
      className="mt-3 space-y-3 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow"
    >
      <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-800">
        {isEdit ? (
          <>
            <Pencil aria-hidden="true" className="h-5 w-5" /> Edit Tempat Aman
          </>
        ) : (
          <>
            <Plus aria-hidden="true" className="h-5 w-5" /> Tambah Tempat Aman
          </>
        )}
      </h3>

      <div>
        <label
          htmlFor="place-name"
          className="block text-xs font-bold text-slate-700"
        >
          Nama tempat <span className="text-sos">*</span>
        </label>
        <input
          id="place-name"
          type="text"
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          maxLength={120}
          placeholder="mis. Pos Keamanan Harapan Indah"
          className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-200 px-3 text-sm font-semibold text-slate-800 focus:border-brand focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="place-type"
          className="block text-xs font-bold text-slate-700"
        >
          Kategori <span className="text-sos">*</span>
        </label>
        <select
          id="place-type"
          value={draft.type}
          onChange={(e) => set("type", e.target.value as PlaceDraft["type"])}
          className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-brand focus:outline-none"
        >
          {PLACE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="place-address"
          className="block text-xs font-bold text-slate-700"
        >
          Alamat
        </label>
        <input
          id="place-address"
          type="text"
          value={draft.address}
          onChange={(e) => set("address", e.target.value)}
          maxLength={200}
          placeholder="mis. Jl. Ahmad Yani, Bekasi"
          className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-200 px-3 text-sm font-semibold text-slate-800 focus:border-brand focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            htmlFor="place-open"
            className="block text-xs font-bold text-slate-700"
          >
            Jam buka
          </label>
          <input
            id="place-open"
            type="time"
            value={draft.open}
            onChange={(e) => set("open", e.target.value || "00:00")}
            className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-200 px-3 text-sm font-semibold text-slate-800 focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="place-close"
            className="block text-xs font-bold text-slate-700"
          >
            Jam tutup
          </label>
          <input
            id="place-close"
            type="time"
            value={draft.close}
            onChange={(e) => set("close", e.target.value || "00:00")}
            className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-200 px-3 text-sm font-semibold text-slate-800 focus:border-brand focus:outline-none"
          />
        </div>
      </div>
      <p className="text-[11px] font-semibold text-slate-500">
        Buka 24 jam: isi keduanya 00:00. Jam lintas tengah malam (mis. 18:00–02:00)
        juga boleh.
      </p>

      <div>
        <label
          htmlFor="place-phone"
          className="block text-xs font-bold text-slate-700"
        >
          Telepon (opsional)
        </label>
        <input
          id="place-phone"
          type="tel"
          value={draft.phone ?? ""}
          onChange={(e) => set("phone", e.target.value || null)}
          maxLength={20}
          placeholder="mis. 110"
          className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-200 px-3 text-sm font-semibold text-slate-800 focus:border-brand focus:outline-none"
        />
      </div>

      <div>
        <span className="block text-xs font-bold text-slate-700">
          Lokasi di peta <span className="text-sos">*</span>
        </span>
        <div className="mt-1">
          <LocationPicker
            value={{ lat: draft.lat, lng: draft.lng }}
            onChange={(v) => {
              setDraft((d) => ({ ...d, lat: v.lat, lng: v.lng }));
              setPinMoved(true);
            }}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm font-bold text-sos">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {busy
            ? "Menyimpan…"
            : isEdit
              ? "Simpan Perubahan"
              : "Tambah Tempat"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[48px] flex-1 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
