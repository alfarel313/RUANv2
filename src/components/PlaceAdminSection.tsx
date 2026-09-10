"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PLACE_CATEGORIES, PLACE_ICONS, PLACE_LABELS, type PlaceDraft } from "@/lib/places";
import type { PlaceData } from "@/lib/types";
import PlaceForm from "@/components/PlaceForm";

/** Tempat + id dokumen (untuk edit/hapus) */
export type PlaceWithId = PlaceData & { id: string; seeded?: boolean };

/** Konfirmasi hapus inline dua-langkah — bukan window.confirm (konsisten gaya) */
function DeleteConfirm({
  name,
  busy,
  onConfirm,
  onCancel,
}: {
  name: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-label={`Konfirmasi hapus ${name}`}
      className="mt-2 rounded-xl border-2 border-sos bg-sos/5 p-3"
    >
      <p className="text-sm font-bold text-slate-800">
        Yakin hapus <span className="text-sos">{name}</span>? Marker hilang dari
        peta.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="min-h-[44px] flex-1 rounded-xl bg-sos text-sm font-bold text-white hover:bg-sos/90 disabled:opacity-60"
        >
          {busy ? "Menghapus…" : "🗑️ Hapus"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] flex-1 rounded-xl border-2 border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

/**
 * Section /admin: kelola titik lokasi aman — tambah, edit (koordinat/jam/nama),
 * hapus dengan konfirmasi. Daftar live via onSnapshot (pola laporan/`/bahaya`).
 */
export default function PlaceAdminSection() {
  const [places, setPlaces] = useState<PlaceWithId[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PlaceWithId | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    // live: tempat tambahan/hasil edit admin langsung sinkron di peta semua tab
    const unsub = onSnapshot(
      collection(db, "places"),
      (snap) => {
        const list: PlaceWithId[] = [];
        snap.forEach((d) => {
          const p = d.data() as PlaceData;
          if (p.city === "Bekasi") {
            list.push({ ...p, id: d.id, seeded: (d.data() as { seeded?: boolean }).seeded });
          }
        });
        list.sort((a, b) => a.name.localeCompare(b.name));
        setPlaces(list);
      },
      () => setPlaces([]) // anti gagal demo: error → kosong, tak crash
    );
    return unsub;
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
    setNotice(null);
  };

  const openEdit = (p: PlaceWithId) => {
    setEditing(p);
    setFormOpen(true);
    setNotice(null);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const remove = async (id: string, name: string) => {
    setDeleteBusy(true);
    try {
      await deleteDoc(doc(db, "places", id));
      setDeletingId(null);
      setNotice(`🗑️ "${name}" dihapus dari peta.`);
    } catch (err) {
      console.error(err);
      setNotice("⚠️ Gagal menghapus — periksa koneksi lalu coba lagi.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const editingDraft: PlaceDraft | undefined = editing
    ? {
        name: editing.name,
        type: editing.type,
        lat: editing.lat,
        lng: editing.lng,
        address: editing.address,
        open: editing.open,
        close: editing.close,
        phone: editing.phone,
      }
    : undefined;

  return (
    <section aria-label="Kelola tempat aman" className="mt-8">
      <h2 className="text-base font-extrabold text-slate-700">
        📍 Kelola Tempat Aman ({places?.length ?? "…"})
      </h2>
      <p className="mt-1 text-xs font-semibold text-slate-500">
        Tambah, perbaiki koordinat, atau hapus titik lokasi aman. Perubahan
        langsung tampil live di peta.
      </p>

      {notice && (
        <p role="status" className="mt-2 text-sm font-bold text-brand">
          {notice}
        </p>
      )}

      {!formOpen && (
        <button
          type="button"
          onClick={openAdd}
          className="mt-2 min-h-[48px] w-full rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-dark"
        >
          ➕ Tambah Tempat Aman
        </button>
      )}

      {formOpen && (
        <PlaceForm
          key={editing?.id ?? "new"}
          editId={editing?.id ?? null}
          initial={editingDraft}
          onDone={() => {
            closeForm();
            setNotice(
              editing
                ? `💾 "${editing.name}" tersimpan — perubahan tampil di peta.`
                : "➕ Tempat baru tersimpan — marker tampil di peta."
            );
          }}
          onCancel={closeForm}
        />
      )}

      <div className="mt-3 space-y-2">
        {places === null && (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Memuat daftar tempat…
          </p>
        )}
        {places !== null && places.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Belum ada tempat — tambahkan titik lokasi aman pertama.
          </p>
        )}
        {places?.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border-2 border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-800">
                  <span aria-hidden="true">{PLACE_ICONS[p.type]}</span>{" "}
                  {p.name}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {PLACE_LABELS[p.type]} ·{" "}
                  {p.open === p.close
                    ? "24 jam"
                    : `Jam ${p.open}–${p.close}`}
                  {p.seeded === false && (
                    <span className="ml-1 text-brand">· kelola admin</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  aria-label={`Edit ${p.name}`}
                  className="min-h-[44px] min-w-[44px] rounded-xl border-2 border-brand bg-white text-sm font-bold text-brand hover:bg-brand/10"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingId(deletingId === p.id ? null : p.id)}
                  aria-label={`Hapus ${p.name}`}
                  className="min-h-[44px] min-w-[44px] rounded-xl border-2 border-sos bg-white text-sm font-bold text-sos hover:bg-sos/10"
                >
                  🗑️
                </button>
              </div>
            </div>
            {deletingId === p.id && (
              <DeleteConfirm
                name={p.name}
                busy={deleteBusy}
                onConfirm={() => remove(p.id, p.name)}
                onCancel={() => setDeletingId(null)}
              />
            )}
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] font-semibold text-slate-400">
        Kategori tersedia: {PLACE_CATEGORIES.map((c) => c.label).join(", ")}.
      </p>
    </section>
  );
}
